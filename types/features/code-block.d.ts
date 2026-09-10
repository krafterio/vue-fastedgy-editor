/**
 * Fenced code, highlighted.
 *
 * The fence itself is written and read by the core codec; what a document is
 * missing without this is the node that holds one, and the colours.
 *
 * `vue` is offered and stored as `vue`, and highlighted as `xml`: highlight.js
 * has no grammar of that name, and the value a document carries is not something
 * to rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, labels?: { auto?: string, language?: string, copy?: string, copied?: string } }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. Dropping the feature instead would take the reading with
 *   it, and a document holding a fence would come back without it.
 *
 *   `labels` are the words the block shows. None are shipped: what is visible in
 *   a document is written in the language of the application, not of a package.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options?: {
    offered?: boolean;
    labels?: {
        auto?: string;
        language?: string;
        copy?: string;
        copied?: string;
    };
}): import("./registry.js").RichTextFeature;
/** What a code block can be tagged with, in the order a picker should offer them. */
export const codeBlockLanguages: string[];
//# sourceMappingURL=code-block.d.ts.map