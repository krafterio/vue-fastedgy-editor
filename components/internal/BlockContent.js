import { NodeViewContent } from '@tiptap/vue-3';
import { defineComponent, h, inject } from 'vue';

/**
 * What a document reader hands a component for the blocks it holds.
 *
 * Provided by the viewer to each block it draws with a component, and by
 * nobody in an editor, where ProseMirror fills the content itself.
 *
 * @type {import('vue').InjectionKey<() => any[]>}
 */
export const HELD_CONTENT = Symbol('rich-text-held-content');

/**
 * Where a block component puts what it holds: the text of a code block, the
 * paragraph of a task.
 *
 * In an editor this is `NodeViewContent`, an element ProseMirror fills. Read,
 * there is no ProseMirror, so the same element is drawn with the content in it:
 * the same tag, the same style and the same attribute, so the one CSS lays both
 * out alike.
 */
export const BlockContent = defineComponent({
    name: 'BlockContent',

    props: {
        as: { type: String, default: 'div' },
    },

    setup(props, { attrs }) {
        const held = inject(HELD_CONTENT, null);

        return () =>
            held
                ? h(props.as, { style: { whiteSpace: 'pre-wrap' }, 'data-node-view-content': '', ...attrs }, held())
                : h(NodeViewContent, { ...attrs, as: props.as });
    },
});
