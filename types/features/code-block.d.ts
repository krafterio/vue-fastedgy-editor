/**
 * Fenced code, highlighted by tiptap's own `CodeBlockLowlight`.
 *
 * The fence itself is written and read by the core codec, and the core holds
 * the node; what this adds is the colours, the block drawn with its language
 * picker, and the ways to write one.
 *
 * The languages it colours are those `languages` gives, what `lowlight` takes:
 * `{ javascript, python }` from `highlight.js/lib/languages/*`, or `all` from
 * `lowlight` for every one there is, and nothing else is bundled. Given none,
 * a dozen a note most often holds, loaded the first time a block is drawn: a
 * block drawn before they arrive is drawn plain, and coloured the moment they
 * do, written or read. `features.ready()` is settled once they are there.
 *
 * What a block names and is not among them is guessed, as a block that names
 * nothing is, among those languages or among `guess` where it says otherwise:
 * highlight.js guessing among all it knows is wrong more often than right.
 *
 * `vue` is highlighted as `xml` where no grammar of that name was given:
 * highlight.js has none, and the value a document carries is not something to
 * rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, languages?: Record<string, any>, guess?: string[], labels?: object }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. An application that writes none can leave the feature
 *   out instead: the core still reads a block, drawn plain, and nothing of the
 *   highlighter is loaded.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options?: {
    offered?: boolean;
    languages?: Record<string, any>;
    guess?: string[];
    labels?: object;
}): import("./registry.js").RichTextFeature;
//# sourceMappingURL=code-block.d.ts.map