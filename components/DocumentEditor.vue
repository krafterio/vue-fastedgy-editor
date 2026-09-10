<script setup>
import { computed, ref } from 'vue';

import { createFeatures } from '../features/registry.js';
import { alongMargin, RangeDrag } from '../extensions/range-drag.js';
import { menuItemsOf } from '../menu/core.js';
import DocumentCover from './document/DocumentCover.vue';
import DocumentGutter from './document/DocumentGutter.vue';
import RichTextEditor from './RichTextEditor.vue';
import { richTextLabels } from '../labels.js';

const props = defineProps({
    features: { type: Object, default: () => createFeatures([]) },
    codec: { type: Object, default: null },
    editable: { type: Boolean, default: true },

    /**
     * The three modes of [00 §3.1], carried by the page rather than by the
     * field: what scrolls on a page is the page, and a field that scrolled
     * inside a scrolling page would give two bars for one document.
     */
    minHeight: { type: [String, Number], default: null },
    maxHeight: { type: [String, Number], default: null },
    fill: { type: Boolean, default: false },

    /** The stored path of the cover, and how a new one is chosen and kept. */
    cover: { type: String, default: '' },
    pickFile: { type: Function, default: null },
    storeCover: { type: Function, default: null },

    slashMenu: { type: Boolean, default: true },

    /** `false` where the application docks a `RichTextActionBar` of its own. */
    formatBubble: { type: Boolean, default: true },

    emptyPlaceholder: { type: String, default: '' },
    hintPlaceholder: { type: String, default: '' },
    labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:cover', 'ready']);

const model = defineModel({ type: String, default: '' });

const editor = ref(null);

/** The page carries the dragging of ranges; a field has no gutter to drag from. */
const features = computed(() => props.features.and([{ name: 'rangeDrag', extensions: [RangeDrag] }]));

/** What a block can be turned into, from the handle as well as from a slash. */
const items = computed(() => menuItemsOf(props.features));

/** What the package says, under what the application renamed. */
const said = computed(() => richTextLabels(props.labels));

const size = (value) => (typeof value === 'number' ? `${value}px` : value);

const style = computed(() => ({
    minHeight: props.fill ? '100%' : (size(props.minHeight) ?? undefined),
    maxHeight: props.fill ? '100%' : (size(props.maxHeight) ?? undefined),
    height: props.fill ? '100%' : undefined,
    overflowY: props.fill || props.maxHeight ? 'auto' : undefined,
}));

/**
 * Only what the blocks really occupy gives the focus.
 *
 * The blocks sit in a padded box, and a press in that padding lands on the
 * nearest block: pressing beside the document takes the caret back from the
 * field somebody had just opened. A drag that started in a block stays free to
 * leave, which is how a selection is extended.
 *
 * Only in that box, though: the header and the footer are the application's,
 * a title is typed in one, and refusing them the pointer refuses the title. The
 * gutter is in the box and outside the blocks by design, and a press refused
 * there is a drag that never starts.
 */
function outsideContent(event) {
    const blocks = editor.value?.view.dom.getBoundingClientRect();

    if (!blocks) {
        return false;
    }

    return (
        event.clientY < blocks.top ||
        event.clientY > blocks.bottom ||
        event.clientX < blocks.left ||
        event.clientX > blocks.right
    );
}

/**
 * The whole margin answers for the line beside it, hovered or dragged over.
 *
 * The extension only watches the blocks, so a pointer in the margin says nothing
 * to them: the handle stays on whatever it was last pointing at, and a block
 * dragged along the margin is never dropped. What listens is the page, so the
 * margin answers everywhere left of the text rather than over the width of the
 * handle: the column it is centred in is narrower than the page, and the room
 * beside it is room the pointer crosses.
 *
 * A drag has to be told it may land, and the browser that it must do nothing of
 * its own with what was dropped; a pointer merely passing needs neither.
 */
function onMargin(event) {
    const view = editor.value?.view;

    if (view && alongMargin(view, event) && event.type !== 'mousemove') {
        event.preventDefault();
    }
}

/**
 * The handle belongs to the pointer, and goes when the pointer leaves.
 *
 * The margin answers for lines the pointer is no longer near, so nothing takes
 * the handle back on its own: it stays hanging beside the last line it was asked
 * about, on a page nobody is pointing at any more.
 */
function onLeave() {
    const view = editor.value?.view;

    view?.dispatch(view.state.tr.setMeta('hideDragHandle', true));
}

function onPointerDown(event) {
    const at = event.target instanceof Element ? event.target : null;

    // The gutter lives in that box and stands outside the blocks by design:
    // refusing it the press refuses the drag it exists for.
    if (!at || at.closest('[data-slot="document-gutter"]')) {
        return;
    }

    if (at.closest('[data-slot="document-blocks"]') && outsideContent(event)) {
        event.preventDefault();
    }
}
</script>

<template>
    <div class="fe-document" data-slot="document" :style="{ containerType: 'inline-size' }">
        <div
            data-slot="document-scroll"
            :style="style"
            @pointerdown="onPointerDown"
            @mousemove="onMargin"
            @dragover="onMargin"
            @drop="onMargin"
            @mouseleave="onLeave"
        >
            <!-- The band a page opens on, replaceable whole by whoever mounts it. -->
            <slot name="cover">
                <DocumentCover
                    :path="cover"
                    :editable="editable"
                    :pick-file="pickFile"
                    :store="storeCover"
                    :labels="said"
                    @update:path="(path) => emit('update:cover', path)"
                />
            </slot>

            <div data-slot="document-column">
                <slot name="header" />

                <div data-slot="document-blocks">
                    <RichTextEditor
                        v-model="model"
                        :features="features"
                        :codec="codec"
                        :editable="editable"
                        :slash-menu="slashMenu"
                        :format-bubble="formatBubble"
                        :empty-placeholder="emptyPlaceholder"
                        :hint-placeholder="hintPlaceholder"
                        :labels="labels"
                        @ready="
                            (current) => {
                                editor = current;
                                emit('ready', current);
                            }
                        "
                    >
                        <template #leading>
                            <DocumentGutter v-if="editor && editable" :editor="editor" :items="items" :labels="said" />
                        </template>
                    </RichTextEditor>
                </div>

                <slot name="footer" />
            </div>
        </div>
    </div>
</template>
