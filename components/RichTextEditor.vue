<script setup>
import { EditorContent } from '@tiptap/vue-3';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useFileDropZone } from 'vue-fastedgy';

import { useRichTextEditor, writeInto } from '../composables/editor.js';
import { createFeatures } from '../features/registry.js';
import { createMarkdownCodec } from '../markdown/codec.js';
import { actionsOf, menuItemsOf } from '../menu/core.js';
import FormatBubble from './surfaces/FormatBubble.vue';
import SlashMenu from './surfaces/SlashMenu.vue';
import { richTextLabels } from '../labels.js';

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

    /** `false` leaves the slash to be typed, and offers nothing. */
    slashMenu: { type: Boolean, default: true },

    /**
     * `false` where the application docks a `RichTextActionBar` of its own: two
     * strips offering the same thing is one too many, and the bubble is the one
     * a thumb cannot reach.
     */
    formatBubble: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'submit', 'ready']);

const model = defineModel({ type: String, default: '' });

const codec = computed(() => props.codec ?? createMarkdownCodec(props.features));
const menu = ref(null);

const editor = useRichTextEditor({
    features: props.features,
    codec: codec.value,
    content: model.value,
    editable: props.editable,
    emptyPlaceholder: props.emptyPlaceholder,
    hintPlaceholder: props.hintPlaceholder,

    onUpdate: (written, current) => {
        if (written !== model.value) {
            model.value = written;
        }

        if (props.resetWhenEmpty && current.isEmpty) {
            current.commands.clearNodes();
        }
    },

    onCreate: (current) => emit('ready', current),
});

// What the field is given from the outside, when it is not what it holds.
watch(model, (written) => {
    const current = editor.value;

    if (current && written !== codec.value.encode(current.getJSON())) {
        writeInto(current, codec.value.decode(written));
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

/**
 * A picture dragged anywhere on the page is one this would take.
 *
 * Said rather than done: the drop itself is still the image feature's, through
 * ProseMirror, which is what places the picture where the pointer let go. This
 * only tells the application that the place exists, so it can dim everything
 * that would swallow the file for nothing — a text field, the page itself.
 */
const body = useTemplateRef('body');

const { active: offered, over } = useFileDropZone(body, {
    accept: (kinds) => kinds.length > 0 && kinds.every((kind) => kind.startsWith('image/')),
});

const actions = computed(() => actionsOf(props.features));

/** What the package says, under what the application renamed. */
const said = computed(() => richTextLabels(props.labels));
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

        <div ref="body" data-slot="editor-body" :data-offered="offered || undefined" :data-over="over || undefined">
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
            <FormatBubble v-if="formatBubble" :editor="editor" :actions="actions" :labels="said" />

            <SlashMenu v-if="slashMenu" ref="menu" :editor="editor" :items="items" :labels="said" />

            <component :is="() => surface(editor, said)" v-for="(surface, at) in features.surfaces" :key="at" />
        </template>
    </div>
</template>
