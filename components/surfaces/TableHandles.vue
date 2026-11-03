<script setup>
import { Selection } from '@tiptap/pm/state';
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

function show(element) {
    table.value = element;
    rect.value = element.getBoundingClientRect();
    origin.value = holder.value?.getBoundingClientRect() ?? { left: 0, top: 0 };
}

function hide() {
    table.value = null;
    rect.value = null;
}

/** Whether a handle's menu is open: the handle it hangs from has to stay. */
const menuOpen = () => Boolean(holder.value?.querySelector('[data-state="open"]'));

/*
 * Where the pointer is on the page decides, not whether it is in the editor:
 * over a table of this editor, its handles; over a handle, or anywhere while a
 * handle's menu is open, the same ones; anywhere else, none. Asked of the
 * editor alone, the handles went the moment the pointer left the table to
 * reach them.
 */
function follow(event) {
    const target = event.target instanceof Element ? event.target : null;

    if (holder.value?.contains(target) || (table.value && menuOpen())) {
        return;
    }

    const element = target?.closest('table');

    if (element && props.editor.view.dom.contains(element)) {
        show(element);
    } else if (table.value) {
        hide();
    }
}

onMounted(() => document.addEventListener('pointermove', follow));

onBeforeUnmount(() => document.removeEventListener('pointermove', follow));

// The cells heading each column and the rows, with where they are drawn: measured
// again with the table, which moves as the page scrolls and changes shape under a
// command.
const measured = (elements) => [...elements].map((element) => ({ element, box: element.getBoundingClientRect() }));

const columns = computed(() => (rect.value ? measured(table.value?.rows?.[0]?.cells ?? []) : []));

const rows = computed(() => (rect.value ? measured(table.value?.rows ?? []) : []));

/**
 * Runs [command] on the cell a handle points at, a row being reached by its
 * first cell.
 *
 * A table command reads the selection, so the selection goes there first: the
 * handle of the third column has to mean the third column, not wherever the
 * caret happened to be. The cell is asked by its element rather than by a point
 * of the page, where a handle may be standing.
 */
function on({ element }, command) {
    const cell = element.matches('td, th') ? element : element.querySelector('td, th');

    if (!cell) {
        return;
    }

    const { view } = props.editor;
    const inside = Selection.near(view.state.doc.resolve(view.posAtDOM(cell, 0)));

    command(props.editor.chain().focus().setTextSelection(inside.from)).run();

    // The table has another shape now, or is gone with its last row.
    requestAnimationFrame(() => (table.value?.isConnected ? show(table.value) : hide()));
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

/** The side of a grip, which stands astride the rule it takes, as on the mobile side. */
const GRIP = 14;

const at = ({ box }, side) =>
    side === 'row'
        ? placed(rect.value.left - GRIP / 2, box.top, GRIP, box.height)
        : placed(box.left, rect.value.top - GRIP / 2, box.width, GRIP);

/**
 * One more column, one more row: the two the mobile side offers as a plus at the
 * edge rather than through a menu, because they are what somebody filling a
 * table in reaches for over and over. Against the table, with no gap the
 * pointer would have to cross to reach them.
 */
const beyond = (side) =>
    side === 'column'
        ? placed(rect.value.right, rect.value.top, 18, rect.value.height)
        : placed(rect.value.left, rect.value.bottom, rect.value.width, 18);

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
                data-side="column"
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
                data-side="row"
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
