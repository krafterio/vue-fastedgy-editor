import { Plugin } from '@tiptap/pm/state';
import { markRaw } from 'vue';

import ImageView from '../components/blocks/ImageView.vue';
import ImageLightbox from '../components/surfaces/ImageLightbox.vue';
import { useImageCarrier } from '../composables/pictures.js';
import { SizedImage } from '../extensions/image.js';

/** The scheme of a file stored beside the record, the stable form of an image. */
const ATTACHMENT = 'attachment:';

/** What a picture is never allowed to be, whoever wrote the markdown. */
const REFUSED = /^(javascript|vbscript):/i;

/**
 * Pictures, as a block of their own.
 *
 * Three addresses reach a document and all three are kept as they stand:
 * `attachment:<id>` once the file lives beside the record, a `data:` URI for as
 * long as a pasted image has not been saved, and anything else written by hand.
 * Only what could run is refused.
 *
 * The size travels in the address, `![](attachment:15?w=420&h=280)`, because
 * markdown has no word for it and the scheme is ours. `w` alone is legal, `h`
 * alone is not: without a width there is no size to write.
 *
 * @param {{ pickFile?: () => Promise<File|null>, store?: (file: File) => Promise<number|null>,
 *   open?: (picture: { src: string, alt: string }) => void, viewer?: any, labels?: object }} [options]
 *   How a picture gets in. `pickFile` opens the browser's own file chooser
 *   unless an application has another way, and `store` answers with the
 *   identifier of the attachment it wrote, or `null` where the record does not
 *   exist yet. It is read **on every call**, never captured: a screen builds its
 *   features once, while the record it shows is still loading. Answering `null`
 *   leaves the picture as a `data:` URI in the text, and the next save turns it
 *   into an attachment.
 *
 *   A click shows the picture at full size, written or read alike: in the
 *   package's viewer, in `viewer` where the application lends a component of
 *   its own (`picture` and `labels` in, `close` out), or through `open` where
 *   it shows pictures some other way entirely.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function imageFeature(options = {}) {
    const chosen = { pickFile: pickImageFile, ...options };

    return {
        name: 'image',

        // Drawn by the same component whether it is written or read.
        views: { image: ImageView },

        // What a picture becomes on its way to the clipboard and back: carried
        // inside what was copied rather than as a reference to somebody else's
        // record, and fetched from what was pasted where it can be had.
        clipboard: () => pictureCarriers(useImageCarrier()),

        // Pictures dropped on the text are its to place.
        takes: (kinds) => kinds.every((kind) => kind.startsWith('image/')),

        extensions: [
            SizedImage.extend({
                addCommands() {
                    return {
                        ...this.parent?.(),

                        insertPickedImage:
                            () =>
                            ({ editor }) => {
                                void insertPicked(editor, chosen);

                                return true;
                            },
                    };
                },

                addProseMirrorPlugins() {
                    return [pastedImages(this.editor, chosen)];
                },
            }).configure({
                inline: false,
                allowBase64: true,
                open: options.open ?? null,
                viewer: markRaw(options.viewer ?? ImageLightbox),
                labels: options.labels ?? {},
            }),
        ],

        // A picture is the one thing on the "/" menu somebody looks for on the
        // strip: it is reached far more often than a rule.
        actions: [
            {
                name: 'image',
                glyph: 'image',
                group: 3,
                isActive: () => false,
                isEnabled: (editor) => editor.isEditable,
                run: (editor) => editor.chain().focus().insertPickedImage().run(),
            },
        ],

        menuItems: [
            {
                name: 'image',
                glyph: 'image',
                keywords: ['image', 'picture', 'photo'],
                run: (editor) => editor.chain().focus().insertPickedImage().run(),
            },
        ],

        replacesMenuItems: ['image'],

        markdown: {
            encoders: { image: encodeImage },
            decoders: { paragraph_open: readImage },
        },
    };
}

/**
 * A picture pasted into the document.
 *
 * It lands as the `data:` URI the clipboard handed over, and becomes an
 * attachment on the next save: what somebody pasted is in the text from the
 * moment they pasted it, whether or not a record exists to store it against.
 */
const picturesIn = (transfer) => [...(transfer?.files ?? [])].filter((file) => file.type.startsWith('image/'));

/**
 * Pictures brought in from outside, pasted or dropped.
 *
 * Dropped, they land where the pointer let go and not where the caret happened
 * to be: the drop cursor has been following the pointer the whole way, and it
 * would be saying something untrue otherwise. Read one after the other rather
 * than all at once, so three pictures dropped together come out in the order
 * they were dropped in.
 */
function pastedImages(editor, options) {
    return new Plugin({
        props: {
            handlePaste(view, event) {
                const files = picturesIn(event.clipboardData);

                if (files.length === 0) {
                    return false;
                }

                event.preventDefault();
                void insertFiles(editor, files, options);

                return true;
            },

            handleDrop(view, event, _slice, moved) {
                const files = moved ? [] : picturesIn(event.dataTransfer);

                if (files.length === 0) {
                    return false;
                }

                const at = view.posAtCoords({ left: event.clientX, top: event.clientY });

                event.preventDefault();

                if (at) {
                    editor.commands.setTextSelection(at.pos);
                }

                void insertFiles(editor, files, options);

                return true;
            },
        },
    });
}

async function insertFiles(editor, files, options) {
    for (const file of files) {
        await insertFile(editor, file, options);
    }
}

/**
 * Picks a file, stores it, and drops what came back into the document.
 *
 * The picture is inserted either way: as an attachment where one could be
 * written, and as the `data:` URI it was read as where the record is not there
 * yet. What is in the text is never lost waiting for a record.
 */
/**
 * The browser's own file chooser, which is the only one there is on the web.
 *
 * An application with another way of choosing a picture — a library of its own,
 * a camera — passes `pickFile` instead.
 */
export function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
    });
}

async function insertPicked(editor, options) {
    const file = await options.pickFile?.();

    if (file) {
        await insertFile(editor, file, options);
    }
}

async function insertFile(editor, file, options) {
    const id = (await options.store?.(file)) ?? null;
    const src = id === null ? await asDataUri(file) : `attachment:${id}`;

    if (src) {
        editor.chain().focus().insertContent({ type: 'image', attrs: { src } }).run();
    }
}

/**
 * How wide a picture is carried at before it is stored, and how well.
 *
 * A picture written into a record that has no id yet travels inside the text as
 * a `data:` URI, and the server stores it at the next save. Sent whole, a
 * twelve megapixel photo makes every keystroke carry ten megabytes of base64
 * until then; sent reduced, it appears at once even on a thin line and reaches
 * the server the size a document draws it at.
 */
const CARRIED_WIDTH = 2048;
const CARRIED_QUALITY = 0.82;

/**
 * The picture as it travels: reduced where it can be, whole where it cannot.
 *
 * Anything the browser cannot draw — an animation whose frames would be lost, a
 * format canvas does not read — is carried as it is rather than flattened into
 * something else.
 */
async function asDataUri(file) {
    const reduced = file.type === 'image/gif' ? null : await drawnSmaller(file);

    return reduced ?? readAsDataUri(file);
}

function readAsDataUri(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

async function drawnSmaller(file) {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
        return null;
    }

    try {
        const picture = await createImageBitmap(file);
        const scale = Math.min(1, CARRIED_WIDTH / Math.max(picture.width, picture.height));
        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(picture.width * scale));
        canvas.height = Math.max(1, Math.round(picture.height * scale));
        canvas.getContext('2d')?.drawImage(picture, 0, 0, canvas.width, canvas.height);
        picture.close?.();

        const drawn = canvas.toDataURL('image/jpeg', CARRIED_QUALITY);

        return drawn.startsWith('data:image/') ? drawn : null;
    } catch {
        return null;
    }
}

/**
 * @param {object} node - Image node, ProseMirror JSON
 * @returns {string}
 */
export function encodeImage(node) {
    return `![](${node.attrs?.src ?? ''}${sizeQuery(node.attrs)})`;
}

function sizeQuery(attrs) {
    const width = rounded(attrs?.width);

    if (width === null) {
        return '';
    }

    const height = rounded(attrs?.height);

    return height === null ? `?w=${width}` : `?w=${width}&h=${height}`;
}

function rounded(value) {
    const number = Math.round(Number(value));

    return Number.isFinite(number) && number > 0 ? number : null;
}

/**
 * A paragraph holding one picture and nothing else, read as the block it is.
 *
 * Ahead of the parser's own image rule, which keeps the address verbatim and
 * would leave the size sitting inside it. Any other paragraph is handed back to
 * the core, which is what `null` says.
 */
export function readImage(token, tokens, at) {
    if (token.level !== 0) {
        return null;
    }

    const inline = tokens[at + 1]?.type === 'inline' ? tokens[at + 1] : null;
    const children = (inline?.children ?? []).filter(
        (child) => !(child.type === 'text' && child.content.trim().length === 0)
    );

    if (children.length !== 1 || children[0].type !== 'image') {
        return null;
    }

    const address = children[0].attrGet('src') ?? '';

    return REFUSED.test(address.trim()) ? [] : [imageNode(address)];
}

function imageNode(address) {
    const at = address.lastIndexOf('?');
    const source = at < 0 ? address : address.slice(0, at);
    const query = at < 0 ? '' : address.slice(at + 1);
    const width = rounded(new URLSearchParams(query).get('w'));
    const height = width === null ? null : rounded(new URLSearchParams(query).get('h'));

    return {
        type: 'image',
        attrs: { src: source, ...(width === null ? {} : { width }), ...(height === null ? {} : { height }) },
    };
}

/**
 * Whether [address] points at a file stored beside a record.
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isAttachment(address) {
    return typeof address === 'string' && address.startsWith(ATTACHMENT);
}

/**
 * The identifier an attachment address holds, or `null` for any other address.
 *
 * @param {string} address
 * @returns {number|null}
 */
export function attachmentId(address) {
    if (!isAttachment(address)) {
        return null;
    }

    const id = Number(address.slice(ATTACHMENT.length).split('?')[0]);

    return Number.isInteger(id) ? id : null;
}

/** What a picture may weigh before it is left where it lives. */
const MAX_INLINE_BYTES = 10 * 1024 * 1024;

/**
 * What a picture becomes on the clipboard, given what reads one.
 *
 * Copied, a picture travels **inside** what was copied, as a `data:` URI: an
 * attachment belongs to the record it was stored against, and pasting elsewhere
 * a reference to somebody else's file gives a picture that vanishes the day that
 * record does. It is read at full size, never as the document draws it: the
 * shown picture is optimised for the screen, and copying that would store the
 * reduction over the original on the next save.
 *
 * Pasted, a picture named by a remote address is fetched to be carried inline,
 * which the next save turns into an attachment of the record; one that cannot be
 * had, or weighs too much, is left pointing where it pointed.
 *
 * @param {{ resolveImage: (src: string) => Promise<string|null>, fetchImage: (url: string) => Promise<string|null> }} carrier
 * @returns {Record<string, { copied: Function, pasted: Function }>}
 */
export function pictureCarriers({ resolveImage, fetchImage }) {
    const within = (block, src) => ({ ...block, attrs: { ...block.attrs, src } });

    return {
        image: {
            copied(block) {
                const src = block.attrs?.src ?? '';

                return src.startsWith('data:')
                    ? null
                    : resolveImage(src).then((carried) => (carried ? within(block, carried) : block));
            },

            pasted(block) {
                const src = block.attrs?.src ?? '';

                return /^https?:/i.test(src)
                    ? fetchImage(src).then((inlined) =>
                          inlined && inlined.length <= MAX_INLINE_BYTES ? within(block, inlined) : block
                      )
                    : null;
            },
        },
    };
}
