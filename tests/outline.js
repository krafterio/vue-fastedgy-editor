import { flatten } from '../markdown/encode.js';

/**
 * The block vocabulary the shared corpus is written in, which is no
 * implementation's own: a fixture that took a side would stop being an arbiter.
 */
const NEUTRAL_TYPES = {
    paragraph: 'paragraph',
    heading: 'heading',
    blockquote: 'quote',
    horizontalRule: 'divider',
    codeBlock: 'code',
    taskItem: 'todo',
    image: 'image',
    table: 'table',
};

/** Blocks that hold a paragraph rather than the words themselves. */
const WRAPS_A_PARAGRAPH = new Set(['listItem', 'taskItem', 'blockquote']);

/** Written out in this order on both sides, so two outlines compare literally. */
const MARK_ORDER = ['bold', 'italic', 'underline', 'strike', 'code'];

/** How wide a column is drawn when nobody has dragged it. */
const DEFAULT_COLUMN_WIDTH = 160;

/** What each cell of a table says, row by row. */
function cellsOf(table) {
    return (table.content ?? []).map((row) =>
        (row.content ?? []).map((cell) =>
            ((cell.content ?? [])[0]?.content ?? [])
                .map((run) => {
                    if (run.type === 'hardBreak') {
                        return '\n';
                    }

                    return run.type === 'mention' ? (run.attrs?.label ?? '') : (run.text ?? '');
                })
                .join('')
        )
    );
}

/** The width of each column, as the first row of a table carries them. */
function widthsOf(table) {
    const row = (table.content ?? [])[0];

    return (row?.content ?? []).map((cell) => Math.round(cell.attrs?.colwidth?.[0] ?? DEFAULT_COLUMN_WIDTH));
}

/**
 * A document as the corpus describes it: what each block is, how deep it sits,
 * what it says, and how what it says is marked.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object[]}
 */
export function outlineOf(doc) {
    return flatten(doc).map(({ node, indent, number }) => {
        const isTable = node.type === 'table';
        const body = WRAPS_A_PARAGRAPH.has(node.type) ? (node.content ?? [])[0] : node;
        const type = node.type === 'listItem' ? (number === null ? 'bullet' : 'numbered') : NEUTRAL_TYPES[node.type];

        return {
            type: type ?? node.type,
            indent,
            ...(isTable ? { cells: cellsOf(node) } : {}),
            attrs: {
                ...(node.attrs?.level != null ? { level: node.attrs.level } : {}),
                ...(node.attrs?.checked != null ? { checked: node.attrs.checked } : {}),
                ...(node.attrs?.language != null ? { language: node.attrs.language } : {}),
                ...(node.type === 'image' ? { src: node.attrs?.src ?? null } : {}),
                ...(node.attrs?.width != null ? { width: node.attrs.width } : {}),
                ...(node.attrs?.height != null ? { height: node.attrs.height } : {}),
                ...(isTable ? { widths: widthsOf(node) } : {}),
            },
            runs: (body?.content ?? [])
                .filter((run) => run.type === 'text' || run.type === 'mention')
                .map((run) => ({
                    // A mention is drawn from its label, and the corpus says
                    // where it points rather than how it is stored.
                    t: run.type === 'mention' ? (run.attrs?.label ?? '') : run.text,
                    m: MARK_ORDER.filter((mark) => (run.marks ?? []).some((own) => own.type === mark)),
                    href: (run.marks ?? []).find((mark) => mark.type === 'link')?.attrs?.href ?? null,
                    ...(run.type === 'mention' ? { mention: { model: run.attrs?.model, id: run.attrs?.id } } : {}),
                })),
        };
    });
}
