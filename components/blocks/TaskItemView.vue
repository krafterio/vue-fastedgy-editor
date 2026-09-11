<script setup>
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';

import { useEditable } from '../../composables/editable.js';
import { useRichTextIcons } from '../../composables/icons.js';
import { BlockContent } from '../internal/BlockContent.js';

const props = defineProps(nodeViewProps);
const editable = useEditable(props.editor);

const { icon } = useRichTextIcons();

const toggle = () => props.updateAttributes({ checked: !props.node.attrs.checked });
</script>

<template>
    <!--
      The box is drawn here rather than left to the extension: it is a square the
      theme colours, like everything else a document draws, and a checkbox the
      browser draws answers to nothing.
    -->
    <NodeViewWrapper as="li" data-slot="editor-task-item" :data-checked="node.attrs.checked || undefined">
        <button
            type="button"
            role="checkbox"
            data-slot="editor-task-check"
            contenteditable="false"
            :aria-checked="node.attrs.checked === true"
            :disabled="!editable"
            @click="toggle"
        >
            <component :is="icon('check')" v-if="node.attrs.checked && icon('check')" />
        </button>

        <BlockContent data-slot="editor-task-body" />
    </NodeViewWrapper>
</template>
