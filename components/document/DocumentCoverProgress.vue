<script setup>
import { ProgressIndicator, ProgressRoot } from 'reka-ui';

defineProps({
    /** How much of the cover is sent, out of a hundred. */
    sending: { type: Number, required: true },

    label: { type: String, default: '' },
});
</script>

<template>
    <!--
      A bar somebody can hear as well as see: reka carries the role and the
      values, and an upload that says nothing is an upload that looks stuck.
    -->
    <ProgressRoot
        data-slot="document-cover-progress"
        :model-value="sending"
        :max="100"
        :aria-label="label || undefined"
    >
        <ProgressIndicator data-slot="document-cover-progress-bar" :style="{ width: `${sending}%` }" />
    </ProgressRoot>
</template>
