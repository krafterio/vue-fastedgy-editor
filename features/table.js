import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { h } from 'vue';

import TableHandles from '../components/surfaces/TableHandles.vue';
import { TableDuplication } from '../extensions/table-duplication.js';

import { BLANK_PARAGRAPH, encodeInline } from '../markdown/encode.js';
import { inlineContent } from '../markdown/decode.js';

/**
 * A line break inside a cell, written the one way a table can hold one: a row is
 * a line, and a real newline cuts it in two, the halves reading as nothing in
 * particular and the whole table going with them.
 */
const LINE_BREAK = '<br>';

/** How wide a column is drawn when nobody has dragged it. */
const DEFAULT_COLUMN_WIDTH = 160;

/** The widths a table's columns were dragged to, said in a comment of our own. */
const WIDTHS = /^<!--\s*cols:\s*([\d.,\s]+?)\s*-->$/;

/** What a read marker becomes, until {@link foldWidths} puts it where it belongs. */
const WIDTHS_BLOCK = 'table/widths';

/**
 * Tables, written one line per row.
 *
 * Everything a cell holds stays on its line: a line break is `<br>`, a pipe is
 * escaped, and a cell holding nothing is written as nothing, the pipes around it
 * holding it open.
 *
 * How wide a column is drawn is not something markdown says, so it rides in a
 * comment under the table, written only where a column was actually dragged. Any
 * other reader passes over it and sees the plain table it is.
 *
 * The handles that insert and delete a row or a column float above the editor
 * rather than inside the table: what draws a table is `prosemirror-tables`, down
 * to the column widths somebody drags, and a node view of our own around it
 * would take that away.
 *
 * @param {{ defaultColumnWidth?: number, labels?: Record<string, string> }} [options]
 * @returns {import('./registry.js').RichTextFeature}
 */
export function tableFeature(options = {}) {
    const byDefault = options.defaultColumnWidth ?? DEFAULT_COLUMN_WIDTH;

    return {
        name: 'table',
        extensions: [Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, TableDuplication],
        surfaces: [(editor) => h(TableHandles, { editor, labels: options.labels ?? {} })],

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
        markdown: {
            encoders: { table: (node) => encodeTable(node, byDefault) },
            decoders: { table_open: readTable, paragraph_open: readWidths },
            after: foldWidths,
        },
    };
}

/**
 * @param {object} node - Table node, ProseMirror JSON
 * @param {number} byDefault - The width of a column nobody dragged
 * @returns {string}
 */
export function encodeTable(node, byDefault = DEFAULT_COLUMN_WIDTH) {
    const rows = (node.content ?? []).filter((row) => row.type === 'tableRow');

    if (rows.length === 0) {
        return '';
    }

    const lines = [];

    rows.forEach((row, at) => {
        const cells = row.content ?? [];

        lines.push(`|${cells.map(encodeCell).join('|')}|`);

        // Without the line under its first row a table is not a table at all:
        // every reader takes the whole of it for a paragraph.
        if (at === 0) {
            lines.push(`|${cells.map(() => '-').join('|')}|`);
        }
    });

    return `${lines.join('\n')}${widthsMarker(rows[0], byDefault)}`;
}

function encodeCell(cell) {
    const markdown = (cell.content ?? [])
        .map((block) => encodeInline(block))
        .join('\n')
        .trim();

    // What the encoder writes for a line holding nothing, so that the line
    // survives at all. A cell needs no such thing, and reading it back gave
    // every empty cell a space.
    if (markdown === BLANK_PARAGRAPH) {
        return '';
    }

    return markdown.replaceAll('|', String.raw`\|`).replaceAll('\n', LINE_BREAK);
}

function widthsMarker(row, byDefault) {
    const widths = (row.content ?? []).map((cell) => Math.round(cell.attrs?.colwidth?.[0] ?? byDefault));

    return widths.every((width) => width === Math.round(byDefault)) ? '' : `\n<!-- cols:${widths.join(',')} -->`;
}

/**
 * A table read back with the line breaks its cells were written with.
 *
 * The structure is the parser's; what it cannot know is that a `<br>` in a cell
 * is a line break we wrote and not the four characters somebody typed.
 */
export function readTable(token, tokens, at) {
    const rows = [];
    let cells = null;

    for (let index = at + 1; index < tokens.length; index++) {
        const current = tokens[index];

        if (current.type === 'table_close') {
            break;
        }

        if (current.type === 'tr_open') {
            cells = [];
        } else if (current.type === 'tr_close' && cells) {
            rows.push({ type: 'tableRow', content: cells });
            cells = null;
        } else if ((current.type === 'th_open' || current.type === 'td_open') && cells) {
            const body = tokens[index + 1]?.type === 'inline' ? tokens[index + 1] : null;

            cells.push(cellOf(current.type === 'th_open' ? 'tableHeader' : 'tableCell', body));
        }
    }

    if (rows.length === 0) {
        return null;
    }

    // The parser reads the widths marker as one more row: unlike the Dart one,
    // it only ends a table on a blank line, and the comment sits right under the
    // last row. Taking it back out here keeps the marker out of the source and
    // the two implementations on the same document.
    const widths = widthsOfRow(rows.at(-1));

    if (widths) {
        rows.pop();
    }

    const table = { type: 'table', content: rows };

    return [widths ? widened(table, widths) : table];
}

/** The widths a row says, where the row is nothing but the marker. */
function widthsOfRow(row) {
    const cells = row?.content ?? [];
    const said = cells.map(textOf);

    if (said.length === 0 || said.slice(1).some((text) => text.length > 0)) {
        return null;
    }

    return widthsOf(said[0]);
}

function textOf(cell) {
    return ((cell?.content ?? [])[0]?.content ?? [])
        .map((run) => run.text ?? '')
        .join('')
        .trim();
}

/** The widths a marker holds, or `null` where the text is not one. */
function widthsOf(text) {
    const marker = WIDTHS.exec(text);

    if (!marker) {
        return null;
    }

    const widths = marker[1]
        .split(',')
        .map((width) => Number(width.trim()))
        .filter((width) => Number.isFinite(width));

    return widths.length === 0 ? null : widths;
}

function cellOf(type, body) {
    const content = unbroken(body ? inlineContent(body) : []);

    return {
        type,
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [{ type: 'paragraph', ...(content.length > 0 ? { content } : {}) }],
    };
}

/** The runs of a cell, with the line breaks it was written with put back. */
function unbroken(runs) {
    return runs.flatMap((run) => {
        if (run.type !== 'text' || !run.text.includes(LINE_BREAK)) {
            return [run];
        }

        const pieces = run.text.split(LINE_BREAK);

        return pieces.flatMap((text, at) => [
            ...(at > 0 ? [{ type: 'hardBreak' }] : []),
            ...(text.length > 0 ? [{ ...run, text }] : []),
        ]);
    });
}

/**
 * The widths marker, read as a block of its own for {@link foldWidths} to fold
 * into the table above it.
 *
 * Any other paragraph is handed back to the core, which is what `null` says.
 */
export function readWidths(token, tokens, at) {
    if (token.level !== 0) {
        return null;
    }

    const body = tokens[at + 1]?.type === 'inline' ? tokens[at + 1] : null;
    const widths = widthsOf((body?.content ?? '').trim());

    return widths === null ? null : [{ type: WIDTHS_BLOCK, attrs: { widths } }];
}

/**
 * Gives each table the widths written under it and drops the markers.
 *
 * The pass a block parser cannot do: what a marker says belongs to the block
 * before it, and a parser only ever sees its own.
 *
 * @param {object[]} blocks
 * @returns {object[]}
 */
export function foldWidths(blocks) {
    if (!blocks.some((block) => block.type === WIDTHS_BLOCK)) {
        return blocks;
    }

    const kept = [];

    for (const block of blocks) {
        if (block.type !== WIDTHS_BLOCK) {
            kept.push(block);

            continue;
        }

        const table = kept.at(-1);

        if (table?.type === 'table') {
            kept[kept.length - 1] = widened(table, block.attrs?.widths ?? []);
        }
    }

    return kept;
}

function widened(table, widths) {
    return {
        ...table,
        content: (table.content ?? []).map((row) => ({
            ...row,
            content: (row.content ?? []).map((cell, column) =>
                column < widths.length
                    ? { ...cell, attrs: { ...cell.attrs, colwidth: [Math.round(widths[column])] } }
                    : cell
            ),
        })),
    };
}
