/**
 * The parser the decoder reads with.
 *
 * `html: false`, and deliberately: the dialect needs `<u>`, `<br>` in a table
 * cell and `&nbsp;`, and each of those gets a rule of its own. Turning raw HTML
 * on would open an XSS surface for nothing, on content written by another
 * client.
 *
 * @param {{ inlineRules?: Array<(md: MarkdownIt) => void> }} [options]
 * @returns {MarkdownIt}
 */
export function createParser(options?: {
    inlineRules?: Array<(md: typeof import("markdown-it").MarkdownIt & ((...args: [] | [options: import("markdown-it").MarkdownItOptions] | [presetName: "default" | "zero" | "commonmark", options?: import("markdown-it").MarkdownItOptions | undefined]) => import("markdown-it").MarkdownIt)) => void>;
}): typeof import("markdown-it").MarkdownIt & ((...args: [] | [options: import("markdown-it").MarkdownItOptions] | [presetName: "default" | "zero" | "commonmark", options?: import("markdown-it").MarkdownItOptions | undefined]) => import("markdown-it").MarkdownIt);
/**
 * A link's address, or null when it is one no document is allowed to carry.
 *
 * @param {string|null|undefined} href
 * @returns {string|null}
 */
export function safeHref(href: string | null | undefined): string | null;
/**
 * The blocks of one chunk, with nothing indented left in it.
 *
 * A list item comes back as the item alone, never wrapped: the container is what
 * {@link decodeDocument} rebuilds once it knows which items sit at the same
 * depth. It is also what the encoder compares its own output against, and it
 * writes one chunk per item.
 *
 * @param {string} markdown
 * @param {{ parser?: MarkdownIt, features?: object }} [options]
 * @returns {object[]}
 */
export function decodeChunk(markdown: string, options?: {
    parser?: typeof import("markdown-it").MarkdownIt & ((...args: [] | [options: import("markdown-it").MarkdownItOptions] | [presetName: "default" | "zero" | "commonmark", options?: import("markdown-it").MarkdownItOptions | undefined]) => import("markdown-it").MarkdownIt);
    features?: object;
}): object[];
/** The blank document a cleared or unreadable field opens on. */
export function blankDocument(): {
    type: string;
    content: {
        type: string;
    }[];
};
/**
 * A markdown source read back into a document.
 *
 * Never returns a document without a block: the decoders drop what they cannot
 * read, and a document with no block renders as a dead zone, nothing to click,
 * nothing to type into, not even a placeholder.
 *
 * @param {string|null|undefined} source
 * @param {{ parser?: MarkdownIt, features?: object }} [options]
 * @returns {object}
 */
export function decodeDocument(source: string | null | undefined, options?: {
    parser?: typeof import("markdown-it").MarkdownIt & ((...args: [] | [options: import("markdown-it").MarkdownItOptions] | [presetName: "default" | "zero" | "commonmark", options?: import("markdown-it").MarkdownItOptions | undefined]) => import("markdown-it").MarkdownIt);
    features?: object;
}): object;
//# sourceMappingURL=decode.d.ts.map