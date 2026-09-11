<script setup>
import AnchoredSurface from '../internal/AnchoredSurface.vue';
import { useRichTextControls } from '../../composables/controls.js';

defineProps({
    /** Whether the card is up. */
    shown: { type: Boolean, default: false },

    /** Where the mention it is about is drawn. */
    rect: { type: Object, default: null },

    loading: { type: Boolean, default: false },
    preview: { type: Object, default: null },

    /** Whether the card offers the way to what the mention points at. */
    action: { type: Boolean, default: false },

    labels: { type: Object, default: () => ({}) },
});

defineEmits(['close', 'follow']);

const controls = useRichTextControls();
</script>

<template>
    <AnchoredSurface :open="shown" :rect="rect" @close="$emit('close')">
        <div class="fe-editor-floating" data-slot="editor-mention-preview">
            <template v-if="loading">
                <component :is="controls.placeholder" :width="180" :height="14" />
                <component :is="controls.placeholder" :width="120" :height="12" />
            </template>

            <!--
              Guarded rather than left to the surface being shut: what is drawn
              is settled in the same flush as what closed it, so the card renders
              once more with nothing to show before reka takes it away.
            -->
            <template v-else-if="preview">
                <div data-slot="editor-mention-preview-head">
                    <!-- One line tall: a mark stands beside the first line of the title, however many follow. -->
                    <span v-if="preview.leading" data-slot="editor-mention-preview-leading">
                        <component :is="preview.leading" />
                    </span>

                    <div data-slot="editor-mention-preview-said">
                        <p data-slot="editor-mention-preview-title">{{ preview.title }}</p>

                        <p v-if="preview.subtitle" data-slot="editor-mention-preview-subtitle">
                            {{ preview.subtitle }}
                        </p>
                    </div>
                </div>

                <dl v-if="preview.facts?.length" data-slot="editor-mention-preview-facts">
                    <template v-for="[said, value] in preview.facts" :key="said">
                        <dt>{{ said }}</dt>
                        <dd>{{ value }}</dd>
                    </template>
                </dl>

                <div v-if="action" data-slot="editor-mention-preview-action">
                    <component :is="controls.button" :label="labels.open ?? ''" :on-tap="() => $emit('follow')" />
                </div>
            </template>
        </div>
    </AnchoredSurface>
</template>
