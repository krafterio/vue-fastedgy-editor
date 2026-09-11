<script setup>
import { computed, useTemplateRef } from 'vue';

import { createFeatures } from '../features/registry.js';
import { richTextLabels } from '../labels.js';
import RichTextBlocks from './internal/RichTextBlocks.vue';

const props = defineProps({
    /** The document to draw, markdown or a decoded document. */
    value: { type: [String, Object], default: '' },

    /** What the document is made of, the same set the editor was given. */
    features: { type: Object, default: () => createFeatures([]) },

    /** How to read [value] when it is markdown, the features' own by default. */
    codec: { type: Object, default: null },

    /** The editor's three modes, so a field switched from one to the other keeps its size. */
    maxWidth: { type: [String, Number], default: null },
    minHeight: { type: [String, Number], default: null },
    maxHeight: { type: [String, Number], default: null },
    fill: { type: Boolean, default: false },

    /** Words the features say, over the package's, as the editor takes them. */
    labels: { type: Object, default: () => ({}) },
});

const said = computed(() => richTextLabels(props.labels));
const blocks = useTemplateRef('blocks');

const size = (value) => (typeof value === 'number' ? `${value}px` : value);

/** The editor's, word for word, and on the same element. */
const style = computed(() => ({
    maxWidth: size(props.maxWidth) ?? undefined,
    minHeight: props.fill ? '100%' : (size(props.minHeight) ?? undefined),
    maxHeight: props.fill ? '100%' : (size(props.maxHeight) ?? undefined),
    overflowY: props.fill || props.maxHeight ? 'auto' : undefined,
}));
</script>

<template>
    <div class="fe-editor" data-slot="editor-viewer" :data-fill="fill || undefined">
        <!--
          No engine, and that is the whole point: nothing here edits, so nothing
          is mounted to edit with, and nothing that only writing needs is
          loaded. What draws the blocks is what draws them in the editor, and
          the elements around them are the editor's too, so the one stylesheet
          lays both out alike.
        -->
        <div data-slot="editor-body">
            <div data-slot="editor-content" :style="style">
                <RichTextBlocks ref="blocks" :value="value" :features="features" :codec="codec" />
            </div>
        </div>

        <component
            :is="() => surface(() => blocks?.$el ?? null, said)"
            v-for="(surface, at) in features.readingSurfaces"
            :key="at"
        />
    </div>
</template>
