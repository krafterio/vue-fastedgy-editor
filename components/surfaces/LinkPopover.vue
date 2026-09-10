<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { anchoredStyle, useAnchoredRect } from '../../composables/anchored.js';
import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';
import { safeHref } from '../../markdown/decode.js';

const props = defineProps({
    editor: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const link = ref(null);
const href = ref('');
const text = ref('');

const { rect, follow } = useAnchoredRect(() => {
    if (!link.value) {
        return null;
    }

    const start = props.editor.view.coordsAtPos(link.value.from);
    const end = props.editor.view.coordsAtPos(link.value.to);

    return new DOMRect(start.left, start.top, Math.max(end.right - start.left, 0), end.bottom - start.top);
});

/**
 * The link the caret sits in, or nothing.
 *
 * Read from this editor and never from "the" editor: a page holding two answers
 * for whichever asked, and the one with the focus is rarely the one that was.
 */
function read() {
    if (!props.editor.isEditable || !props.editor.isActive('link')) {
        link.value = null;
        follow();

        return;
    }

    const { from, to } = props.editor.state.selection;
    const range = markRange(from, to);

    link.value = range;
    href.value = props.editor.getAttributes('link').href ?? '';
    text.value = props.editor.state.doc.textBetween(range.from, range.to, ' ');
    follow();
}

/** How far the link under [from] runs, both ways. */
function markRange(from, to) {
    const type = props.editor.schema.marks.link;
    const { doc } = props.editor.state;
    let start = from;
    let end = to;

    while (start > 0 && type.isInSet(doc.resolve(start).marks())) {
        start--;
    }

    while (end < doc.content.size && type.isInSet(doc.resolve(end).marks())) {
        end++;
    }

    return { from: start, to: end };
}

// Filtered on the way in as well as on the way out: markdown comes from another
// client, and a document is a place people paste into.
const address = computed(() => safeHref(href.value.trim()));

function apply() {
    if (!link.value || address.value === null) {
        return;
    }

    const written = text.value.trim();
    const chain = props.editor.chain().focus();

    if (written.length > 0 && written !== props.editor.state.doc.textBetween(link.value.from, link.value.to, ' ')) {
        chain.insertContentAt(link.value, {
            type: 'text',
            text: written,
            marks: [{ type: 'link', attrs: { href: address.value } }],
        });
    } else {
        chain.extendMarkRange('link').setLink({ href: address.value });
    }

    chain.run();
}

function open() {
    if (address.value) {
        window.open(address.value, '_blank', 'noopener,noreferrer');
    }
}

function unlink() {
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run();
}

onMounted(() => {
    props.editor.on('selectionUpdate', read);
    props.editor.on('transaction', read);
    read();
});

onBeforeUnmount(() => {
    props.editor.off('selectionUpdate', read);
    props.editor.off('transaction', read);
});

watch(() => props.editor, read);
</script>

<template>
    <div v-if="link" data-slot="editor-link-popover" :style="anchoredStyle(rect)">
        <component :is="controls.field" v-model="href" :label="labels.address" :leading="icon('link')" autofocus />

        <component :is="controls.field" v-model="text" :label="labels.title" />

        <component :is="controls.button" :label="labels.apply" kind="primary" :on-tap="apply" />

        <component :is="controls.button" :label="labels.open" :on-tap="open" />

        <component :is="controls.button" :label="labels.unlink" kind="quiet" :on-tap="unlink" />
    </div>
</template>
