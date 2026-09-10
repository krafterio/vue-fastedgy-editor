/**
 * Which of [blocks] holds [position], the blocks being `{ pos, node }` in order.
 *
 * Half open on purpose: a block ends exactly where the next one starts, so a
 * position on that seam belongs to the one that starts there. Read the other way
 * round, taking hold of a block by its first position takes hold of the one
 * above it — which is what a drag from the handle does every time.
 *
 * @param {Array<{ pos: number, node: { nodeSize: number } }>} blocks
 * @param {number} position
 * @returns {number} - Its index, or `-1`
 */
export function blockAt(blocks: Array<{
    pos: number;
    node: {
        nodeSize: number;
    };
}>, position: number): number;
/**
 * The blocks a move takes with it: the one at [index] and the contiguous run of
 * the ones after it that are written deeper.
 *
 * The same rule the format is read with, said the other way round: the parent of
 * a block is the nearest block above it at a lesser depth, so everything deeper
 * that follows belongs to it, and the range stops at the first block written at
 * the same depth or shallower.
 *
 * @param {Array<{ indent: number }>} blocks
 * @param {number} index
 * @returns {{ from: number, to: number }} - `to` excluded
 */
export function rangeFrom(blocks: Array<{
    indent: number;
}>, index: number): {
    from: number;
    to: number;
};
/**
 * How far a range may move, so a block never lands under a parent nobody chose.
 *
 * Down to zero, and up to one level deeper than the block above the range: two
 * levels at once would leave a gap, and the decoder would hang the block off
 * whatever it found instead.
 *
 * @param {Array<{ indent: number }>} blocks
 * @param {{ from: number, to: number }} range
 * @param {number} delta
 * @returns {number} - The delta as it may actually be applied
 */
export function boundedDelta(blocks: Array<{
    indent: number;
}>, range: {
    from: number;
    to: number;
}, delta: number): number;
/** The blocks that can sit under another one. A list container never does: its items do. */
export const INDENTABLE_TYPES: string[];
/**
 * Nesting as an attribute rather than as a tree.
 *
 * The stored markdown is flat indentation, and the tree is only rebuilt on the
 * way in: a flat document is what the format actually says. Everything a nested
 * document would give is bought back by the range of {@link rangeFrom}, and
 * nothing in the schema has to be rewritten for it.
 */
export const Indent: Extension<{
    types: string[];
}, any>;
import { Extension } from '@tiptap/core';
//# sourceMappingURL=indent.d.ts.map