import { Extension } from '@tiptap/core';
import { DOMSerializer } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

/**
 * What says a piece of text was written as markdown rather than typed.
 *
 * Split by line kind on purpose. A block marker only means anything at the start
 * of a line, and a single pasted line opening with `#` is far more often a
 * comment or a tag than a heading, so those count only where there are lines to
 * structure. What a marked span is cannot be mistaken for anything else, and
 * counts wherever it appears.
 */
const BLOCK_MARKERS = [
    /^ {0,3}#{1,6} \S/m,
    /^ {0,3}[-*+] +\S/m,
    /^ {0,3}\d+[.)] +\S/m,
    /^ {0,3}> ?\S/m,
    /^ {0,3}(```|~~~)/m,
    /^ {0,3}([-*_] *){3,}$/m,
    /^ {0,3}\|.*\|/m,
];

const SPAN_MARKERS = [
    /!\[[^\]]*]\([^)\s]+\)/,
    /(?<!!)\[[^\]]+]\([^)\s]+\)/,
    /\*\*[^*\n]+\*\*/,
    /~~[^~\n]+~~/,
    /`[^`\n]+`/,
];

/**
 * Whether [text] reads as markdown, and so deserves to arrive as blocks rather
 * than as the characters it is made of.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksLikeMarkdown(text) {
    if (!text || text.trim().length === 0) {
        return false;
    }

    if (SPAN_MARKERS.some((marker) => marker.test(text))) {
        return true;
    }

    return text.includes('\n') && BLOCK_MARKERS.some((marker) => marker.test(text));
}

/**
 * Copy and paste, in the two shapes a document is read in.
 *
 * **Copying** writes markdown where a reader asks for text and html where it
 * asks for formatting, which is what a clipboard carries at once: an editor of
 * ours reads the markdown back as the blocks it describes, a word processor
 * takes the html, and a plain text field shows the markdown. Without this the
 * bare words travel, and everything copied comes back plain, even into the
 * editor it was copied from.
 *
 * What a feature carries along travels with it: a node may leave for the
 * clipboard as something else than it is held, and come back in as something
 * else than it was pasted — a picture carried inside what was copied rather
 * than as a reference to somebody else's record. Which nodes, and what they
 * become, is the feature's to say, cf `carriers`.
 *
 * **Pasting** reads markdown as blocks, wherever it was copied from. There is no
 * shortcut for what came out of an editor of ours: the markdown is the document,
 * and reading it back is what every other client does with it.
 *
 * @param {object} options
 * @param {{ encode: (doc: object) => string, decode: (source: string) => object }} options.codec
 * @param {Record<string, { copied?: (node: object) => Promise<object>|null, pasted?: (node: object) => Promise<object>|null }>} [options.carriers]
 *   By node type, what a node becomes on its way out and on its way in, as
 *   `features.clipboard()` answers; null where it travels as it is.
 * @returns {any}
 */
export function richTextClipboard(options) {
    const { codec, carriers = {} } = options;

    return Extension.create({
        name: 'richTextClipboard',

        addProseMirrorPlugins() {
            const editor = this.editor;

            return [
                new Plugin({
                    props: {
                        clipboardTextSerializer: (slice) =>
                            codec.encode({ type: 'doc', content: slice.content.toJSON() ?? [] }).trimEnd(),

                        handleDOMEvents: {
                            copy: (view, event) => write(view, event, { codec, carriers }),
                            cut: (view, event) => write(view, event, { codec, carriers, andDelete: true }),
                        },

                        handlePaste(view, event) {
                            const text = event.clipboardData?.getData('text/plain') ?? '';

                            if (!looksLikeMarkdown(text)) {
                                return false;
                            }

                            const document = codec.decode(text);

                            if ((document.content ?? []).length === 0) {
                                return false;
                            }

                            event.preventDefault();
                            void insert(editor, document, carriers);

                            return true;
                        },
                    },
                }),
            ];
        },
    });
}

/**
 * Writes what was selected on the clipboard, under both shapes.
 *
 * What a feature carries is read first where it can be, which is why the write
 * is asynchronous where there is any: the browser is handed promises rather than
 * strings, and the clipboard fills once they answer. Where nothing has to be
 * read, or where the browser will not take a promise, the two shapes are written
 * on the event itself and every node leaves as it is.
 */
function write(view, event, { codec, carriers, andDelete = false }) {
    const slice = view.state.selection.content();

    if (slice.size === 0) {
        return false;
    }

    const document = { type: 'doc', content: slice.content.toJSON() ?? [] };
    const markdown = codec.encode(document).trimEnd();
    const html = htmlOf(view, slice);

    event.preventDefault();

    const carried = document.content.map((block) => carriers[block.type]?.copied?.(block) ?? null);

    if (carried.some(Boolean) && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const written = Promise.all(carried.map((block, at) => block ?? document.content[at])).then(
            (content) => new Blob([codec.encode({ ...document, content }).trimEnd()], { type: 'text/plain' })
        );

        void navigator.clipboard
            .write([new ClipboardItem({ 'text/plain': written, 'text/html': new Blob([html], { type: 'text/html' }) })])
            .catch(() => navigator.clipboard.writeText(markdown));
    } else {
        event.clipboardData?.setData('text/plain', markdown);
        event.clipboardData?.setData('text/html', html);
    }

    if (andDelete) {
        view.dispatch(view.state.tr.deleteSelection());
    }

    return true;
}

/** What a word processor pastes as formatted text. */
function htmlOf(view, slice) {
    const holder = document.createElement('div');

    holder.append(DOMSerializer.fromSchema(view.state.schema).serializeFragment(slice.content));

    return holder.innerHTML;
}

/**
 * Pastes what the clipboard holds, asked for out loud.
 *
 * A button that pastes has to read the clipboard, and reading it is a permission
 * the browser asks the reader for. There is no way to know beforehand whether
 * there is anything to paste, so the button never greys itself out: it asks when
 * it is pressed, which is the one moment somebody has said they want this.
 *
 * What comes back goes through the very same handlers a keyboard paste goes
 * through, features included, so whatever was copied lands exactly as it would
 * have.
 *
 * @param {any} editor
 * @returns {Promise<'pasted'|'empty'|'refused'|'unsupported'>} What happened,
 *   for the application to say so in its own words.
 */
export async function pasteFromClipboard(editor) {
    const clipboard = navigator.clipboard;

    if (!clipboard?.read && !clipboard?.readText) {
        return 'unsupported';
    }

    let held;

    try {
        held = clipboard.read ? await heldItems(clipboard) : { text: await clipboard.readText(), html: '', files: [] };
    } catch (failure) {
        // A refusal and a browser that will not answer look the same from here,
        // and the caller says the same thing about both.
        return failure?.name === 'NotAllowedError' ? 'refused' : 'unsupported';
    }

    if (held.text.length === 0 && held.files.length === 0) {
        return 'empty';
    }

    const view = editor.view;
    const event = {
        preventDefault: () => {},
        clipboardData: {
            files: held.files,
            getData: (kind) => (kind === 'text/html' ? held.html : held.text),
        },
    };

    const taken = view.someProp('handlePaste', (handle) => handle(view, event)) === true;

    if (!taken && held.text.length > 0) {
        editor.chain().focus().insertContent(held.text).run();
    }

    return 'pasted';
}

async function heldItems(clipboard) {
    const items = await clipboard.read();
    const held = { text: '', html: '', files: [] };

    for (const item of items) {
        for (const type of item.types) {
            const blob = await item.getType(type);

            if (type === 'text/plain') {
                held.text = await blob.text();
            } else if (type === 'text/html') {
                held.html = await blob.text();
            } else {
                // A file, whatever it holds: which ones anything is made of is
                // for the features to say, through the paste they handle.
                held.files.push(new File([blob], 'pasted', { type }));
            }
        }
    }

    return held;
}

async function insert(editor, document, carriers) {
    const blocks = document.content ?? [];

    // What a feature brings along from what was pasted, a picture fetched to be
    // carried inside the document, where it can be had; and nothing waited for
    // where there is nothing to bring.
    const brought = blocks.map((block) => carriers[block.type]?.pasted?.(block) ?? null);
    const content = brought.some(Boolean) ? await Promise.all(brought.map((block, at) => block ?? blocks[at])) : blocks;

    editor
        .chain()
        .focus()
        .insertContent({ ...document, content })
        .run();
}
