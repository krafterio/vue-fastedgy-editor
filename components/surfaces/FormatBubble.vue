<script setup>
import { NodeSelection } from '@tiptap/pm/state';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { useAnchoredRect } from '../../composables/anchored.js';
import AnchoredSurface from '../internal/AnchoredSurface.vue';
import ActionStrip from './ActionStrip.vue';

const props = defineProps({
    editor: { type: Object, required: true },
    actions: { type: Array, default: () => [] },
    labels: { type: Object, default: () => ({}) },
});

const shown = ref(false);

const { rect, follow } = useAnchoredRect(
    () => {
        const { from, to } = props.editor.state.selection;
        const start = props.editor.view.coordsAtPos(from);
        const end = props.editor.view.coordsAtPos(to);

        return new DOMRect(
            Math.min(start.left, end.left),
            start.top,
            Math.abs(end.right - start.left),
            end.bottom - start.top
        );
    },
    { within: () => props.editor.view.dom }
);

/**
 * A bubble appears only where **its** editor has the focus and words selected.
 *
 * Without the focus, two editors on a page both show one, or the neighbour's is
 * the one that answers. And a whole block taken as one — a picture, a rule — is
 * not something to put in bold: clicking a picture opens it, and a strip of
 * formatting over what has just filled the screen belongs to nothing.
 */
function read() {
    const { selection } = props.editor.state;

    shown.value =
        props.editor.isEditable && props.editor.isFocused && !selection.empty && !(selection instanceof NodeSelection);

    if (shown.value) {
        follow();
    }
}

onMounted(() => {
    props.editor.on('selectionUpdate', read);
    props.editor.on('transaction', read);
    props.editor.on('focus', read);
    props.editor.on('blur', read);
    read();
});

onBeforeUnmount(() => {
    props.editor.off('selectionUpdate', read);
    props.editor.off('transaction', read);
    props.editor.off('focus', read);
    props.editor.off('blur', read);
});
</script>

<template>
    <AnchoredSurface :open="shown && rect !== null" :rect="rect" side="top" align="center" @close="shown = false">
        <div class="fe-editor-floating" data-slot="editor-bubble">
            <ActionStrip :editor="editor" :actions="actions" :labels="labels" />
        </div>
    </AnchoredSurface>
</template>
