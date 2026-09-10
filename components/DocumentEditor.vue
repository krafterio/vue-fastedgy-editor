<script setup>
import { computed, ref } from 'vue';

import { createFeatures } from '../features/registry.js';
import { RangeDrag } from '../extensions/range-drag.js';
import { menuItemsOf } from '../menu/core.js';
import DocumentCover from './document/DocumentCover.vue';
import DocumentGutter from './document/DocumentGutter.vue';
import RichTextEditor from './RichTextEditor.vue';

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
 * The scrolling area covers the header, the footer and the margins, and a click
 * anywhere in it lands on the nearest block: clicking beside the document takes
 * the caret back from the field somebody had just opened. A drag that started in
 * a block stays free to leave, which is how a selection is extended.
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

function onPointerDown(event) {
    if (outsideContent(event)) {
        event.preventDefault();
    }
}
</script>

<template>
    <div class="fe-document" data-slot="document" :style="{ containerType: 'inline-size' }">
        <div data-slot="document-scroll" :style="style" @pointerdown="onPointerDown">
            <!-- The band a page opens on, replaceable whole by whoever mounts it. -->
            <slot name="cover">
                <DocumentCover
                    :path="cover"
                    :editable="editable"
                    :pick-file="pickFile"
                    :store="storeCover"
                    :labels="labels"
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
                            <DocumentGutter
                                v-if="editor && editable"
                                :editor="editor"
                                :items="items"
                                :labels="labels"
                            />
                        </template>
                    </RichTextEditor>
                </div>

                <slot name="footer" />
            </div>
        </div>
    </div>
</template>
