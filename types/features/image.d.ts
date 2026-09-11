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
export function imageFeature(options?: {
    pickFile?: () => Promise<File | null>;
    store?: (file: File) => Promise<number | null>;
    open?: (picture: {
        src: string;
        alt: string;
    }) => void;
    viewer?: any;
    labels?: object;
}): import("./registry.js").RichTextFeature;
/**
 * @param {object} node - Image node, ProseMirror JSON
 * @returns {string}
 */
export function encodeImage(node: object): string;
/**
 * A paragraph holding one picture and nothing else, read as the block it is.
 *
 * Ahead of the parser's own image rule, which keeps the address verbatim and
 * would leave the size sitting inside it. Any other paragraph is handed back to
 * the core, which is what `null` says.
 */
export function readImage(token: any, tokens: any, at: any): {
    type: string;
    attrs: {
        height?: number | undefined;
        width?: number | undefined;
        src: any;
    };
}[] | null;
/**
 * Whether [address] points at a file stored beside a record.
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isAttachment(address: string): boolean;
/**
 * The identifier an attachment address holds, or `null` for any other address.
 *
 * @param {string} address
 * @returns {number|null}
 */
export function attachmentId(address: string): number | null;
//# sourceMappingURL=image.d.ts.map