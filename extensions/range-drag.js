import { Extension } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';

import { blockAt, boundedDelta, rangeFrom } from './indent.js';

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
export const RangeDrag = Extension.create({
    name: 'rangeDrag',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handleDOMEvents: {
                        // What is picked up is the block plus everything written
                        // deeper below it, which is what the format calls its
                        // children.
                        dragstart: (view) => {
                            const picked = rangeAround(view.state);

                            if (picked) {
                                view.dispatch(view.state.tr.setSelection(picked.selection));
                            }

                            return false;
                        },

                        dragend: (view) => {
                            depthOf(view)?.style.removeProperty('--fe-drop-indent');

                            return false;
                        },

                        dragover: (view, event) => {
                            // What the drop indicator has to say beside where:
                            // how deep the block will land.
                            const at = landing(view, event);

                            depthOf(view)?.style.setProperty('--fe-drop-indent', String(at?.indent ?? 0));

                            return false;
                        },
                    },

                    /*
                     * Only what was picked up here.
                     *
                     * A file dropped from outside is not a block being moved:
                     * taken for one, the range under the caret is torn out and
                     * put back where the file was meant to land, and whoever
                     * handles files never sees the drop at all.
                     */
                    handleDrop: (view, event, _slice, moved) => (moved ? moveTo(view, event) : false),
                },

                /*
                 * A drag begun at the handle ends at the handle, which stands
                 * beside the text and not in it: nothing in the editor hears
                 * the end, so the line saying where the block would land stays
                 * drawn over a gesture that is over — and escape cancels a drag
                 * that goes on showing one.
                 *
                 * Heard on the page and said again to the text, where the drop
                 * cursor and the depth of the drop are both listening.
                 */
                view: (view) => {
                    const ended = () => view.dom.dispatchEvent(new Event('dragend'));

                    document.addEventListener('dragend', ended);

                    return { destroy: () => document.removeEventListener('dragend', ended) };
                },
            }),
        ];
    },
});

/**
 * Where the depth of a drop is written, which is where the line that reads it
 * hangs: ProseMirror puts it on the editor's `offsetParent`, in the layout of
 * the application rather than in the editor.
 */
const depthOf = (view) => view.dom.offsetParent ?? view.dom;

/** What was said from the margin, and therefore at no depth at all. */
const beside = new WeakSet();

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
export function alongMargin(view, event) {
    const box = view.dom.getBoundingClientRect();

    if (event.clientX >= box.left || event.clientY < box.top || event.clientY > box.bottom) {
        return false;
    }

    // Built from what it repeats, so a drag carries its own transfer over and a
    // move carries nothing it has not got.
    const Said = /** @type {new (type: string, init: object) => MouseEvent} */ (event.constructor);
    const said = new Said(event.type, {
        bubbles: true,
        cancelable: true,
        dataTransfer: /** @type {DragEvent} */ (event).dataTransfer,
        clientX: box.left + 1,
        clientY: event.clientY,
    });

    beside.add(said);
    view.dom.dispatchEvent(said);

    return true;
}

/** The blocks of the document, flat, as the format reads them. */
function blocksOf(state) {
    const blocks = [];

    state.doc.forEach((node, offset) => blocks.push({ node, pos: offset, indent: node.attrs?.indent ?? 0 }));

    return blocks;
}

/** The block the selection sits in, and the range it carries. */
function rangeAround(state) {
    const blocks = blocksOf(state);
    const at = blockAt(blocks, state.selection.from);

    if (at < 0) {
        return null;
    }

    const range = rangeFrom(
        blocks.map((block) => ({ indent: block.indent })),
        at
    );

    const first = blocks[range.from];

    // `to` is excluded, as `rangeFrom` says: read as the last block of the
    // range, a block dragged from the end of a document reads past it.
    const last = blocks[range.to - 1];

    return {
        at,
        range,
        from: first.pos,
        to: last.pos + last.node.nodeSize,
        // Between the two ends rather than on them: a range may start or finish
        // on a block that holds no text — a picture, a rule — and a text
        // selection cannot end there.
        selection: TextSelection.between(
            state.doc.resolve(first.pos),
            state.doc.resolve(Math.min(last.pos + last.node.nodeSize, state.doc.content.size))
        ),
    };
}

/**
 * Where a drop lands: the block under the pointer, how deep it sits, and which
 * side of it the pointer is on.
 *
 * Above the middle of a block means before it. Dropping always after would make
 * the first block of a document unreachable.
 */
function landing(view, event) {
    const at = view.posAtCoords({ left: event.clientX, top: event.clientY });

    if (!at) {
        return null;
    }

    const blocks = blocksOf(view.state);
    const found = blocks[blockAt(blocks, at.pos)];

    if (!found) {
        return null;
    }

    const drawn = view.nodeDOM(found.pos);
    const box = drawn instanceof Element ? drawn.getBoundingClientRect() : null;
    const before = box ? event.clientY < box.top + box.height / 2 : false;

    return { pos: found.pos, indent: beside.has(event) ? 0 : found.indent, node: found.node, before };
}

/**
 * The whole move, in one transaction: the range taken out, put back where it was
 * dropped, and every block in it given the depth it landed at.
 */
function moveTo(view, event) {
    const picked = rangeAround(view.state);
    const target = landing(view, event);

    if (!picked || !target) {
        return false;
    }

    const blocks = blocksOf(view.state);
    const first = blocks[picked.range.from];
    const { from, to } = picked;

    // Dropped inside what is being dragged: nothing to do, and doing it would
    // delete the range into itself.
    if (target.pos >= from && target.pos < to) {
        return true;
    }

    const delta = boundedDelta(
        blocks.map((block) => ({ indent: block.indent })),
        picked.range,
        target.indent - first.indent
    );

    const moved = [];

    for (let at = picked.range.from; at < picked.range.to; at++) {
        const block = blocks[at];

        moved.push(
            block.node.type.create(
                { ...block.node.attrs, indent: Math.max(0, block.indent + delta) },
                block.node.content,
                block.node.marks
            )
        );
    }

    const lands = target.before ? target.pos : target.pos + target.node.nodeSize;
    const tr = view.state.tr.delete(from, to);

    tr.insert(tr.mapping.map(lands), moved);
    view.dispatch(tr);
    event.preventDefault();

    return true;
}
