<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { anchoredStyle, useAnchoredRect } from '../../composables/anchored.js';
import { useRichTextControls } from '../../composables/controls.js';

const props = defineProps({
    editor: { type: Object, required: true },

    /** The sources the mentions were written from, by model. */
    sources: { type: Array, default: () => [] },

    /** What opens what a mention points at, a route on the web. */
    open: { type: Function, default: null },
});

const controls = useRichTextControls();

const chip = ref(null);
const preview = ref(null);
const loading = ref(false);

// Per instance, and per chip: what was read once is read once.
const read = new Map();

const { rect, follow } = useAnchoredRect(() => chip.value?.getBoundingClientRect() ?? null);

const sourceOf = (model) => props.sources.find((source) => source.model === model) ?? null;

const recordOf = (element) => ({
    model: element.getAttribute('data-model'),
    id: Number(element.getAttribute('data-id')),
});

/**
 * Loaded on hovering and not before: a document holding forty mentions would
 * otherwise ask for forty records to show none of them.
 */
async function show(element) {
    const record = recordOf(element);
    const source = sourceOf(record.model);

    if (!source?.preview) {
        return;
    }

    chip.value = element;
    follow();

    const cached = `${record.model}:${record.id}`;

    if (read.has(cached)) {
        preview.value = read.get(cached);

        return;
    }

    preview.value = null;
    loading.value = true;

    const found = (await source.preview(record.id)) ?? null;

    read.set(cached, found);

    // The pointer may have moved on while the record was being read.
    if (chip.value === element) {
        preview.value = found;
    }

    loading.value = false;
}

function onOver(event) {
    const element = event.target instanceof Element ? event.target.closest('[data-mention]') : null;

    if (!element) {
        chip.value = null;
        preview.value = null;

        return;
    }

    void show(element);
}

function onClick(event) {
    const element = event.target instanceof Element ? event.target.closest('[data-mention]') : null;

    if (element && props.open) {
        event.preventDefault();
        props.open(recordOf(element));
    }
}

onMounted(() => {
    props.editor.view.dom.addEventListener('pointerover', onOver);
    props.editor.view.dom.addEventListener('click', onClick);
});

onBeforeUnmount(() => {
    props.editor.view.dom.removeEventListener('pointerover', onOver);
    props.editor.view.dom.removeEventListener('click', onClick);
});
</script>

<template>
    <div v-if="chip && (loading || preview)" data-slot="editor-mention-preview" :style="anchoredStyle(rect)">
        <template v-if="loading">
            <!-- A shape the size of what is coming, so the card does not jump when it lands. -->
            <component :is="controls.placeholder" :width="180" :height="14" />
            <component :is="controls.placeholder" :width="120" :height="12" />
        </template>

        <template v-else>
            <p data-slot="editor-mention-preview-title">{{ preview.title }}</p>

            <p v-for="(line, at) in preview.lines ?? []" :key="at" data-slot="editor-mention-preview-line">
                {{ line }}
            </p>
        </template>
    </div>
</template>
