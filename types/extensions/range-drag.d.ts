/**
 * A gesture that never leaves the margin, said again to the text.
 *
 * The handle hangs beside the blocks and outside them, so a pointer that stays
 * with it says nothing the editor hears: no line is drawn, and letting go drops
 * nothing anywhere. What is heard in the margin is said again on the same line
 * at the edge of the text, and what lands there lands at the depth the margin
 * stands at, which is none.
 *
 * Said at the edge rather than where the pointer really is: ProseMirror reads a
 * drop by asking what is under it, and nothing is under the margin.
 *
 * @param {import('@tiptap/pm/view').EditorView} view
 * @param {MouseEvent} event - A `mousemove`, a `dragover` or a `drop`
 * @returns {boolean} - Whether the margin is where it was said
 */
export function alongMargin(view: import("@tiptap/pm/view").EditorView, event: MouseEvent): boolean;
/**
 * Dragging a block takes what is written under it.
 *
 * A flat document says depth with an attribute, so moving a block moves exactly
 * that block: its children stay where they were and are read back under whatever
 * lands above them. The range is therefore ours to carry, and so is the depth it
 * lands at.
 *
 * One transaction for the move and for the depths, or undoing is done in several
 * goes and the document reassembles itself in pieces under the writer.
 */
export const RangeDrag: Extension<any, any>;
import { Extension } from '@tiptap/core';
//# sourceMappingURL=range-drag.d.ts.map