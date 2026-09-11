import { defineAsyncComponent, markRaw } from 'vue';

import ImageView from '../components/blocks/ImageView.vue';
import { SizedImage } from '../extensions/image.js';

/**
 * The package's viewer, loaded the first time a picture is opened: a page that
 * only shows pictures never has to carry what shows one at full size.
 */
const ImageLightbox = defineAsyncComponent(() => import('../components/surfaces/ImageLightbox.vue'));

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
    const extension = SizedImage.configure({
        inline: false,
        allowBase64: true,
        open: options.open ?? null,
        viewer: markRaw(options.viewer ?? ImageLightbox),
        labels: options.labels ?? {},
    });

    return {
        name: 'image',

        // Drawn by the same component whether it is written or read.
        views: { image: ImageView },

        extensions: [extension],

        markdown: {
            encoders: { image: encodeImage },
            decoders: { paragraph_open: readImage },
        },

        editing: () => import('./editing/image.js').then((module) => module.imageEditing(extension, options)),
    };
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
