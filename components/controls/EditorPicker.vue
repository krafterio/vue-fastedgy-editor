<script setup>
import {
    SelectContent,
    SelectItem,
    SelectItemText,
    SelectPortal,
    SelectRoot,
    SelectTrigger,
    SelectValue,
    SelectViewport,
} from 'reka-ui';

defineProps({
    label: { type: String, default: '' },

    /** `{ value, label }`, in the order they should be offered. */
    options: { type: Array, default: () => [] },

    selected: { type: [String, Number, null], default: null },
    onSelect: { type: Function, default: null },

    /** What the closed picker says, where it says more than the option chosen. */
    shown: { type: String, default: '' },
});
</script>

<template>
    <SelectRoot :model-value="selected" @update:model-value="onSelect?.($event)">
        <SelectTrigger data-slot="editor-picker" :aria-label="label || undefined">
            <SelectValue v-if="shown" :placeholder="label">{{ shown }}</SelectValue>
            <SelectValue v-else :placeholder="label" />
        </SelectTrigger>

        <SelectPortal>
            <SelectContent data-slot="editor-picker-content" position="popper">
                <SelectViewport>
                    <SelectItem v-for="option in options" :key="option.value" :value="option.value">
                        <SelectItemText>{{ option.label }}</SelectItemText>
                    </SelectItem>
                </SelectViewport>
            </SelectContent>
        </SelectPortal>
    </SelectRoot>
</template>
