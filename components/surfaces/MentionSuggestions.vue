<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import { anchoredStyle, useAnchoredRect } from '../../composables/anchored.js';
import { useRichTextControls } from '../../composables/controls.js';
import { suggestionState } from '../../extensions/mention-suggestion.js';

const props = defineProps({
    editor: { type: Object, required: true },

    /** `{ source, key }` per trigger, as the feature armed them. */
    triggers: { type: Array, default: () => [] },

    debounce: { type: Number, default: 200 },
});

const controls = useRichTextControls();

const open = ref(null);
const candidates = ref([]);
const at = ref(0);

// Unique per instance: two editors on a page each announce their own list.
const id = useId();

let searching = null;
let asked = 0;

const { rect, follow } = useAnchoredRect(() => {
    if (!open.value) {
        return null;
    }

    const { left, top, bottom } = props.editor.view.coordsAtPos(open.value.range.from);

    return new DOMRect(left, top, 0, bottom - top);
});

/** The trigger this editor is showing, if any. */
function read() {
    const armed = props.triggers
        .map(({ source, key }) => ({ source, state: suggestionState(props.editor, key) }))
        .find(({ state }) => state !== null);

    if (!armed) {
        close();

        return;
    }

    open.value = { source: armed.source, range: armed.state.range, query: armed.state.query };
    follow();
    search(armed.source, armed.state.query);
}

function search(source, query) {
    clearTimeout(searching);

    const asking = ++asked;

    searching = setTimeout(async () => {
        const found = (await source.search(query)) ?? [];

        // A slower answer to an older query would replace a newer one.
        if (asking === asked) {
            candidates.value = found;
            at.value = 0;
        }
    }, props.debounce);
}

function close() {
    clearTimeout(searching);
    open.value = null;
    candidates.value = [];
    at.value = 0;
}

function pick(candidate) {
    if (!open.value || !candidate) {
        return;
    }

    const { source, range } = open.value;

    props.editor
        .chain()
        .focus()
        .insertContentAt(range, [
            { type: 'mention', attrs: { model: source.model, id: candidate.id, label: candidate.label } },
            { type: 'text', text: ' ' },
        ])
        .run();

    source.onMention?.(candidate);
    close();
}

/**
 * Keys belong to the list while it is open, Enter included: without it a field
 * that sends on Enter would send the message somebody was addressing.
 */
function onKeyDown(event) {
    if (!open.value || candidates.value.length === 0) {
        return;
    }

    if (event.key === 'ArrowDown') {
        at.value = (at.value + 1) % candidates.value.length;
    } else if (event.key === 'ArrowUp') {
        at.value = (at.value - 1 + candidates.value.length) % candidates.value.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        pick(candidates.value[at.value]);
    } else if (event.key === 'Escape') {
        close();
    } else {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
}

const active = computed(() => candidates.value[at.value] ?? null);

/**
 * Which of the two lines reads first.
 *
 * A source whose label is a code says so, and the row draws them the other way
 * round: the name to read, the code to recognise.
 */
const shown = (candidate) =>
    candidate.labelShape === 'code'
        ? { first: candidate.subtitle ?? candidate.label, second: candidate.label }
        : { first: candidate.label, second: candidate.subtitle };

onMounted(() => {
    props.editor.on('transaction', read);
    props.editor.view.dom.addEventListener('keydown', onKeyDown, true);
    read();
});

onBeforeUnmount(() => {
    props.editor.off('transaction', read);
    props.editor.view.dom.removeEventListener('keydown', onKeyDown, true);
    clearTimeout(searching);
});

watch(() => props.editor, read);
</script>

<template>
    <div
        v-if="open && candidates.length > 0"
        :id="id"
        data-slot="editor-mention-suggestions"
        role="listbox"
        :style="anchoredStyle(rect)"
    >
        <component
            :is="controls.tappable"
            v-for="(candidate, index) in candidates"
            :key="candidate.id"
            role="option"
            :aria-selected="candidate === active"
            :active="candidate === active"
            :on-tap="() => pick(candidate)"
        >
            <span data-slot="editor-mention-label">{{ shown(candidate).first }}</span>

            <span v-if="shown(candidate).second" data-slot="editor-mention-subtitle">
                {{ shown(candidate).second }}
            </span>
        </component>
    </div>
</template>
