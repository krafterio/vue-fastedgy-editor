<script setup>
import { computed } from 'vue';

import { createFeatures } from '../features/registry.js';
import DocumentCover from './document/DocumentCover.vue';
import RichTextViewer from './RichTextViewer.vue';

const props = defineProps({
    value: { type: [String, Object], default: '' },

    /** What the document is made of, the same set the editor was given. */
    features: { type: Object, default: () => createFeatures([]) },
    codec: { type: Object, default: null },

    /** The page's three modes, the editor's word for word. */
    minHeight: { type: [String, Number], default: null },
    maxHeight: { type: [String, Number], default: null },
    fill: { type: Boolean, default: false },

    /** The stored path of the cover. */
    cover: { type: String, default: '' },

    labels: { type: Object, default: () => ({}) },
});

const size = (value) => (typeof value === 'number' ? `${value}px` : value);

const style = computed(() => ({
    minHeight: props.fill ? '100%' : (size(props.minHeight) ?? undefined),
    maxHeight: props.fill ? '100%' : (size(props.maxHeight) ?? undefined),
    height: props.fill ? '100%' : undefined,
    overflowY: props.fill || props.maxHeight ? 'auto' : undefined,
}));
</script>

<template>
    <div class="fe-document" data-slot="document-viewer" :style="{ containerType: 'inline-size' }">
        <!--
          The page in reading, built of the editor's elements so the one
          stylesheet lays both out alike: switched from one to the other, nothing
          moves. What the editor adds to write with, the gutter and the band that
          offers a cover, is what is not here.
        -->
        <div data-slot="document-scroll" :style="style">
            <slot name="cover">
                <DocumentCover :path="cover" :editable="false" />
            </slot>

            <div data-slot="document-column">
                <slot name="header" />

                <div data-slot="document-blocks">
                    <RichTextViewer :value="value" :features="features" :codec="codec" :labels="labels" />
                </div>

                <slot name="footer" />
            </div>
        </div>
    </div>
</template>
