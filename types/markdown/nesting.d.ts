/**
 * Writes one block per chunk, each indented to the level it sits at.
 *
 * @param {Array<{ markdown: string, indent: number }>} chunks
 * @returns {string}
 */
export function joinChunks(chunks: Array<{
    markdown: string;
    indent: number;
}>): string;
/**
 * Reads back what {@link joinChunks} wrote.
 *
 * A blank line ends a chunk, and so does a change of depth. A fence is the
 * exception: everything up to its closing line belongs to it whatever it looks
 * like, or a blank line inside a code sample would cut it in two.
 *
 * @param {string} source
 * @returns {Array<{ markdown: string, indent: number }>}
 */
export function splitChunks(source: string): Array<{
    markdown: string;
    indent: number;
}>;
/**
 * The nearest chunk above [indent] that something at [indent] hangs off, which
 * is how the flat file becomes a tree again wherever a caller wants one.
 *
 * @param {Map<number, any>} open - Last block seen at each depth
 * @param {number} indent
 * @returns {any} - Null where nothing above it holds it
 */
export function parentOf(open: Map<number, any>, indent: number): any;
/**
 * How far one level of nesting is written in.
 *
 * Four spaces, which is what markdown itself indents with, and which nothing of
 * ours can be mistaken for: a code block is always written fenced, so an
 * indented line never means code here, it means a block belonging to the one
 * above it.
 */
export const INDENT_STEP: 4;
//# sourceMappingURL=nesting.d.ts.map