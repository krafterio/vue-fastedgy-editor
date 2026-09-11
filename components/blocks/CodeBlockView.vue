<script setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, ref } from 'vue';

import { useRichTextControls } from '../../composables/controls.js';
import { useEditable } from '../../composables/editable.js';
import { useRichTextIcons } from '../../composables/icons.js';
import { richTextLabels } from '../../labels.js';
import { BlockContent } from '../internal/BlockContent.js';

const props = defineProps(nodeViewProps);
const editable = useEditable(props.editor);

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const copied = ref(false);
let clearing = null;

const labels = computed(() => ({ ...richTextLabels(), ...props.extension.options.labels }));

/** Every language the feature highlights, by its name, after guessing. */
const offered = computed(() => props.extension.options.languages?.() ?? []);
const languages = computed(() => [{ value: null, label: labels.value.auto }, ...offered.value]);
const nameOf = (value) => offered.value.find((language) => language.value === value)?.label ?? value;

/**
 * What the closed picker says: the language chosen, or what guessing made of
 * the code, both in one label so the bar never grows a second control.
 */
const shown = computed(() => {
    const chosen = props.node.attrs.language;

    if (chosen) {
        return nameOf(chosen);
    }

    const guessed = props.extension.options.detect?.(props.node.textContent) ?? null;

    return guessed ? `${labels.value.auto} · ${nameOf(guessed)}` : labels.value.auto;
});

/**
 * What a reader is told the code is: the language the block names, or the one
 * guessing made of it, by its name. Nothing where there is nothing to say.
 */
const language = computed(() => {
    const value = props.node.attrs.language || props.extension.options.detect?.(props.node.textContent) || null;

    return value ? nameOf(value) : '';
});

const choose = (language) => props.updateAttributes({ language });

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
            <!-- Chosen where the document can be written, and only said where it is read. -->
            <component
                :is="controls.picker"
                v-if="editable"
                :label="labels.language ?? ''"
                :options="languages"
                :selected="node.attrs.language"
                :shown="shown"
                :on-select="choose"
            />
            <span v-else-if="language" data-slot="editor-code-block-language">{{ language }}</span>

            <component :is="controls.tappable" :on-tap="copy" :tooltip="copyLabel">
                <component :is="icon(copied ? 'copied' : 'copy')" v-if="icon(copied ? 'copied' : 'copy')" />
                <span v-else>{{ copyLabel }}</span>
            </component>
        </div>

        <pre><BlockContent as="code" /></pre>
    </NodeViewWrapper>
</template>
