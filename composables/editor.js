import Placeholder from '@tiptap/extension-placeholder';
import { Editor } from '@tiptap/vue-3';
import { onBeforeUnmount, onMounted, shallowRef, toValue, watch } from 'vue';

import { richTextClipboard } from '../extensions/clipboard.js';
import { richTextEditorExtensions } from '../extensions/editing.js';
import { createFeatures } from '../features/registry.js';
import { createMarkdownCodec } from '../markdown/codec.js';

/**
 * What [features] bring to an editor, once it is loaded.
 *
 * Null until then: only an editor asks for it, and what asks for it is drawn
 * without it in the meantime, a menu offering the core's entries alone.
 *
 * @param {import('vue').MaybeRefOrGetter<ReturnType<typeof createFeatures>>} features
 * @returns {import('vue').ShallowRef<any>}
 */
export function useRichTextEditing(features) {
    const editing = shallowRef(null);

    watch(
        () => toValue(features),
        (set, _, onCleanup) => {
            let gone = false;

            onCleanup(() => (gone = true));
            void set.editing().then((loaded) => !gone && (editing.value = loaded));
        },
        { immediate: true }
    );

    return editing;
}

/**
 * A tiptap editor built from a set of features, and nothing drawn.
 *
 * What `RichTextEditor` mounts, on its own: the schema, what the features add,
 * the placeholders and the clipboard. It is here rather than inside the
 * component for whoever wants the engine without our surfaces, a preview being
 * rendered into a canvas or a screen laying its own chrome around the text.
 *
 * Built once what only writing needs is loaded, which the features load on
 * demand: null until then, and the document given is read when it is built,
 * not when this is called, so what arrived in the meantime is what it opens on.
 *
 * @param {object} [options]
 * @param {ReturnType<typeof createFeatures>} [options.features]
 * @param {{ encode: (doc: object) => string, decode: (source: string) => object }} [options.codec]
 * @param {import('vue').MaybeRefOrGetter<string>} [options.content] - What the field holds, in the codec's shape
 * @param {import('vue').MaybeRefOrGetter<boolean>} [options.editable]
 * @param {string} [options.emptyPlaceholder] - Said where the document is empty
 * @param {string} [options.hintPlaceholder] - Said on an empty paragraph
 * @param {(markdown: string, editor: any) => void} [options.onUpdate]
 * @param {(editor: any) => void} [options.onCreate]
 * @returns {import('vue').ShallowRef<any>}
 */
export function useRichTextEditor(options = {}) {
    const features = options.features ?? createFeatures([]);
    const codec = options.codec ?? createMarkdownCodec(features);
    const editor = shallowRef(null);
    let gone = false;

    onMounted(async () => {
        const editing = await features.editing();

        if (gone) {
            return;
        }

        editor.value = new Editor({
            editable: toValue(options.editable) !== false,
            content: codec.decode(toValue(options.content) ?? ''),

            extensions: [
                ...richTextEditorExtensions(features, editing),
                Placeholder.configure({
                    placeholder: ({ editor: current, node }) =>
                        current.isEmpty
                            ? (options.emptyPlaceholder ?? '')
                            : node.type.name === 'paragraph'
                              ? (options.hintPlaceholder ?? '')
                              : '',
                }),
                richTextClipboard({ codec, carriers: editing.clipboard() }),
            ],

            onUpdate: ({ editor: current }) => options.onUpdate?.(codec.encode(current.getJSON()), current),

            onCreate: ({ editor: current }) => options.onCreate?.(current),
        });
    });

    onBeforeUnmount(() => {
        gone = true;

        // What tiptap's own does: the text is left on the page while the editor
        // goes, or a leaving transition shows the field emptied.
        const drawn = editor.value?.view.dom?.parentNode;

        drawn?.parentNode?.replaceChild(drawn.cloneNode(true), drawn);
        editor.value?.destroy();
    });

    return editor;
}

/**
 * The title above a document spills into it.
 *
 * At the end of a title, `Enter` and `↓` put the caret in the first block rather
 * than doing nothing — a detail, and what lets a page be typed in one go. The
 * mobile side does it too, so a note typed on either reads the same way.
 *
 * `↓` only from the end of the line: pressed anywhere else it is moving through
 * what is already written, and taking the caret away would be taking it from
 * somebody in the middle of a word.
 *
 * @param {() => any} editor - The editor the title sits above, as `@ready` hands
 *   it over
 * @returns {(event: KeyboardEvent) => void} - A `keydown` handler for the field
 *
 * @example
 * <input @keydown.enter.prevent="spills" @keydown.down="spills" />
 */
export function spillsInto(editor) {
    return (event) => {
        const field = event.target;

        if (event.key === 'ArrowDown' && field.selectionStart !== field.value.length) {
            return;
        }

        event.preventDefault();
        editor()?.commands.focus('start');
    };
}

/**
 * Writes [content] into [editor], replacing only the blocks that differ.
 *
 * A document handed over whole is a document rebuilt whole: the caret goes back
 * to the top of it, and whoever was writing has to find their place again. What
 * really differs, after a save answered or a change made elsewhere, is almost
 * always one block — so one block is what is replaced, and the caret is carried
 * through it the way any other edit carries it.
 *
 * Kept out of the undo history: undoing a change nobody here made would put back
 * a picture the server has already stored under another name.
 *
 * @param {any} editor
 * @param {object} content - A document, in the shape the codec decodes to
 * @returns {boolean} - Whether anything was written
 */
export function writeInto(editor, content) {
    const held = editor.state.doc;
    const given = editor.schema.nodeFromJSON(content);

    if (held.eq(given)) {
        return false;
    }

    const most = Math.min(held.childCount, given.childCount);
    let head = 0;

    while (head < most && held.child(head).eq(given.child(head))) {
        head++;
    }

    let tail = 0;

    while (tail < most - head && held.child(held.childCount - 1 - tail).eq(given.child(given.childCount - 1 - tail))) {
        tail++;
    }

    // Blocks counted from both ends, positions taken from their sizes: what lies
    // between the two is the whole of what changed, and nothing else is touched.
    let from = 0;
    let to = held.content.size;

    for (let at = 0; at < head; at++) {
        from += held.child(at).nodeSize;
    }

    for (let at = 0; at < tail; at++) {
        to -= held.child(held.childCount - 1 - at).nodeSize;
    }

    const written = [];

    for (let at = head; at < given.childCount - tail; at++) {
        written.push(given.child(at));
    }

    editor.view.dispatch(editor.state.tr.replaceWith(from, to, written).setMeta('addToHistory', false));

    return true;
}
