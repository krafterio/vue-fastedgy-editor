/**
 * Links, and the one thing markdown needs told about them.
 *
 * The mark itself belongs to the core schema, being one of the seven a run can
 * carry. What a feature owns is the round trip: a link whose address is its own
 * text is written bare.
 *
 * @returns {import('./registry.js').RichTextFeature}
 */
export function linkFeature(): import("./registry.js").RichTextFeature;
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
//# sourceMappingURL=link.d.ts.map