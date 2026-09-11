import { h } from 'vue';

import TableHandles from '../../components/surfaces/TableHandles.vue';
import { TableDuplication } from '../../extensions/table-duplication.js';

/**
 * What writes a table: the handles that insert and delete a row or a column,
 * what duplicates one, and the action that makes one.
 *
 * @param {{ labels?: Record<string, string> }} options - The feature's
 * @returns {import('../registry.js').RichTextEditing}
 */
export function tableEditing(options) {
    return {
        extensions: [TableDuplication],

        surfaces: [(editor, labels) => h(TableHandles, { editor, labels: { ...labels, ...options.labels } })],

        // Beside the blocks a button already makes: a table is reached about as
        // often as a picture, and the "/" menu costs a character typed and a
        // list read.
        actions: [
            {
                name: 'table',
                glyph: 'table',
                group: 3,
                isActive: () => false,

                // Only on a line of its own: a table is not something a
                // paragraph turns into, it is something written between two.
                isEnabled: (editor) => editor.state.selection.empty,

                run: (editor) => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run(),
            },
        ],
    };
}
