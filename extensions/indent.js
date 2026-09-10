import { Extension } from '@tiptap/core';

/** The blocks that can sit under another one. A list container never does: its items do. */
export const INDENTABLE_TYPES = [
    'paragraph',
    'heading',
    'blockquote',
    'codeBlock',
    'horizontalRule',
    'listItem',
    'taskItem',
    'image',
    'table',
];

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
export function rangeFrom(blocks, index) {
    const depth = blocks[index]?.indent ?? 0;
    let to = index + 1;

    while (to < blocks.length && (blocks[to].indent ?? 0) > depth) {
        to++;
    }

    return { from: index, to };
}

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
export function boundedDelta(blocks, range, delta) {
    const head = blocks[range.from]?.indent ?? 0;
    const above = range.from > 0 ? (blocks[range.from - 1].indent ?? 0) : -1;
    const ceiling = above + 1;
    const target = Math.min(Math.max(head + delta, 0), Math.max(ceiling, 0));

    return target - head;
}

/**
 * Nesting as an attribute rather than as a tree.
 *
 * The stored markdown is flat indentation, and the tree is only rebuilt on the
 * way in: a flat document is what the format actually says. Everything a nested
 * document would give is bought back by the range of {@link rangeFrom}, and
 * nothing in the schema has to be rewritten for it.
 */
export const Indent = Extension.create({
    name: 'indent',

    addOptions() {
        return { types: INDENTABLE_TYPES };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: (element) => Number(element.getAttribute('data-indent')) || 0,
                        renderHTML: (attributes) =>
                            attributes.indent
                                ? {
                                      'data-indent': attributes.indent,
                                      style: `margin-left:calc(${attributes.indent} * var(--fe-editor-indent-step, 1.5rem))`,
                                  }
                                : {},
                    },
                },
            },
        ];
    },

    addCommands() {
        const shift = (delta) => () => (props) => applyIndent(props, delta);

        return { indentBlocks: shift(1), outdentBlocks: shift(-1) };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => this.editor.commands.indentBlocks(),
            'Shift-Tab': () => this.editor.commands.outdentBlocks(),
        };
    },
});

/**
 * Moves the block holding the caret, and everything written under it, by [delta].
 *
 * One transaction: split in two, an undo would put the document back together in
 * pieces.
 */
function applyIndent({ state, tr, dispatch }, delta) {
    const blocks = [];

    state.doc.forEach((node, offset) => blocks.push({ node, offset, indent: node.attrs?.indent ?? 0 }));

    const index = blocks.findLastIndex((block) => block.offset <= state.selection.from - 1);

    if (index < 0 || blocks[index].node.attrs?.indent === undefined) {
        return false;
    }

    const range = rangeFrom(blocks, index);
    const applied = boundedDelta(blocks, range, delta);

    if (applied === 0) {
        return false;
    }

    if (dispatch) {
        for (let at = range.from; at < range.to; at++) {
            const block = blocks[at];

            tr.setNodeMarkup(tr.mapping.map(block.offset), undefined, {
                ...block.node.attrs,
                indent: block.indent + applied,
            });
        }
    }

    return true;
}
