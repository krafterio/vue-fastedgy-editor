<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const props = defineProps({
    editor: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const table = ref(null);
const rect = ref(null);

/*
 * Where a handle is measured from.
 *
 * Not the viewport: a `fixed` handle is laid out against the nearest ancestor
 * carrying a transform, and an application that animates a panel in has one, so
 * every handle lands a panel's width away from its table. The holder is asked
 * where it actually sits and everything is placed against that, which stays true
 * whatever is between it and the page.
 */
const holder = useTemplateRef('holder');
const origin = ref({ left: 0, top: 0 });

/** The table the pointer is over, and the position it starts at. */
function follow(event) {
    const element = event.target instanceof Element ? event.target.closest('table') : null;
    const holder = props.editor.view.dom;

    if (!element || !holder.contains(element)) {
        table.value = null;
        rect.value = null;

        return;
    }

    table.value = element;
    rect.value = element.getBoundingClientRect();
    origin.value = holder.value?.getBoundingClientRect() ?? { left: 0, top: 0 };
}

function clear(event) {
    if (!event.relatedTarget || !props.editor.view.dom.contains(event.relatedTarget)) {
        table.value = null;
        rect.value = null;
    }
}

// The element the listeners were posted on, kept for the moment they are taken
// back: an editor being destroyed has no view left to ask.
let listening = null;

onMounted(() => {
    listening = props.editor.view.dom;
    props.editor.view.dom.addEventListener('pointermove', follow);
    props.editor.view.dom.addEventListener('pointerleave', clear);
});

onBeforeUnmount(() => {
    listening?.removeEventListener('pointermove', follow);
    listening?.removeEventListener('pointerleave', clear);
});

const columns = computed(() => {
    const cells = table.value?.rows?.[0]?.cells ?? [];

    return [...cells].map((cell) => cell.getBoundingClientRect());
});

const rows = computed(() => [...(table.value?.rows ?? [])].map((row) => row.getBoundingClientRect()));

/**
 * Runs [command] on the cell a handle points at.
 *
 * A table command reads the selection, so the selection goes there first: the
 * handle of the third column has to mean the third column, not wherever the
 * caret happened to be.
 */
function on(cell, command) {
    const at = props.editor.view.posAtCoords({ left: cell.left + 4, top: cell.top + 4 });

    if (!at) {
        return;
    }

    command(props.editor.chain().focus().setTextSelection(at.pos)).run();
}

const columnActions = (cell) => [
    {
        label: props.labels.insertLeft,
        icon: icon('insertLeft'),
        onTap: () => on(cell, (chain) => chain.addColumnBefore()),
    },
    {
        label: props.labels.insertRight,
        icon: icon('insertRight'),
        onTap: () => on(cell, (chain) => chain.addColumnAfter()),
    },
    {
        label: props.labels.duplicateColumn,
        icon: icon('duplicate'),
        onTap: () => on(cell, (chain) => chain.duplicateColumn()),
    },
    {
        label: props.labels.deleteColumn,
        icon: icon('delete'),
        destructive: true,
        separated: true,
        onTap: () => on(cell, (chain) => chain.deleteColumn()),
    },
];

const rowActions = (cell) => [
    {
        label: props.labels.insertAbove,
        icon: icon('insertAbove'),
        onTap: () => on(cell, (chain) => chain.addRowBefore()),
    },
    {
        label: props.labels.insertBelow,
        icon: icon('insertBelow'),
        onTap: () => on(cell, (chain) => chain.addRowAfter()),
    },
    {
        label: props.labels.duplicateRow,
        icon: icon('duplicate'),
        onTap: () => on(cell, (chain) => chain.duplicateRow()),
    },
    {
        label: props.labels.deleteRow,
        icon: icon('delete'),
        destructive: true,
        separated: true,
        onTap: () => on(cell, (chain) => chain.deleteRow()),
    },
];

const placed = (left, top, width, height) => ({
    position: 'absolute',
    left: `${Math.round(left - origin.value.left)}px`,
    top: `${Math.round(top - origin.value.top)}px`,
    width: `${Math.round(width)}px`,
    height: `${Math.round(height)}px`,
});

const at = (cell, side) =>
    side === 'row'
        ? placed(rect.value.left - 18, cell.top, 14, cell.height)
        : placed(cell.left, rect.value.top - 18, cell.width, 14);

/**
 * One more column, one more row: the two the mobile side offers as a plus at the
 * edge rather than through a menu, because they are what somebody filling a
 * table in reaches for over and over.
 */
const beyond = (side) =>
    side === 'column'
        ? placed(rect.value.right + 4, rect.value.top, 18, rect.value.height)
        : placed(rect.value.left, rect.value.bottom + 4, rect.value.width, 18);

function grow(side) {
    const cell = side === 'column' ? columns.value.at(-1) : rows.value.at(-1);

    if (cell) {
        on(cell, (chain) => (side === 'column' ? chain.addColumnAfter() : chain.addRowAfter()));
    }
}
</script>

<template>
    <!--
      The holder carries its own placement rather than taking it from the
      stylesheet: every handle is measured against it, so where it sits is part
      of what this does and not part of how it looks. Zero-sized and in the flow,
      it takes no room and is the box its handles are placed in, whatever the
      application has done to what is above it.
    -->
    <div ref="holder" data-slot="editor-table-handles" :style="{ position: 'relative', width: 0, height: 0 }">
        <template v-if="rect && editor.isEditable">
            <component
                :is="controls.menu"
                v-for="(cell, column) in columns"
                :key="`column-${column}`"
                :actions="columnActions(cell)"
                :label="labels.column"
                :style="at(cell, 'column')"
            >
                <component :is="icon('gripColumn')" v-if="icon('gripColumn')" />
            </component>

            <component
                :is="controls.menu"
                v-for="(cell, row) in rows"
                :key="`row-${row}`"
                :actions="rowActions(cell)"
                :label="labels.row"
                :style="at(cell, 'row')"
            >
                <component :is="icon('gripRow')" v-if="icon('gripRow')" />
            </component>

            <component
                :is="controls.tappable"
                data-slot="editor-table-grow"
                data-side="column"
                :style="beyond('column')"
                :tooltip="labels.addColumn ?? ''"
                :on-tap="() => grow('column')"
            >
                <component :is="icon('add')" v-if="icon('add')" />
            </component>

            <component
                :is="controls.tappable"
                data-slot="editor-table-grow"
                data-side="row"
                :style="beyond('row')"
                :tooltip="labels.addRow ?? ''"
                :on-tap="() => grow('row')"
            >
                <component :is="icon('add')" v-if="icon('add')" />
            </component>
        </template>
    </div>
</template>
