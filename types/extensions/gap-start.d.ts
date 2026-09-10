/**
 * The caret stands beside a block that holds no text, rather than on it.
 *
 * There is no text position before a picture at the top of a note, nor after one
 * at the end, nor to the right of one: the caret has nowhere to go and
 * ProseMirror puts the whole block under it instead. The picture is selected the
 * moment the note is read, and the first key typed replaces it.
 *
 * The gap cursor is the place that should have been there. Two moments make it:
 * the document opening on such a block, and a click landing beside one.
 *
 * The opening is done when the view is made rather than when the editor is: an
 * editor is built before it has an element, and the view is made again once it
 * has one, with the selection back where it started.
 */
export const GapStart: Extension<any, any>;
import { Extension } from '@tiptap/core';
//# sourceMappingURL=gap-start.d.ts.map