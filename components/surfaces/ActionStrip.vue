<script setup>
import { ToolbarButton, ToolbarRoot, ToolbarSeparator } from 'reka-ui';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const props = defineProps({
    editor: { type: Object, required: true },
    actions: { type: Array, default: () => [] },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();

/**
 * What a strip says of itself depends on where the caret is, and neither the
 * editor nor its state is reactive: the count is what Vue watches, and every
 * transaction moves it on.
 */
const revision = ref(0);
const moved = () => (revision.value += 1);

/**
 * What each action says of itself right now, read once rather than three times
 * per action in the template: `isActive` walks the selection.
 */
const offered = computed(() => {
    void revision.value;

    return props.actions.map((action, at) => ({
        action,
        active: action.isActive?.(props.editor) === true,
        disabled: action.isEnabled ? !action.isEnabled(props.editor) : false,

        // A rule where the group changes, which is what tells a mark from a
        // block on a strip that offers fifteen things.
        opens: at > 0 && (props.actions[at - 1].group ?? 0) !== (action.group ?? 0),
    }));
});

/*
 * One row, and what does not fit is reached rather than wrapped.
 *
 * A strip that wraps changes height as the caret moves, and pushes the document
 * about while somebody is writing in it. It stays one row, scrolls sideways, and
 * says so with an arrow at the end it can still go — held under the pointer, the
 * arrow keeps going, which is how a menu too tall for its screen behaves.
 *
 * The arrow is taken away rather than hidden: what draws it is the application's,
 * and a dressing with a component for a root is a root Vue refuses `v-show` on.
 * Taken away it gives its width back to the row, which the observer watching the
 * row measures again.
 */
const track = useTemplateRef('track');
const room = ref({ start: false, end: false });

const NUDGE_PER_FRAME = 8;

let running = 0;

function measure() {
    const element = track.value;

    if (!element) {
        return;
    }

    // A sub-pixel width leaves a fraction behind at either end, and an arrow
    // that never goes away is worse than one that goes away a pixel early.
    room.value = {
        start: element.scrollLeft > 1,
        end: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    };
}

function nudge(direction) {
    const element = track.value;

    if (!element) {
        return;
    }

    element.scrollLeft += direction * NUDGE_PER_FRAME;
    measure();

    running = requestAnimationFrame(() => nudge(direction));
}

function rest() {
    cancelAnimationFrame(running);
    running = 0;
}

let watching = null;

onMounted(() => {
    props.editor.on('transaction', moved);
    props.editor.on('selectionUpdate', moved);

    // What fits changes with the width of the strip and with what it holds, and
    // neither is something to poll for.
    if (track.value && typeof ResizeObserver === 'function') {
        watching = new ResizeObserver(measure);
        watching.observe(track.value);

        for (const child of track.value.children) {
            watching.observe(child);
        }
    }

    measure();
});

onBeforeUnmount(() => {
    props.editor.off('transaction', moved);
    props.editor.off('selectionUpdate', moved);
    watching?.disconnect();
    rest();
});
</script>

<template>
    <!--
      The caret never leaves for a button.
      A click on a strip would put the focus on the button it landed on, and an
      editor that lost the focus has no selection to act on and no bubble to
      draw: preventing the default of the press keeps the caret where it is,
      while the click that follows still happens.
    -->
    <div data-slot="editor-actions" @mousedown.prevent>
        <component
            :is="controls.tappable"
            v-if="room.start"
            data-slot="editor-actions-nudge"
            data-side="start"
            :tooltip="labels.previous ?? ''"
            :on-tap="() => {}"
            @pointerenter="nudge(-1)"
            @pointerleave="rest"
            @pointercancel="rest"
        >
            <component :is="icon('previous')" v-if="icon('previous')" />
        </component>

        <div ref="track" data-slot="editor-actions-track" @scroll="measure">
            <ToolbarRoot orientation="horizontal" :aria-label="labels.actions ?? undefined">
                <template v-for="entry in offered" :key="entry.action.name">
                    <ToolbarSeparator v-if="entry.opens" data-slot="editor-actions-rule" />

                    <ToolbarButton as-child>
                        <component
                            :is="controls.tappable"
                            :active="entry.active"
                            :disabled="entry.disabled"
                            :tooltip="labels[entry.action.name] ?? ''"
                            :on-tap="() => entry.action.run(editor)"
                        >
                            <component
                                :is="icon(entry.action.glyph ?? entry.action.name)"
                                v-if="icon(entry.action.glyph ?? entry.action.name)"
                            />
                            <span v-else>{{ labels[entry.action.name] ?? entry.action.name }}</span>
                        </component>
                    </ToolbarButton>
                </template>
            </ToolbarRoot>
        </div>

        <component
            :is="controls.tappable"
            v-if="room.end"
            data-slot="editor-actions-nudge"
            data-side="end"
            :tooltip="labels.next ?? ''"
            :on-tap="() => {}"
            @pointerenter="nudge(1)"
            @pointerleave="rest"
            @pointercancel="rest"
        >
            <component :is="icon('next')" v-if="icon('next')" />
        </component>
    </div>
</template>
