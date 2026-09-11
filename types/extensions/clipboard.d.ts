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
export function richTextClipboard(options: {
    codec: {
        encode: (doc: object) => string;
        decode: (source: string) => object;
    };
    carriers?: Record<string, {
        copied?: (node: object) => Promise<object> | null;
        pasted?: (node: object) => Promise<object> | null;
    }> | undefined;
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
 * through, features included, so whatever was copied lands exactly as it would
 * have.
 *
 * @param {any} editor
 * @returns {Promise<'pasted'|'empty'|'refused'|'unsupported'>} What happened,
 *   for the application to say so in its own words.
 */
export function pasteFromClipboard(editor: any): Promise<"pasted" | "empty" | "refused" | "unsupported">;
//# sourceMappingURL=clipboard.d.ts.map