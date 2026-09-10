<script setup>
import { ProgressIndicator, ProgressRoot } from 'reka-ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStorage } from 'vue-fastedgy';

import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const props = defineProps({
    /** The stored path the record holds, never a URL built here. */
    path: { type: String, default: '' },

    editable: { type: Boolean, default: true },

    /** What a chosen file becomes: the path it was stored at. */
    store: { type: Function, default: null },

    pickFile: { type: Function, default: null },
    labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:path']);

const controls = useRichTextControls();
const { icon } = useRichTextIcons();
const { fileUrl } = useStorage();

const band = ref(null);
const sending = ref(null);

/**
 * The width asked for, rounded **up to the next step**.
 *
 * A window being resized would otherwise ask for one download per pixel. The
 * band is covered either way, and the surplus is cropped here.
 */
const STEP = 200;

const asked = ref(STEP);

// Watched rather than read once: a computed reading the DOM never runs again,
// and the band would keep the width it happened to have when it was drawn.
let watching = null;

function measure() {
    const wide = band.value?.getBoundingClientRect().width ?? 0;

    asked.value = Math.max(STEP, Math.ceil(wide / STEP) * STEP);
}

onMounted(() => {
    if (typeof ResizeObserver === 'undefined' || !band.value) {
        return measure();
    }

    watching = new ResizeObserver(measure);
    watching.observe(band.value);
});

onBeforeUnmount(() => watching?.disconnect());

const source = computed(() => (props.path ? fileUrl(props.path, { params: { width: asked.value } }) : ''));

async function replace() {
    const file = await props.pickFile?.();

    if (!file || !props.store) {
        return;
    }

    // A progress bar rather than a second upload: what is being sent is said,
    // and the actions are out of the way while it is.
    sending.value = 0;

    const stored = await props.store(file, (done) => (sending.value = done));

    sending.value = null;

    if (stored) {
        emit('update:path', stored);
    }
}

const actions = computed(() => [
    { name: 'replace', glyph: 'image', run: replace },
    { name: 'clear', glyph: 'delete', run: () => emit('update:path', '') },
]);
</script>

<template>
    <!--
      Edge to edge and above the header rather than on the column, and it scrolls
      with the rest instead of staying pinned.
    -->
    <div v-if="path || (editable && pickFile)" ref="band" data-slot="document-cover">
        <img v-if="source" v-fetcher-src.lazy :src="source" alt="" />

        <!--
          A bar somebody can hear as well as see: reka carries the role and the
          values, and an upload that says nothing is an upload that looks stuck.
        -->
        <ProgressRoot
            v-if="sending !== null"
            data-slot="document-cover-progress"
            :model-value="sending"
            :max="100"
            :aria-label="labels.sending ?? undefined"
        >
            <ProgressIndicator data-slot="document-cover-progress-bar" :style="{ width: `${sending}%` }" />
        </ProgressRoot>

        <div v-else-if="editable" data-slot="document-cover-actions">
            <component
                :is="controls.tappable"
                v-for="action in actions"
                :key="action.name"
                :tooltip="labels[action.name] ?? ''"
                :on-tap="action.run"
            >
                <component :is="icon(action.glyph)" v-if="icon(action.glyph)" />
                <span v-else>{{ labels[action.name] ?? action.name }}</span>
            </component>
        </div>
    </div>
</template>
