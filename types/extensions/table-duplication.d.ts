/**
 * Duplicating a row and a column, which prosemirror-tables inserts but never
 * copies.
 *
 * The mobile editor has both and a document is edited on either side, so the
 * table people build there is the table they must be able to build here.
 *
 * The new row or column is inserted empty, then filled from the one it was asked
 * about, back to front: writing into a cell moves everything after it, and going
 * the other way would invalidate the positions still to be written.
 */
export const TableDuplication: Extension<any, any>;
import { Extension } from '@tiptap/core';
//# sourceMappingURL=table-duplication.d.ts.map