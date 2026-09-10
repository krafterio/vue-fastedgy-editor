<script setup>
defineProps({
    label: { type: String, default: '' },
    onTap: { type: Function, default: null },

    /** What the button is for, never what it looks like. Three are enough. */
    kind: { type: String, default: 'neutral' },
});
</script>

<template>
    <button type="button" data-slot="editor-button" :data-kind="kind" @click="onTap?.()">
        <slot>{{ label }}</slot>
    </button>
</template>
