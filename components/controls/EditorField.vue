<script setup>
import { useId } from 'vue';

defineProps({
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    leading: { type: [Object, Function], default: null },
    autofocus: { type: Boolean, default: false },
});

const model = defineModel({ type: String, default: '' });

// Unique per instance, or two fields on one page answer to the same label.
const id = useId();
</script>

<template>
    <div data-slot="editor-field">
        <label v-if="label" :for="id">{{ label }}</label>

        <component :is="leading" v-if="leading" data-slot="editor-field-leading" />

        <input :id="id" v-model="model" type="text" :placeholder="placeholder || undefined" :autofocus="autofocus" />
    </div>
</template>
