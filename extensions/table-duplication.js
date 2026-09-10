import { Extension } from '@tiptap/core';
import { TableMap, addColumn, addRow, selectedRect } from '@tiptap/pm/tables';

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
export const TableDuplication = Extension.create({
    name: 'tableDuplication',

    addCommands() {
        return {
            duplicateColumn:
                () =>
                ({ state, dispatch }) =>
                    duplicate(state, dispatch, 'column'),

            duplicateRow:
                () =>
                ({ state, dispatch }) =>
                    duplicate(state, dispatch, 'row'),
        };
    },
});

function duplicate(state, dispatch, what) {
    const rect = rectOf(state);

    if (!rect) {
        return false;
    }

    const tr = state.tr;
    const column = what === 'column';
    const at = column ? rect.right : rect.bottom;
    const from = column ? rect.left : rect.top;

    (column ? addColumn : addRow)(tr, rect, at);

    if (!dispatch) {
        return true;
    }

    const table = tr.doc.nodeAt(rect.tableStart - 1);
    const map = TableMap.get(table);

    const copies = [];

    for (let along = 0; along < (column ? map.height : map.width); along++) {
        const source = column ? map.map[along * map.width + from] : map.map[from * map.width + along];
        const target = column ? map.map[along * map.width + at] : map.map[at * map.width + along];

        copies.push({
            content: table.nodeAt(source).content,
            at: rect.tableStart + target,
            node: table.nodeAt(target),
        });
    }

    for (const copy of copies.reverse()) {
        tr.replaceWith(copy.at + 1, copy.at + 1 + copy.node.content.size, copy.content);
    }

    dispatch(tr);

    return true;
}

/** The table the selection sits in, and where in it, or nothing. */
function rectOf(state) {
    try {
        return selectedRect(state);
    } catch {
        return null;
    }
}
