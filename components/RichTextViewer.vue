<script setup>
import { computed, h } from 'vue';
import { useStorage } from 'vue-fastedgy';

import { attachmentId } from '../features/image.js';
import { renderBlocks } from '../render/blocks.js';
import { ViewerPicture } from './internal/ViewerPicture.js';

const props = defineProps({
    /** The document to draw, markdown or a decoded document. */
    value: { type: [String, Object], default: '' },

    /** How to read [value] when it is markdown. */
    codec: { type: Object, default: null },

    /**
     * What colours a code block, `highlightedCode` from the package unless the
     * application brings its own. Left out, code is drawn plain.
     */
    highlight: { type: Function, default: null },

    /** Same three modes as the editor, `auto` being the only one worth using here. */
    maxWidth: { type: [String, Number], default: null },
    maxHeight: { type: [String, Number], default: null },
    fill: { type: Boolean, default: false },
});

const emit = defineEmits(['mention']);

const { attachmentUrl, fileUrl } = useStorage();

const document = computed(() => {
    if (typeof props.value !== 'string') {
        return props.value ?? { type: 'doc', content: [] };
    }

    return props.codec ? props.codec.decode(props.value) : { type: 'doc', content: [] };
});

const size = (value) => (typeof value === 'number' ? `${value}px` : value);

const style = computed(() => ({
    maxWidth: size(props.maxWidth) ?? undefined,
    maxHeight: props.fill ? '100%' : (size(props.maxHeight) ?? undefined),
    height: props.fill ? '100%' : undefined,
    overflowY: props.fill || props.maxHeight ? 'auto' : undefined,
}));

/**
 * A picture, read the way the editor reads one: through the storage client, and
 * with the directive that carries the token and the size.
 */
const picture = (block) => {
    const address = block.attrs?.src ?? '';
    const id = attachmentId(address);
    const src =
        id !== null ? attachmentUrl(id) : /^[a-z][\w+.-]*:/i.test(address) ? address : (fileUrl(address) ?? address);

    return h(ViewerPicture, {
        src,
        alt: block.attrs?.alt ?? '',
        width: block.attrs?.width ?? null,
        height: block.attrs?.height ?? null,
    });
};

const blocks = computed(() =>
    renderBlocks(document.value, {
        image: picture,
        code: props.highlight ?? null,
        onMention: (record) => emit('mention', record),
    })
);
</script>

<template>
    <!--
      No engine, and that is the whole point: what is drawn here costs a render
      and nothing else, so a list of fifty notes is a list of fifty previews.
    -->
    <div class="fe-editor" data-slot="editor-viewer" :style="style">
        <component :is="block" v-for="(block, at) in blocks" :key="at" />
    </div>
</template>
