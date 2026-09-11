<script setup>
import { computed } from 'vue';

import { createRichTextReader } from '../../render/rich-text.js';

const props = defineProps({
    /** The document to draw, markdown or a decoded document. */
    value: { type: [String, Object], default: '' },

    /** What the document is made of. */
    features: { type: Object, required: true },

    /** How to read [value] when it is markdown, the features' own by default. */
    codec: { type: Object, default: null },

    /** What an editor that has just opened it says on its empty line, `({ node, empty }) => words`. */
    placeholder: { type: Function, default: null },
});

const reader = computed(() => createRichTextReader(props.features));
const codec = computed(() => props.codec ?? reader.value.codec);

const document = computed(() =>
    typeof props.value === 'string' ? codec.value.decode(props.value) : (props.value ?? { type: 'doc', content: [] })
);

const blocks = computed(() => reader.value.draw(document.value, { placeholder: props.placeholder }));
</script>

<template>
    <!--
      The element the editor's view writes in, drawn with the blocks the editor
      would draw in it, and nothing mounted to edit: what the viewer shows, and
      what an editor shows while it is still being built.
    -->
    <div class="tiptap ProseMirror">
        <component :is="() => blocks" />
    </div>
</template>
