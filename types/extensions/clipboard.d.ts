/**
 * Whether [text] reads as markdown, and so deserves to arrive as blocks rather
 * than as the characters it is made of.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksLikeMarkdown(text: string): boolean;
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
export function richTextClipboard(options: {
    codec: {
        encode: (doc: object) => string;
        decode: (source: string) => object;
    };
    fetchImage?: ((url: string) => Promise<string | null>) | undefined;
    resolveImage?: ((src: string) => Promise<string | null>) | undefined;
}): any;
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
export function pasteFromClipboard(editor: any): Promise<"pasted" | "empty" | "refused" | "unsupported">;
//# sourceMappingURL=clipboard.d.ts.map