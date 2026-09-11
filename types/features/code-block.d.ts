/**
 * Fenced code, highlighted by tiptap's own `CodeBlockLowlight`.
 *
 * The fence itself is written and read by the core codec, and the core holds
 * the node; what this adds is the colours, the block drawn with its language
 * picker, and the ways to write one.
 *
 * Every grammar highlight.js knows is offered unless the application keeps
 * fewer, `languages` taking what `lowlight` takes: `{ javascript, python }`
 * from `highlight.js/lib/languages/*`, or `common` from `lowlight`. What a block
 * names and is not among them is guessed, as a block that names nothing is.
 *
 * Guessed among few: the mobile side's languages, or those the application
 * kept, or `guess` where it says otherwise. highlight.js guessing among all it
 * knows is wrong more often than right.
 *
 * `vue` is highlighted as `xml` where no grammar of that name was given:
 * highlight.js has none, and the value a document carries is not something to
 * rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, languages?: Record<string, any>, guess?: string[], labels?: object }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. Dropping the feature instead would take the reading with
 *   it, and a document holding a fence would come back without it.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options?: {
    offered?: boolean;
    languages?: Record<string, any>;
    guess?: string[];
    labels?: object;
}): import("./registry.js").RichTextFeature;
//# sourceMappingURL=code-block.d.ts.map