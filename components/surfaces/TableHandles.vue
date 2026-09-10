<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

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
}

function clear(event) {
    if (!event.relatedTarget || !props.editor.view.dom.contains(event.relatedTarget)) {
        table.value = null;
        rect.value = null;
    }
}

onMounted(() => {
    props.editor.view.dom.addEventListener('pointermove', follow);
    props.editor.view.dom.addEventListener('pointerleave', clear);
});

onBeforeUnmount(() => {
    props.editor.view.dom.removeEventListener('pointermove', follow);
    props.editor.view.dom.removeEventListener('pointerleave', clear);
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

const at = (cell, side) => ({
    position: 'fixed',
    left: side === 'row' ? `${Math.round(rect.value.left - 16)}px` : `${Math.round(cell.left)}px`,
    top: side === 'row' ? `${Math.round(cell.top)}px` : `${Math.round(rect.value.top - 16)}px`,
    width: side === 'row' ? '14px' : `${Math.round(cell.width)}px`,
    height: side === 'row' ? `${Math.round(cell.height)}px` : '14px',
});
</script>

<template>
    <div v-if="rect && editor.isEditable" data-slot="editor-table-handles">
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
    </div>
</template>
