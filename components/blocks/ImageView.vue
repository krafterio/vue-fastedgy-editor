<script setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useStorage } from 'vue-fastedgy';

import { attachmentId } from '../../features/image.js';

const props = defineProps(nodeViewProps);

const { attachmentUrl, fileUrl } = useStorage();

const frame = ref(null);
const dragging = ref(null);
const drawn = ref(null);

/**
 * Where the picture is read from.
 *
 * `attachment:15` is resolved by the storage client, a `data:` URI is already
 * the picture, and anything else is a stored path or an address written by hand.
 * Never built by hand here: what a storage URL looks like is not this package's
 * to know.
 */
const source = computed(() => {
    const address = props.node.attrs.src ?? '';
    const id = attachmentId(address);

    if (id !== null) {
        return attachmentUrl(id);
    }

    return /^[a-z][\w+.-]*:/i.test(address) ? address : (fileUrl(address) ?? address);
});

const size = computed(() => drawn.value ?? { width: props.node.attrs.width, height: props.node.attrs.height });

const style = computed(() => ({
    width: size.value.width ? `${Math.round(size.value.width)}px` : undefined,
    height: size.value.height ? `${Math.round(size.value.height)}px` : undefined,
}));

function startResize(event) {
    if (!props.editor.isEditable) {
        return;
    }

    const box = frame.value?.getBoundingClientRect();

    if (!box) {
        return;
    }

    dragging.value = { x: event.clientX, width: box.width, ratio: box.height / box.width };
    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', endResize);
}

function resize(event) {
    if (!dragging.value) {
        return;
    }

    const width = Math.max(48, dragging.value.width + (event.clientX - dragging.value.x));

    drawn.value = { width, height: width * dragging.value.ratio };
}

// Written once the gesture is over, never while it runs: one write per pixel
// dragged would fill the undo history with a single resize.
function endResize() {
    window.removeEventListener('pointermove', resize);
    window.removeEventListener('pointerup', endResize);

    if (drawn.value) {
        props.updateAttributes({
            width: Math.round(drawn.value.width),
            height: Math.round(drawn.value.height),
        });
    }

    dragging.value = null;
    drawn.value = null;
}

onBeforeUnmount(endResize);
</script>

<template>
    <NodeViewWrapper data-slot="editor-image" :data-selected="selected || undefined">
        <div ref="frame" data-slot="editor-image-frame" :style="style">
            <img v-fetcher-src.lazy :src="source" :alt="node.attrs.alt ?? ''" draggable="false" />

            <span
                v-if="editor.isEditable"
                data-slot="editor-image-handle"
                role="separator"
                aria-orientation="vertical"
                @pointerdown.prevent="startResize"
            />
        </div>
    </NodeViewWrapper>
</template>
