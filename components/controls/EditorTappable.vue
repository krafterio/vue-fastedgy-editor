<script setup>
defineProps({
    onTap: { type: Function, default: null },
    active: { type: Boolean, default: false },
    radius: { type: Number, default: null },
    tooltip: { type: String, default: '' },
});
</script>

<template>
    <button
        type="button"
        data-slot="editor-tappable"
        :data-active="active || undefined"
        :title="tooltip || undefined"
        :aria-label="tooltip || undefined"
        :aria-pressed="active || undefined"
        :style="radius === null ? undefined : { borderRadius: `${radius}px` }"
        @click="onTap?.()"
    >
        <slot />
    </button>
</template>
