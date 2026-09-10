<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useAnchoredRect } from '../../composables/anchored.js';
import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';
import AnchoredSurface from '../internal/AnchoredSurface.vue';

const props = defineProps({
    editor: { type: Object, required: true },
    actions: { type: Array, default: () => [] },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

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
 * A bubble appears only where **its** editor has the focus and something
 * selected. Without the focus, two editors on a page both show one, or the
 * neighbour's is the one that answers.
 */
function read() {
    shown.value = props.editor.isEditable && props.editor.isFocused && !props.editor.state.selection.empty;

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

const offered = computed(() =>
    props.actions.filter((action) => (action.isEnabled ? action.isEnabled(props.editor) : true))
);
</script>

<template>
    <AnchoredSurface :open="shown && rect !== null" :rect="rect" side="top" align="center" @close="shown = false">
        <div class="fe-editor-floating" data-slot="editor-bubble">
            <component
                :is="controls.tappable"
                v-for="action in offered"
                :key="action.name"
                :active="action.isActive?.(editor) === true"
                :tooltip="labels[action.name] ?? ''"
                :on-tap="() => action.run(editor)"
            >
                <component :is="icon(action.glyph ?? action.name)" v-if="icon(action.glyph ?? action.name)" />
                <span v-else>{{ labels[action.name] ?? action.name }}</span>
            </component>
        </div>
    </AnchoredSurface>
</template>
