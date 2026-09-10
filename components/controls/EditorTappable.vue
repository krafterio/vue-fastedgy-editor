<script setup>
import { Toggle } from 'reka-ui';

/**
 * A button that says what it does and whether it is already done.
 *
 * `Toggle` rather than a bare button: it is what carries the pressed state to a
 * screen reader and writes the `data-state` an application dresses it with, and
 * both of those are the same work in every application.
 */
defineProps({
    onTap: { type: Function, default: null },
    active: { type: Boolean, default: false },
    radius: { type: Number, default: null },
    tooltip: { type: String, default: '' },

    /** Offered but out of reach right now: undo with nothing to undo. */
    disabled: { type: Boolean, default: false },
});
</script>

<template>
    <Toggle
        data-slot="editor-tappable"
        :model-value="active"
        :disabled="disabled"
        :aria-label="tooltip || undefined"
        :title="tooltip || undefined"
        :style="radius === null ? undefined : { borderRadius: `${radius}px` }"
        @update:model-value="onTap?.()"
    >
        <slot />
    </Toggle>
</template>
