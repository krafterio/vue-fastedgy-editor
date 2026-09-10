<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';

import { useAnchoredRect } from '../../composables/anchored.js';
import AnchoredSurface from '../internal/AnchoredSurface.vue';
import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const props = defineProps({
    editor: { type: Object, required: true },
    items: { type: Array, default: () => [] },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

const open = ref(null);
const at = ref(0);

/**
 * Where a menu was closed on purpose.
 *
 * The slash stays written, so what says a menu is open would say it again on the
 * very next keystroke. Closing is remembered against the position it was closed
 * at: type somewhere else, or type another slash, and the menu is offered again.
 */
const dismissed = ref(null);

// Unique per instance: two editors on a page announce their own list.
const id = useId();

const { rect, follow } = useAnchoredRect(
    () => {
        if (!open.value) {
            return null;
        }

        const { left, top, bottom } = props.editor.view.coordsAtPos(open.value.from);

        return new DOMRect(left, top, 0, bottom - top);
    },
    { within: () => props.editor.view.dom }
);

/**
 * The "/" being written, and what was typed after it.
 *
 * Read from the text itself rather than from a plugin: the slash is a character
 * somebody typed, it stays in the document while the menu is up, and closing the
 * menu leaves it exactly where it was.
 */
function read() {
    const { selection, doc } = props.editor.state;

    if (!props.editor.isEditable || !selection.empty) {
        return close();
    }

    // Somewhere else entirely: what was closed is forgotten.
    if (dismissed.value !== null && selection.from <= dismissed.value) {
        dismissed.value = null;
    }

    const to = selection.from;
    const start = selection.$from.start();
    const written = doc.textBetween(start, to, '\n', '￼');
    const found = /(?:^|\s)\/([^\s/]*)$/.exec(written);

    if (!found) {
        return close();
    }

    const from = to - found[1].length - 1;

    if (dismissed.value === from) {
        return;
    }

    open.value = { from, to, query: found[1].toLowerCase() };
    at.value = 0;
    follow();
}

function close({ onPurpose = false } = {}) {
    if (onPurpose && open.value) {
        dismissed.value = open.value.from;
    }

    open.value = null;
    at.value = 0;
}

const offered = computed(() => {
    const query = open.value?.query ?? '';

    return props.items.filter(
        (item) =>
            query.length === 0 ||
            (props.labels[item.name] ?? item.name).toLowerCase().includes(query) ||
            (item.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(query))
    );
});

function pick(item) {
    if (!open.value || !item) {
        return;
    }

    const { from, to } = open.value;

    close();
    props.editor.chain().focus().deleteRange({ from, to }).run();
    item.run(props.editor);
}

function onKeyDown(event) {
    if (!open.value || offered.value.length === 0) {
        return;
    }

    if (event.key === 'ArrowDown') {
        at.value = (at.value + 1) % offered.value.length;
    } else if (event.key === 'ArrowUp') {
        at.value = (at.value - 1 + offered.value.length) % offered.value.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        pick(offered.value[at.value]);
    } else if (event.key === 'Escape') {
        // The slash stays written: it was typed, and closing a menu is not a
        // reason to take somebody's character away.
        close({ onPurpose: true });
    } else {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
}

// The element the listeners were posted on, kept for the moment they are taken
// back: an editor being destroyed has no view left to ask.
let listening = null;

onMounted(() => {
    listening = props.editor.view.dom;
    props.editor.on('transaction', read);
    props.editor.view.dom.addEventListener('keydown', onKeyDown, true);
});

onBeforeUnmount(() => {
    props.editor.off('transaction', read);
    listening?.removeEventListener('keydown', onKeyDown, true);
});

defineExpose({ isOpen: () => open.value !== null });
</script>

<template>
    <AnchoredSurface :open="open !== null && offered.length > 0" :rect="rect" @close="close({ onPurpose: true })">
        <div :id="id" class="fe-editor-floating" data-slot="editor-slash-menu" role="listbox">
            <component
                :is="controls.tappable"
                v-for="(item, index) in offered"
                :key="item.name"
                role="option"
                :aria-selected="index === at"
                :active="index === at"
                :on-tap="() => pick(item)"
            >
                <component :is="icon(item.glyph ?? item.name)" v-if="icon(item.glyph ?? item.name)" />
                <span>{{ labels[item.name] ?? item.name }}</span>
            </component>
        </div>
    </AnchoredSurface>
</template>
