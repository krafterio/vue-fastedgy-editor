/**
 * What writes a code block: the fence typed, the keys that stay in the code,
 * and the entry that makes one.
 *
 * `offered: false` keeps every way of reading one and takes away every way of
 * creating one, the block staying as its feature reads it.
 *
 * @param {any} base - The block as its feature declares it, before reading took the ways to write it away
 * @param {{ offered: boolean }} options
 * @returns {import('../registry.js').RichTextEditing}
 */
export function codeBlockEditing(base: any, { offered }: {
    offered: boolean;
}): import("../registry.js").RichTextEditing;
//# sourceMappingURL=code-block.d.ts.map