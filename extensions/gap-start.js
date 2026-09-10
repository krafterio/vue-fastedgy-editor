import { Extension } from '@tiptap/core';
import { GapCursor } from '@tiptap/pm/gapcursor';
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state';

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
export const GapStart = Extension.create({
    name: 'gapStart',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                view: (view) => {
                    besideFirst(view);

                    return {};
                },

                props: {
                    handleClickOn: (view, position, node, at, event, direct) =>
                        direct && !node.isTextblock && standBeside(view, node, at, event),
                },
            }),
        ];
    },
});

function besideFirst(view) {
    const { selection, doc, tr } = view.state;

    if (!(selection instanceof NodeSelection) || selection.from !== 0) {
        return;
    }

    const at = doc.resolve(0);

    if (GapCursor.valid(at)) {
        view.dispatch(tr.setSelection(new GapCursor(at)));
    }
}

/**
 * The side of the block the pointer is on, which is where the caret goes.
 *
 * Clicking to the right of a picture asks for the caret after it; anywhere in
 * the left half asks for the caret before. Selecting the whole picture is the
 * handle's job, and it says so.
 */
function standBeside(view, node, at, event) {
    const drawn = view.nodeDOM(at);
    const box = drawn instanceof Element ? drawn.getBoundingClientRect() : null;
    const after = box ? event.clientX > box.left + box.width / 2 : false;
    const beside = view.state.doc.resolve(after ? at + node.nodeSize : at);

    // A gap cursor is only made where no caret could stand: between two
    // pictures, at either end of the document. Where one could — the end of the
    // paragraph above — that is the place, and the gap cursor would be a second
    // way of saying it.
    const caret = GapCursor.valid(beside) ? new GapCursor(beside) : TextSelection.near(beside, after ? 1 : -1);

    if (!caret) {
        return false;
    }

    view.dispatch(view.state.tr.setSelection(caret));

    return true;
}
