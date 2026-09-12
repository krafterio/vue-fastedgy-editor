<script setup>
defineProps({
    /** A **component**, never a built node. */
    leading: { type: [Object, Function], default: null },

    title: { type: String, default: '' },
    subtitle: { type: String, default: null },
});
</script>

<template>
    <div data-slot="editor-mention-preview-head">
        <span v-if="leading" data-slot="editor-mention-preview-leading">
            <component :is="leading" />
        </span>

        <div data-slot="editor-mention-preview-said">
            <p data-slot="editor-mention-preview-title">{{ title }}</p>

            <p v-if="subtitle" data-slot="editor-mention-preview-subtitle">{{ subtitle }}</p>
        </div>
    </div>
</template>
