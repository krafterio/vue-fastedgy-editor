<script setup>
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3';
import { ref } from 'vue';

import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const props = defineProps({
    editor: { type: Object, required: true },

    /** What the block can be turned into, the entries of the "/" menu. */
    items: { type: Array, default: () => [] },

    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const over = ref(null);
const dragging = ref(false);

/**
 * What the pointer is on, or what it was on while it is being dragged.
 *
 * Hovering is what shows the handle, and dropping moves both the block and the
 * pointer: without holding on to it, the handle disappears from under the very
 * gesture that is using it.
 */
function onNodeChange({ node, pos }) {
    if (!dragging.value) {
        over.value = node ? { node, pos } : null;
        measure();
    }
}

/**
 * How tall the pointer's way to the handle is: the block it points at.
 *
 * The handle is drawn beside one line and is one line tall, and it is given up
 * the moment the pointer leaves the blocks. Leaving a paragraph of three lines
 * anywhere but its first, the pointer crosses the margin below the handle and it
 * vanishes before it is reached: there, and impossible to catch.
 *
 * So what the pointer walks into is as tall as the block, and the buttons sit at
 * its top. Nothing is drawn any bigger: the room is empty and only there to be
 * crossed.
 */
const reach = ref(null);

function measure() {
    const drawn = over.value ? props.editor.view.nodeDOM(over.value.pos) : null;
    const box = drawn instanceof Element ? drawn.getBoundingClientRect() : null;

    reach.value = box ? `${Math.round(box.height)}px` : null;
}

function insertBelow() {
    if (!over.value) {
        return;
    }

    const after = over.value.pos + over.value.node.nodeSize;

    props.editor
        .chain()
        .focus()
        .insertContentAt(after, { type: 'paragraph' })
        .setTextSelection(after + 1)
        .run();
}

const actions = () => [
    // Turning a block into another is the same list the "/" menu offers, said
    // from the handle rather than typed.
    ...props.items.map((item) => ({
        label: props.labels[item.name] ?? item.name,
        icon: icon(item.glyph ?? item.name),
        onTap: () => transform(item),
    })),
    {
        label: props.labels.duplicate,
        icon: icon('duplicate'),
        separated: props.items.length > 0,
        onTap: duplicate,
    },
    { label: props.labels.delete, icon: icon('delete'), destructive: true, separated: true, onTap: remove },
];

function transform(item) {
    if (!over.value) {
        return;
    }

    props.editor
        .chain()
        .focus()
        .setTextSelection(over.value.pos + 1)
        .run();
    item.run(props.editor);
}

function duplicate() {
    if (!over.value) {
        return;
    }

    const { node, pos } = over.value;

    props.editor
        .chain()
        .focus()
        .insertContentAt(pos + node.nodeSize, node.toJSON())
        .run();
}

function remove() {
    if (!over.value) {
        return;
    }

    const { node, pos } = over.value;

    props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
}
</script>

<template>
    <DragHandle :editor="editor" @node-change="onNodeChange" @dragstart="dragging = true" @dragend="dragging = false">
        <div
            data-slot="document-gutter"
            :data-shown="over !== null || dragging || undefined"
            :style="reach === null ? undefined : { minHeight: reach }"
        >
            <component :is="controls.tappable" :tooltip="labels.add ?? ''" :on-tap="insertBelow">
                <component :is="icon('add')" v-if="icon('add')" />
                <span v-else>+</span>
            </component>

            <!--
              The grip is what the block is dragged by, and a browser refuses to
              start an ancestor's drag from inside a form control: the menu is
              rendered as a button, so the grip has to say it is draggable
              itself. The handle listens for the `dragstart` that bubbles up.
            -->
            <component :is="controls.menu" draggable="true" :actions="actions()" :label="labels.block ?? ''">
                <component :is="icon('gripRow')" v-if="icon('gripRow')" />
                <span v-else>⋮</span>
            </component>
        </div>
    </DragHandle>
</template>
