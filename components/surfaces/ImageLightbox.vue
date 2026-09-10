<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, VisuallyHidden } from 'reka-ui';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { useImageCarrier } from '../../composables/pictures.js';
import { useRichTextControls } from '../../composables/controls.js';
import { useRichTextIcons } from '../../composables/icons.js';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const STEP = 1.15;

const props = defineProps({
    editor: { type: Object, required: true },
    labels: { type: Object, default: () => ({}) },
});

const controls = useRichTextControls();
const { icon } = useRichTextIcons();
const { resolveImage } = useImageCarrier();

const shown = ref(false);
const alt = ref('');
const picture = ref('');
const scale = ref(1);
const pan = reactive({ x: 0, y: 0 });

const zoomed = computed(() => scale.value > 1);

/**
 * The picture as it was stored, not as it was drawn.
 *
 * What a document shows is optimised for the size it is drawn at; opening one at
 * full size and asking for that same reduction would show a blur. This is the
 * same read the clipboard does, cf `composables/pictures.js`.
 */
async function open(src, label) {
    alt.value = label ?? '';
    picture.value = '';
    reset();
    shown.value = true;
    picture.value = (await resolveImage(src)) ?? '';
}

function reset() {
    scale.value = 1;
    pan.x = 0;
    pan.y = 0;
}

function zoom(to) {
    scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, to));

    if (!zoomed.value) {
        pan.x = 0;
        pan.y = 0;
    }
}

const onWheel = (event) => zoom(scale.value * (event.deltaY < 0 ? STEP : 1 / STEP));
const toggleZoom = () => zoom(zoomed.value ? 1 : 2);

/** Dragging moves the picture only while there is more of it than of the screen. */
function startPan(event) {
    if (!zoomed.value) {
        return;
    }

    const from = { x: event.clientX - pan.x, y: event.clientY - pan.y };

    const move = (moved) => {
        pan.x = moved.clientX - from.x;
        pan.y = moved.clientY - from.y;
    };

    const stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
}

/**
 * Saved from what is already in hand.
 *
 * The picture was read through the fetcher, which carries the token, and is held
 * as a data URI: handing the browser the address instead would download whatever
 * an unauthenticated request answers, which is not the picture.
 */
function save() {
    if (!picture.value) {
        return;
    }

    const link = document.createElement('a');

    link.href = picture.value;
    link.download = alt.value || 'image';
    link.click();
}

const style = computed(() => ({
    transform: `translate(${Math.round(pan.x)}px, ${Math.round(pan.y)}px) scale(${scale.value})`,
}));

/*
 * A node view and a surface are two subtrees that never meet: the opener is left
 * on the extension, which both of them can reach.
 */
onMounted(() => (props.editor.storage.image.open = open));
onBeforeUnmount(() => (props.editor.storage.image.open = null));
</script>

<template>
    <!--
      Opening, closing on Escape, the focus trapped while it is up and given back
      after, and what a screen reader is told: all of it is reka's.
    -->
    <DialogRoot v-model:open="shown">
        <DialogPortal>
            <DialogOverlay data-slot="editor-lightbox-veil" />

            <!--
              It takes the focus, unlike the surfaces that answer to the caret:
              a picture at full size is what is being looked at, and what the
              keyboard should be talking to.
            -->
            <DialogContent data-slot="editor-lightbox">
                <VisuallyHidden as-child>
                    <DialogTitle>{{ alt || (labels.image ?? 'Image') }}</DialogTitle>
                </VisuallyHidden>

                <div data-slot="editor-lightbox-actions">
                    <component :is="controls.tappable" v-if="zoomed" :tooltip="labels.resetZoom ?? ''" :on-tap="reset">
                        <component :is="icon('resetZoom')" v-if="icon('resetZoom')" />
                    </component>

                    <component
                        :is="controls.tappable"
                        :disabled="!picture"
                        :tooltip="labels.download ?? ''"
                        :on-tap="save"
                    >
                        <component :is="icon('download')" v-if="icon('download')" />
                    </component>

                    <component :is="controls.tappable" :tooltip="labels.close ?? ''" :on-tap="() => (shown = false)">
                        <component :is="icon('close')" v-if="icon('close')" />
                    </component>
                </div>

                <div
                    data-slot="editor-lightbox-stage"
                    :data-zoomed="zoomed || undefined"
                    @wheel.prevent="onWheel"
                    @pointerdown="startPan"
                    @dblclick="toggleZoom"
                >
                    <img v-if="picture" :src="picture" :alt="alt" draggable="false" :style="style" />
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>
