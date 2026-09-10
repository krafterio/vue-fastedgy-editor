<script setup>
import { Primitive } from 'reka-ui';

/**
 * What a button is for, never what it looks like. Three kinds are enough.
 *
 * `Primitive` rather than a bare tag: it is what lets an application render this
 * as whatever it dresses buttons with, `as-child` included, without this knowing.
 */
defineProps({
    label: { type: String, default: '' },
    onTap: { type: Function, default: null },
    kind: { type: String, default: 'neutral' },
});
</script>

<template>
    <Primitive as="button" type="button" data-slot="editor-button" :data-kind="kind" @click="onTap?.()">
        <slot>{{ label }}</slot>
    </Primitive>
</template>
