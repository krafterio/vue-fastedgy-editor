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
import { ref } from 'vue';

defineProps({
    label: { type: String, default: '' },

    /** `{ value, label }`, in the order they should be offered. */
    options: { type: Array, default: () => [] },

    selected: { type: [String, Number, null], default: null },
    onSelect: { type: Function, default: null },

    /** What the closed picker says, where it says more than the option chosen. */
    shown: { type: String, default: '' },
});

/**
 * Whether the options were ever asked for. Closed, a select still builds every
 * option to find the one it names, and a code block offers every language
 * there is: a picker told what it shows builds them once somebody opens it.
 */
const opened = ref(false);
</script>

<template>
    <SelectRoot
        :model-value="selected"
        @update:model-value="onSelect?.($event)"
        @update:open="(open) => open && (opened = true)"
    >
        <SelectTrigger data-slot="editor-picker" :aria-label="label || undefined">
            <SelectValue v-if="shown" :placeholder="label">{{ shown }}</SelectValue>
            <SelectValue v-else :placeholder="label" />
        </SelectTrigger>

        <SelectPortal>
            <SelectContent data-slot="editor-picker-content" position="popper">
                <SelectViewport>
                    <template v-if="opened || !shown">
                        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
                            <SelectItemText>{{ option.label }}</SelectItemText>
                        </SelectItem>
                    </template>
                </SelectViewport>
            </SelectContent>
        </SelectPortal>
    </SelectRoot>
</template>
