<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';

import { useAnchoredRect } from '../../composables/anchored.js';

/**
 * The card itself, loaded the first time a mention is tapped: what floats and
 * what it is drawn with stay out of a page where nobody taps one.
 */
const MentionCard = defineAsyncComponent(() => import('./MentionCard.vue'));

const props = defineProps({
    /** The element the text is drawn in, read once it is drawn. */
    text: { type: Function, required: true },

    /** The sources the mentions were written from, by model. */
    sources: { type: Array, default: () => [] },

    /** What opens what a mention points at, a route on the web. */
    open: { type: Function, default: null },

    /** Words the card says, by name. Nothing is shipped. */
    labels: { type: Object, default: () => ({}) },
});

const chip = ref(null);
const preview = ref(null);
const loading = ref(false);

// Whether a mention was ever tapped here, which is when the card is loaded.
const asked = ref(false);

// Per instance, and per chip: what was read once is read once.
const read = new Map();

const { rect, follow } = useAnchoredRect(() => chip.value?.getBoundingClientRect() ?? null);

const sourceOf = (model) => props.sources.find((source) => source.model === model) ?? null;

/** Whether the source of what is shown says its records can be gone to. */
const openable = computed(() => (chip.value ? sourceOf(recordOf(chip.value).model)?.openable === true : false));

const recordOf = (element) => ({
    model: element.getAttribute('data-model'),
    id: Number(element.getAttribute('data-id')),
});

/**
 * Read when the card is asked for, and not before: a document holding forty
 * mentions would otherwise ask for forty records to show none of them.
 */
async function show(element) {
    const record = recordOf(element);
    const source = sourceOf(record.model);

    if (!source?.preview) {
        return;
    }

    asked.value = true;
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

    // Another mention may have been asked for while the record was being read.
    if (chip.value === element) {
        preview.value = found;
    }

    loading.value = false;
}

/**
 * A tap shows the card, it does not follow the mention.
 *
 * As on mobile: what a mention points at is read before it is gone to, and the
 * card carries the way there when the record has one. Asked for rather than
 * offered: a card that opened on its own under a pointer merely reading covers
 * what is being read, again and again, line after line.
 */
function onClick(event) {
    const element = event.target instanceof Element ? event.target.closest('[data-mention]') : null;

    if (element) {
        event.preventDefault();
        void show(element);
    }
}

function follows() {
    if (chip.value) {
        props.open?.(recordOf(chip.value));
        chip.value = null;
    }
}

// The element the listeners were posted on, kept for the moment they are taken
// back: a text being taken away may have nothing left to answer with.
let listening = null;

onMounted(() => {
    listening = props.text();
    listening?.addEventListener('click', onClick);
});

onBeforeUnmount(() => {
    listening?.removeEventListener('click', onClick);
});
</script>

<template>
    <MentionCard
        v-if="asked"
        :shown="chip !== null && (loading || preview !== null)"
        :rect="rect"
        :loading="loading"
        :preview="preview"
        :action="Boolean(open) && openable"
        :labels="labels"
        @close="chip = null"
        @follow="follows"
    />
</template>
