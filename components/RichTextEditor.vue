<script setup>
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { computed, ref, watch } from 'vue';

import { useImageCarrier } from '../composables/pictures.js';
import { richTextClipboard } from '../extensions/clipboard.js';
import { coreExtensions } from '../extensions/schema.js';
import { createFeatures } from '../features/registry.js';
import { createMarkdownCodec } from '../markdown/codec.js';
import { actionsOf, menuItemsOf } from '../menu/core.js';
import FormatBubble from './surfaces/FormatBubble.vue';
import SlashMenu from './surfaces/SlashMenu.vue';

const props = defineProps({
    features: { type: Object, default: () => createFeatures([]) },

    /** How the field stores what is written: markdown by default. */
    codec: { type: Object, default: null },

    editable: { type: Boolean, default: true },

    /** Longueurs CSS, or a number of pixels. */
    maxWidth: { type: [String, Number], default: null },
    minHeight: { type: [String, Number], default: null },
    maxHeight: { type: [String, Number], default: null },

    /** Takes the height of its container, which has to be a bounded one. */
    fill: { type: Boolean, default: false },

    emptyPlaceholder: { type: String, default: '' },
    hintPlaceholder: { type: String, default: '' },

    /** A field emptied of its words goes back to a paragraph. */
    resetWhenEmpty: { type: Boolean, default: false },

    /** Words the surfaces say, by name. Nothing is shipped. */
    labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue', 'submit', 'ready']);

const model = defineModel({ type: String, default: '' });

const codec = computed(() => props.codec ?? createMarkdownCodec(props.features));
const carrier = useImageCarrier();
const menu = ref(null);

const editor = useEditor({
    editable: props.editable,
    content: codec.value.decode(model.value),
    extensions: [
        ...coreExtensions(),
        ...props.features.extensions,
        Placeholder.configure({
            placeholder: ({ editor: current, node }) =>
                current.isEmpty ? props.emptyPlaceholder : node.type.name === 'paragraph' ? props.hintPlaceholder : '',
        }),
        richTextClipboard({ codec: codec.value, ...carrier }),
    ],

    onUpdate: ({ editor: current }) => {
        const written = codec.value.encode(current.getJSON());

        if (written !== model.value) {
            model.value = written;
        }

        if (props.resetWhenEmpty && current.isEmpty) {
            current.commands.clearNodes();
        }
    },

    onCreate: ({ editor: current }) => emit('ready', current),
});

// What the field is given from the outside, when it is not what it holds.
watch(model, (written) => {
    const current = editor.value;

    if (current && written !== codec.value.encode(current.getJSON())) {
        current.commands.setContent(codec.value.decode(written), { emitUpdate: false });
    }
});

watch(
    () => props.editable,
    (editable) => editor.value?.setEditable(editable)
);

const size = (value) => (typeof value === 'number' ? `${value}px` : value);

/**
 * Three modes, and one of them writes no `overflow` at all: a container that
 * scrolls clips what leaves it, and what leaves it here is a bubble.
 */
const style = computed(() => ({
    maxWidth: size(props.maxWidth) ?? undefined,
    minHeight: props.fill ? '100%' : (size(props.minHeight) ?? undefined),
    maxHeight: props.fill ? '100%' : (size(props.maxHeight) ?? undefined),
    overflowY: props.fill || props.maxHeight ? 'auto' : undefined,
}));

const actions = computed(() => actionsOf(props.features));
const items = computed(() => menuItemsOf(props.features));

/**
 * Enter sends where a field asks it to, unless a feature is holding the key: a
 * mention being picked, a line being written in a fence.
 */
function onKeyDown(event) {
    const current = editor.value;

    if (event.key !== 'Enter' || event.shiftKey || !current) {
        return;
    }

    if (menu.value?.isOpen() || props.features.holdsEnter({ editor: current })) {
        return;
    }

    event.preventDefault();
    emit('submit', model.value);
}
</script>

<template>
    <div class="fe-editor" data-slot="editor" :data-fill="fill || undefined">
        <slot name="header" />

        <div data-slot="editor-body">
            <slot name="leading" />

            <EditorContent
                v-if="editor"
                :editor="editor"
                data-slot="editor-content"
                :style="style"
                @keydown="onKeyDown"
            />

            <slot name="trailing" />
        </div>

        <slot name="footer" />

        <template v-if="editor">
            <FormatBubble :editor="editor" :actions="actions" :labels="labels" />

            <SlashMenu ref="menu" :editor="editor" :items="items" :labels="labels" />

            <component :is="() => surface(editor)" v-for="(surface, at) in features.surfaces" :key="at" />
        </template>
    </div>
</template>
