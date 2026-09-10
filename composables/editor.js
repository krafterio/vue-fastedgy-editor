import Placeholder from '@tiptap/extension-placeholder';
import { useEditor } from '@tiptap/vue-3';

import { richTextClipboard } from '../extensions/clipboard.js';
import { coreExtensions } from '../extensions/schema.js';
import { createFeatures } from '../features/registry.js';
import { createMarkdownCodec } from '../markdown/codec.js';
import { useImageCarrier } from './pictures.js';

/**
 * A tiptap editor built from a set of features, and nothing drawn.
 *
 * What `RichTextEditor` mounts, on its own: the schema, what the features add,
 * the placeholders and the clipboard. It is here rather than inside the
 * component for whoever wants the engine without our surfaces, a preview being
 * rendered into a canvas or a screen laying its own chrome around the text.
 *
 * @param {object} [options]
 * @param {ReturnType<typeof createFeatures>} [options.features]
 * @param {{ encode: (doc: object) => string, decode: (source: string) => object }} [options.codec]
 * @param {string} [options.content] - What the field holds, in the codec's shape
 * @param {boolean} [options.editable]
 * @param {string} [options.emptyPlaceholder] - Said where the document is empty
 * @param {string} [options.hintPlaceholder] - Said on an empty paragraph
 * @param {(markdown: string, editor: any) => void} [options.onUpdate]
 * @param {(editor: any) => void} [options.onCreate]
 * @returns {import('vue').ShallowRef<any>}
 */
export function useRichTextEditor(options = {}) {
    const features = options.features ?? createFeatures([]);
    const codec = options.codec ?? createMarkdownCodec(features);
    const carrier = useImageCarrier();

    return useEditor({
        editable: options.editable !== false,
        content: codec.decode(options.content ?? ''),

        extensions: [
            ...coreExtensions(),
            ...features.extensions,
            Placeholder.configure({
                placeholder: ({ editor, node }) =>
                    editor.isEmpty
                        ? (options.emptyPlaceholder ?? '')
                        : node.type.name === 'paragraph'
                          ? (options.hintPlaceholder ?? '')
                          : '',
            }),
            richTextClipboard({ codec, ...carrier }),
        ],

        onUpdate: ({ editor }) => options.onUpdate?.(codec.encode(editor.getJSON()), editor),
        onCreate: ({ editor }) => options.onCreate?.(editor),
    });
}
