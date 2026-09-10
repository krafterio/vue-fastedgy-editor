import { Extension } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';

import { boundedDelta, rangeFrom } from './indent.js';

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
        const editor = this.editor;

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

                        dragend: () => {
                            editor.view.dom.style.removeProperty('--fe-drop-indent');

                            return false;
                        },

                        dragover: (view, event) => {
                            // What the drop indicator has to say beside where:
                            // how deep the block will land.
                            const at = landing(view, event);

                            view.dom.style.setProperty('--fe-drop-indent', String(at?.indent ?? 0));

                            return false;
                        },
                    },

                    handleDrop: (view, event) => moveTo(view, event),
                },
            }),
        ];
    },
});

/** The blocks of the document, flat, as the format reads them. */
function blocksOf(state) {
    const blocks = [];

    state.doc.forEach((node, offset) => blocks.push({ node, pos: offset, indent: node.attrs?.indent ?? 0 }));

    return blocks;
}

/** The block the selection sits in, and the range it carries. */
function rangeAround(state) {
    const blocks = blocksOf(state);
    const at = blocks.findIndex(
        (block) => state.selection.from >= block.pos && state.selection.from <= block.pos + block.node.nodeSize
    );

    if (at < 0) {
        return null;
    }

    const range = rangeFrom(
        blocks.map((block) => ({ indent: block.indent })),
        at
    );

    const first = blocks[range.from];
    const last = blocks[range.to];

    return {
        at,
        range,
        from: first.pos,
        to: last.pos + last.node.nodeSize,
        selection: TextSelection.create(
            state.doc,
            first.pos,
            Math.min(last.pos + last.node.nodeSize, state.doc.content.size)
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
    const found = blocks.find((block) => at.pos >= block.pos && at.pos <= block.pos + block.node.nodeSize);

    if (!found) {
        return null;
    }

    const drawn = view.nodeDOM(found.pos);
    const box = drawn instanceof Element ? drawn.getBoundingClientRect() : null;
    const before = box ? event.clientY < box.top + box.height / 2 : false;

    return { pos: found.pos, indent: found.indent, node: found.node, before };
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

    for (let at = picked.range.from; at <= picked.range.to; at++) {
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
