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