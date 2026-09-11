<script setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useStorage } from 'vue-fastedgy';

import { useEditable } from '../../composables/editable.js';
import { attachmentId } from '../../features/image.js';
import { richTextLabels } from '../../labels.js';

const props = defineProps(nodeViewProps);
const editable = useEditable(props.editor);

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

/**
 * Taking hold of the handle takes hold of the picture.
 *
 * A click on the picture opens it, so the handle is the one place left that can
 * select the node — and selecting it is what makes a picture something to move,
 * copy or delete, rather than something to look at.
 */
function startResize(event) {
    if (!props.editor.isEditable) {
        return;
    }

    const position = props.getPos();

    // The focus with it, or the keyboard goes on talking to wherever the caret
    // was and backspace deletes a letter somewhere else.
    if (typeof position === 'number') {
        props.editor.chain().focus().setNodeSelection(position).run();
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

/**
 * A click opens the picture at full size: the application's own viewer where it
 * lent one, the package's lightbox otherwise.
 *
 * The press never reaches ProseMirror, which would take the picture as a whole
 * and put the browser's own selection on it — and setting a selection scrolls it
 * into view, so the document moved under a picture that had just filled the
 * screen. Taking hold of the picture is the handle's job, and it says so.
 */
function open() {
    const picture = { src: props.node.attrs.src ?? '', alt: props.node.attrs.alt ?? '' };

    if (props.extension.options.open) {
        props.extension.options.open(picture, around(picture));

        return;
    }

    opened.value = picture;
}

/**
 * Every picture of the document this one is drawn in, in order, and where it
 * stands among them, for a viewer that goes from one to the next.
 *
 * Read off the page rather than off the document: a reader mounts no editor
 * and tells its pictures nothing of the rest, while both draw every picture
 * here, its address on it.
 */
function around(picture) {
    const own = frame.value?.closest('[data-slot="editor-image"]') ?? null;
    const drawn = [...(own?.closest('.fe-editor')?.querySelectorAll('[data-slot="editor-image"]') ?? [])];
    const index = drawn.indexOf(own);

    if (index < 0) {
        return { pictures: [picture], index: 0 };
    }

    return {
        pictures: drawn.map((one) => ({ src: one.dataset.picture ?? '', alt: one.dataset.alt ?? '' })),
        index,
    };
}

/**
 * The picture shown at full size, by the picture itself: it is drawn written
 * and read alike, so it opens the same in both, with nothing for an editor to
 * pass on. Mounted when asked for, and gone when closed.
 */
const opened = ref(null);

const words = computed(() => ({ ...richTextLabels(), ...props.extension.options.labels }));
</script>

<template>
    <NodeViewWrapper
        data-slot="editor-image"
        :data-selected="selected || undefined"
        :data-picture="node.attrs.src ?? ''"
        :data-alt="node.attrs.alt ?? ''"
    >
        <div ref="frame" data-slot="editor-image-frame" :style="style">
            <img
                v-fetcher-src.lazy
                :src="source"
                :alt="node.attrs.alt ?? ''"
                draggable="false"
                data-openable=""
                @mousedown.prevent.stop
                @click.stop="open"
            />

            <span
                v-if="editable"
                data-slot="editor-image-handle"
                role="separator"
                aria-orientation="vertical"
                @pointerdown.prevent="startResize"
            />
        </div>

        <component
            :is="extension.options.viewer"
            v-if="opened && extension.options.viewer"
            :picture="opened"
            :labels="words"
            @close="opened = null"
        />
    </NodeViewWrapper>
</template>
