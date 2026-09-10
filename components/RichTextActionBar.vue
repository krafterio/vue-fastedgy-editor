<script setup>
import { computed } from 'vue';

import { createFeatures } from '../features/registry.js';
import { actionsOf } from '../menu/core.js';
import ActionStrip from './surfaces/ActionStrip.vue';
import { richTextLabels } from '../labels.js';

/**
 * The same strip as the bubble, standing still where the application puts it.
 *
 * A bubble hangs over a selection, which is what a pointer wants and what a
 * thumb cannot use: it lands under the finger that made the selection, and the
 * keyboard takes the rest of the screen. Narrow, an application docks this
 * instead, wherever its own layout has room, and turns the bubble off.
 *
 * It draws nothing of itself: the application places it, and the injected
 * controls dress it, exactly as they dress the bubble.
 */
const props = defineProps({
    /** The editor it acts on, as `@ready` hands it over. */
    editor: { type: Object, default: null },

    /** The same set the editor was given, so the strip offers what it can do. */
    features: { type: Object, default: () => createFeatures([]) },

    /** Words the strip says, by name. Nothing is shipped. */
    labels: { type: Object, default: () => ({}) },
});

const actions = computed(() => actionsOf(props.features));

/** What the package says, under what the application renamed. */
const said = computed(() => richTextLabels(props.labels));
</script>

<template>
    <div v-if="editor" class="fe-editor" data-slot="editor-action-bar">
        <ActionStrip :editor="editor" :actions="actions" :labels="said" />
    </div>
</template>
