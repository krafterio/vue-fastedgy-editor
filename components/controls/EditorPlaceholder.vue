<script setup>
/**
 * A shape, never a spinner: a card that lands where its skeleton said it would
 * does not jump, and a skeleton of the wrong size trades a blank for a lurch.
 */
defineProps({
    width: { type: [Number, String], default: '100%' },
    height: { type: [Number, String], default: 16 },
    radius: { type: Number, default: 4 },
});

const size = (value) => (typeof value === 'number' ? `${value}px` : value);
</script>

<template>
    <div
        data-slot="editor-placeholder"
        aria-hidden="true"
        :style="{ width: size(width), height: size(height), borderRadius: `${radius}px` }"
    />
</template>
