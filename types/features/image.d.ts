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
export function pickImageFile(): Promise<any>;
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
export function pictureCarriers({ resolveImage, fetchImage }: {
    resolveImage: (src: string) => Promise<string | null>;
    fetchImage: (url: string) => Promise<string | null>;
}): Record<string, {
    copied: Function;
    pasted: Function;
}>;
//# sourceMappingURL=image.d.ts.map