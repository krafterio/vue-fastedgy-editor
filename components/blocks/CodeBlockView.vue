<script setup>
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, ref } from 'vue';

import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';
import { codeBlockLanguages } from '../../features/code-block.js';

const props = defineProps(nodeViewProps);

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const copied = ref(false);
let clearing = null;

const labels = computed(() => props.extension.options.labels ?? {});

const languages = computed(() => [
    { value: null, label: labels.value.auto ?? 'auto' },
    ...codeBlockLanguages.map((language) => ({ value: language, label: language })),
]);

const copyLabel = computed(() => (copied.value ? labels.value.copied : labels.value.copy) ?? '');

async function copy() {
    await navigator.clipboard?.writeText(props.node.textContent);

    copied.value = true;
    clearTimeout(clearing);
    clearing = setTimeout(() => (copied.value = false), 2000);
}

onBeforeUnmount(() => clearTimeout(clearing));
</script>

<template>
    <NodeViewWrapper data-slot="editor-code-block">
        <div data-slot="editor-code-block-bar" contenteditable="false">
            <component
                :is="controls.picker"
                :label="labels.language ?? ''"
                :options="languages"
                :selected="node.attrs.language"
                :on-select="(language) => updateAttributes({ language })"
            />

            <component :is="controls.tappable" :on-tap="copy" :tooltip="copyLabel">
                <component :is="icon(copied ? 'copied' : 'copy')" v-if="icon(copied ? 'copied' : 'copy')" />
                <span v-else>{{ copyLabel }}</span>
            </component>
        </div>

        <pre><NodeViewContent as="code" /></pre>
    </NodeViewWrapper>
</template>
