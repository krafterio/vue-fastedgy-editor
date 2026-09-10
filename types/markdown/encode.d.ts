/**
 * The blocks of a document in the order they are written, each with the depth it
 * sits at.
 *
 * A list container is not a block: markdown writes its items, one chunk each,
 * and the container is rebuilt on the way back in. Its items carry the indent,
 * it carries none.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {Array<{ node: object, indent: number, number: number|null }>}
 */
export function flatten(doc: object): Array<{
    node: object;
    indent: number;
    number: number | null;
}>;
/**
 * Whether [doc] is what a cleared field holds: nothing said, and no blank line
 * deliberately left standing.
 *
 * A block that holds words and holds none is blank whatever kind of block it is,
 * a heading emptied of its words being as empty as the paragraph it was. A block
 * with no words to hold is content: a picture says something, and a field that
 * holds one alone is not a field somebody cleared.
 *
 * @param {object} doc
 * @returns {boolean}
 */
export function isCleared(doc: object): boolean;
/**
 * The words a block holds, marks and structure left aside.
 *
 * @param {object} node
 * @returns {string}
 */
export function plainText(node: object): string;
/**
 * The inline content of a block, written out.
 *
 * @param {object} node
 * @returns {string}
 */
export function encodeInline(node: object): string;
/**
 * One block written out, the features first, the standard blocks after.
 *
 * @param {object} node
 * @param {{ number?: number|null, features?: object }} [context]
 * @returns {string}
 */
export function encodeBlock(node: object, context?: {
    number?: number | null;
    features?: object;
}): string;
/**
 * A document written to markdown.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {{ features?: object, decodeChunk: (markdown: string) => object[] }} options
 * @returns {string}
 */
export function encodeDocument(doc: object, { features, decodeChunk }: {
    features?: object;
    decodeChunk: (markdown: string) => object[];
}): string;
/**
 * Markdown has no empty paragraph: a blank line only separates blocks, so an
 * intentionally empty one is written as a non-breaking space and read back from
 * it.
 */
export const BLANK_PARAGRAPH: "&nbsp;";
//# sourceMappingURL=encode.d.ts.map