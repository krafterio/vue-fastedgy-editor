<script setup>
import DocumentCover from './document/DocumentCover.vue';
import RichTextViewer from './RichTextViewer.vue';

defineProps({
    value: { type: [String, Object], default: '' },
    codec: { type: Object, default: null },
    highlight: { type: Function, default: null },
    cover: { type: String, default: '' },
});

const emit = defineEmits(['mention']);
</script>

<template>
    <!--
      The page in reading: the column, the cover, the header and the footer, and
      no scrolling of its own. It gives itself to whatever scrolls around it.
    -->
    <div class="fe-document" data-slot="document-viewer">
        <slot name="cover">
            <DocumentCover :path="cover" :editable="false" />
        </slot>

        <div data-slot="document-column">
            <slot name="header" />

            <RichTextViewer
                :value="value"
                :codec="codec"
                :highlight="highlight"
                @mention="(record) => emit('mention', record)"
            />

            <slot name="footer" />
        </div>
    </div>
</template>
