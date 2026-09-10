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

/** What a picture may weigh before it is left where it lives. */
const MAX_INLINE_IMAGE_BYTES = 10 * 1024 * 1024;

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
 * A picture travels **inside** what was copied, as a `data:` URI: an attachment
 * belongs to the record it was stored against, and pasting elsewhere a reference
 * to somebody else's file gives a picture that vanishes the day that record
 * does. What lands is carried along, and the next save stores it where it lands.
 *
 * **Pasting** reads markdown as blocks, wherever it was copied from. There is no
 * shortcut for what came out of an editor of ours: the markdown is the document,
 * and reading it back is what every other client does with it.
 *
 * @param {object} options
 * @param {{ encode: (doc: object) => string, decode: (source: string) => object }} options.codec
 * @param {(url: string) => Promise<string|null>} [options.fetchImage]
 *   Answers with a `data:` URI, which is what turns a picture named in pasted
 *   markdown into an attachment of the record on the next save. A picture that
 *   cannot be had is left pointing where it pointed.
 * @param {(src: string) => Promise<string|null>} [options.resolveImage]
 *   The same, for copying: what `attachment:15` reads as, so a picture leaves
 *   the document with what was copied rather than as a reference to a record.
 *   It must answer with the **original**, never with what the document draws:
 *   the shown picture is optimised for the screen it is shown on, and copying
 *   that would store the reduction over the original on the next save.
 *   `useImageCarrier()` does both correctly.
 * @returns {any}
 */
export function richTextClipboard(options) {
    const { codec, fetchImage = null, resolveImage = null } = options;

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
                            copy: (view, event) => write(view, event, { codec, resolveImage }),
                            cut: (view, event) => write(view, event, { codec, resolveImage, andDelete: true }),
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
                            void insert(editor, document, fetchImage);

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
 * The pictures are read first where they can be, which is why the write is
 * asynchronous where there are any: the browser is handed promises rather than
 * strings, and the clipboard fills once they answer. Where nothing has to be
 * read, or where the browser will not take a promise, the two shapes are written
 * on the event itself and the pictures leave as the addresses they are.
 */
function write(view, event, { codec, resolveImage, andDelete = false }) {
    const slice = view.state.selection.content();

    if (slice.size === 0) {
        return false;
    }

    const document = { type: 'doc', content: slice.content.toJSON() ?? [] };
    const markdown = codec.encode(document).trimEnd();
    const html = htmlOf(view, slice);

    event.preventDefault();

    const carried = resolveImage && document.content.some((block) => isCarried(block));

    if (carried && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const written = withCarriedPictures(document, resolveImage).then(
            (whole) => new Blob([codec.encode(whole).trimEnd()], { type: 'text/plain' })
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

/** Whether a block is a picture that lives somewhere else. */
function isCarried(block) {
    return block.type === 'image' && !(block.attrs?.src ?? '').startsWith('data:');
}

/** The same document, its pictures carried inside it. */
async function withCarriedPictures(document, resolveImage) {
    const content = await Promise.all(
        document.content.map(async (block) => {
            if (!isCarried(block)) {
                return block;
            }

            const carried = await resolveImage(block.attrs.src);

            return carried ? { ...block, attrs: { ...block.attrs, src: carried } } : block;
        })
    );

    return { ...document, content };
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
 * through, features included, so a picture or a piece of markdown lands exactly
 * as it would have.
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
            } else if (type.startsWith('image/')) {
                held.files.push(new File([blob], 'pasted', { type }));
            }
        }
    }

    return held;
}

async function insert(editor, document, fetchImage) {
    editor
        .chain()
        .focus()
        .insertContent(await withInlinePictures(document, fetchImage))
        .run();
}

/**
 * The pictures a pasted document names, brought along where they can be had.
 *
 * A remote picture carried inline is what a save turns into an attachment of the
 * record; one left as an address stays somebody else's file, and disappears the
 * day they take it down.
 */
async function withInlinePictures(document, fetchImage) {
    if (!fetchImage) {
        return document;
    }

    const content = await Promise.all(
        (document.content ?? []).map(async (block) => {
            if (block.type !== 'image' || !/^https?:/i.test(block.attrs?.src ?? '')) {
                return block;
            }

            const inlined = await fetchImage(block.attrs.src);

            return inlined && inlined.length <= MAX_INLINE_IMAGE_BYTES
                ? { ...block, attrs: { ...block.attrs, src: inlined } }
                : block;
        })
    );

    return { ...document, content };
}
