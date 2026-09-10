import { Plugin } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import ImageView from '../components/blocks/ImageView.vue';
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
 * @param {{ pickFile?: () => Promise<File|null>, store?: (file: File) => Promise<number|null> }} [options]
 *   How a picture gets in. `pickFile` is the application's, because how one
 *   chooses a file is not this package's business, and `store` answers with the
 *   identifier of the attachment it wrote, or `null` where the record does not
 *   exist yet. It is read **on every call**, never captured: a screen builds its
 *   features once, while the record it shows is still loading. Answering `null`
 *   leaves the picture as a `data:` URI in the text, and the next save turns it
 *   into an attachment.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function imageFeature(options = {}) {
    return {
        name: 'image',
        extensions: [
            SizedImage.extend({
                addNodeView() {
                    return VueNodeViewRenderer(ImageView);
                },

                addCommands() {
                    return {
                        ...this.parent?.(),

                        insertPickedImage:
                            () =>
                            ({ editor }) => {
                                void insertPicked(editor, options);

                                return true;
                            },
                    };
                },

                addProseMirrorPlugins() {
                    return [pastedImages(this.editor, options)];
                },
            }).configure({ inline: false, allowBase64: true }),
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
function pastedImages(editor, options) {
    return new Plugin({
        props: {
            handlePaste(view, event) {
                const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'));

                if (files.length === 0) {
                    return false;
                }

                event.preventDefault();
                void Promise.all(files.map((file) => insertFile(editor, file, options)));

                return true;
            },
        },
    });
}

/**
 * Picks a file, stores it, and drops what came back into the document.
 *
 * The picture is inserted either way: as an attachment where one could be
 * written, and as the `data:` URI it was read as where the record is not there
 * yet. What is in the text is never lost waiting for a record.
 */
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

function asDataUri(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
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
