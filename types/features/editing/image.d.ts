/**
 * What writes a picture: choosing one, pasting or dropping one, carrying one on
 * the clipboard, and the entries that insert one.
 *
 * @param {any} extension - The picture as its feature reads it
 * @param {object} options - The feature's, `pickFile` and `store` read on every call
 * @returns {import('../registry.js').RichTextEditing}
 */
export function imageEditing(extension: any, options: object): import("../registry.js").RichTextEditing;
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