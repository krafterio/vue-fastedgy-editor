/**
 * Links, and the one thing markdown needs told about them.
 *
 * The mark itself belongs to the core schema, being one of the seven a run can
 * carry. What a feature owns is the round trip: a link whose address is its own
 * text is written bare.
 *
 * The card that edits one floats above the editor, and it is where an address
 * is filtered on the way in: a document is a place people paste into, and the
 * schemes that could run are refused there as they are on the way out.
 *
 * @param {{ labels?: { address?: string, title?: string, apply?: string, open?: string, unlink?: string } }} [options]
 * @returns {import('./registry.js').RichTextFeature}
 */
export function linkFeature(options?: {
    labels?: {
        address?: string;
        title?: string;
        apply?: string;
        open?: string;
        unlink?: string;
    };
}): import("./registry.js").RichTextFeature;
/**
 * Drops the href of a run that links to its own text, so it is written bare.
 *
 * `[https://example.com](https://example.com)` and `https://example.com` are
 * read back as the very same document, markdown autolinking a plain URL, so the
 * long form carries nothing but noise into a field people and agents read.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object}
 */
export function withoutSelfLinks(doc: object): object;
/**
 * Gives an autolinked run back the address it was written with.
 *
 * A bare URL is turned into a link by the parser, which escapes the address on
 * the way: `https://a.fr/décoration` comes back with an href of
 * `https://a.fr/d%C3%A9coration`, and the document then holds an address nobody
 * wrote. The mirror of {@link withoutSelfLinks}, and what keeps a note the same
 * note on both sides.
 *
 * @param {object[]} blocks
 * @returns {object[]}
 */
export function withWrittenSelfLinks(blocks: object[]): object[];
//# sourceMappingURL=link.d.ts.map