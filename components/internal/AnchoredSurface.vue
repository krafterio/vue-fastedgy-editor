<script setup>
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui';
import { computed } from 'vue';

const props = defineProps({
    /** Where it hangs, as a rectangle read from the document. */
    rect: { type: Object, default: null },

    open: { type: Boolean, default: false },

    side: { type: String, default: 'bottom' },
    align: { type: String, default: 'start' },

    /** Whether the caret goes on writing while this is up. */
    keepsFocus: { type: Boolean, default: true },
});

const emit = defineEmits(['close']);

/**
 * A virtual anchor: what a surface hangs on is a place in the text, not an
 * element, and reka takes one as readily as the other.
 */
const anchor = computed(() =>
    props.rect ? { getBoundingClientRect: () => props.rect, contextElement: undefined } : undefined
);

/**
 * The caret keeps writing under a surface that answers to it, a mention being
 * picked or a block being chosen: taking the focus away would end the very thing
 * the surface is there for. A card that is filled in takes it.
 */
function keepFocus(event) {
    if (props.keepsFocus) {
        event.preventDefault();
    }
}
</script>

<template>
    <!--
      Placement, flipping when there is no room below, closing on Escape and on a
      click outside, giving the focus back where it came from, and saying what it
      is to a screen reader: all of it is reka's, and none of it is written here.
    -->
    <PopoverRoot :open="open" @update:open="(value) => !value && emit('close')">
        <PopoverAnchor :reference="anchor" />

        <PopoverPortal>
            <!--
              The layer is said here, on what reka portals: reka copies this
              element's z-index onto the fixed wrapper it creates, which is what
              stands against the application's own layers. Said on a child, it
              stacks inside that wrapper and the wrapper stays at auto.
            -->
            <PopoverContent
                data-slot="editor-anchored"
                :side="side"
                :align="align"
                :side-offset="6"
                :collision-padding="8"
                @open-auto-focus="keepFocus"
                @close-auto-focus="keepFocus"
                @escape-key-down="emit('close')"
                @pointer-down-outside="emit('close')"
            >
                <slot />
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>
