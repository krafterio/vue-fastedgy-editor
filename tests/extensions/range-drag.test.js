import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { afterEach, describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';
import { alongMargin, RangeDrag } from '../../extensions/range-drag.js';
import { imageFeature } from '../../features/image.js';

const editors = [];

afterEach(() => {
    while (editors.length > 0) {
        editors.pop().destroy();
    }
});

function editorWith(content, extensions = []) {
    const editor = new Editor({
        element: document.createElement('div'),
        extensions: [...coreExtensions(), RangeDrag, ...extensions],
        content,
    });

    editors.push(editor);

    return editor;
}

const blocksOf = (editor) => {
    const blocks = [];

    editor.state.doc.forEach((node, offset) => blocks.push({ node, pos: offset }));

    return blocks;
};

/** The caret inside the block at [index], which is what is being dragged. */
const caretIn = (editor, index) => editor.commands.setTextSelection(blocksOf(editor)[index].pos + 1);

/** A drop on the block at [index], on the half of it [before] says. */
function dropOn(editor, index, before, moved = true) {
    const target = blocksOf(editor)[index];

    // jsdom lays nothing out, and which half of a block the pointer is on is
    // read from where the block is drawn.
    const drawn = document.createElement('p');

    drawn.getBoundingClientRect = () => ({ top: 0, height: 100 });

    // Inside the block, as a pointer over it reads: on the boundary, the block
    // that ends there would answer first.
    editor.view.posAtCoords = () => ({ pos: target.pos + 1, inside: target.pos });
    editor.view.nodeDOM = () => drawn;

    return editor.view.someProp('handleDrop', (handle) =>
        handle(editor.view, { clientX: 0, clientY: before ? 10 : 90, preventDefault: () => {} }, null, moved)
    );
}

const said = (editor) => editor.state.doc.content.content.map((node) => node.textContent);

describe('dragging a range of blocks', () => {
    it('moves the last block of a document, which reads past the range', () => {
        // `rangeFrom` answers a `to` that is excluded: read as the last block of
        // the range, the block at the end of a document reads past the array.
        const editor = editorWith('<p>un</p><p>deux</p><p>trois</p>');

        caretIn(editor, 2);

        expect(() => dropOn(editor, 0, true)).not.toThrow();
        expect(said(editor)).toEqual(['trois', 'un', 'deux']);
    });

    it('takes hold of the block the handle points at, not the one above it', () => {
        const editor = editorWith('<p>un</p><p>deux</p><p>trois</p>');
        const blocks = blocksOf(editor);

        // What the handle sets when a block is picked up: a selection starting
        // exactly where the block does. A block ends where the next one starts,
        // so that seam belongs to two blocks unless somebody says which.
        editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, blocks[1].pos)));

        dropOn(editor, 2, false);

        expect(said(editor)).toEqual(['un', 'trois', 'deux']);
    });

    it('leaves a drop that came from outside to whoever handles it', () => {
        const editor = editorWith('<p>un</p><p>deux</p>');

        caretIn(editor, 0);

        // A file dropped from outside is not a block being moved, and taking it
        // for one tears out the range under the caret.
        expect(dropOn(editor, 1, false, false)).toBeUndefined();
        expect(said(editor)).toEqual(['un', 'deux']);
    });

    it('takes a range that starts on a block holding no text', () => {
        const editor = editorWith(
            '<p>un</p><img src="https://melimelo.app/a.png"><p>deux</p>',
            imageFeature().extensions
        );

        caretIn(editor, 0);

        expect(() => dropOn(editor, 2, false)).not.toThrow();
    });

    it('lands at no depth at all what was dragged along the margin', () => {
        const written = '<p>zero</p><p>un</p><p>deux</p><p data-indent="1">sous deux</p>';
        const depths = (editor) => editor.state.doc.content.content.map((node) => node.attrs.indent);

        // Dropped under a block written one level deep, the block takes that
        // level: that is what dropping there means.
        const overTheText = editorWith(written);

        caretIn(overTheText, 1);
        dropOn(overTheText, 3, false);

        expect(said(overTheText)).toEqual(['zero', 'deux', 'sous deux', 'un']);
        expect(depths(overTheText)).toEqual([0, 0, 1, 1]);

        // The same drop, said from the margin, lands at the depth the margin
        // stands at.
        const editor = editorWith(written);
        const blocks = blocksOf(editor);

        caretIn(editor, 1);

        // jsdom lays nothing out, so the text says where its edges are, and the
        // block under the drop says where it is drawn.
        editor.view.dom.getBoundingClientRect = () => ({ left: 100, top: 0, right: 800, bottom: 400 });
        editor.view.posAtCoords = () => ({ pos: blocks[3].pos + 1, inside: blocks[3].pos });
        editor.view.nodeDOM = () =>
            Object.assign(document.createElement('p'), { getBoundingClientRect: () => ({ top: 0, height: 100 }) });

        const heard = [];

        editor.view.dom.addEventListener('drop', (event) => {
            heard.push(event.clientX);

            editor.view.someProp('handleDrop', (handle) => handle(editor.view, event, null, true));
        });

        const drop = new MouseEvent('drop', { bubbles: true, cancelable: true, clientX: 4, clientY: 90 });

        expect(alongMargin(editor.view, drop)).toBe(true);
        expect(heard).toEqual([101]);
        expect(said(editor)).toEqual(['zero', 'deux', 'sous deux', 'un']);
        expect(depths(editor)).toEqual([0, 0, 1, 0]);
    });

    it('tells the text a drag is over, wherever it was let go of', () => {
        const editor = editorWith('<p>un</p>');
        const heard = [];

        editor.view.dom.addEventListener('dragend', () => heard.push('over'));
        editor.view.dom.style.setProperty('--fe-drop-indent', '2');

        // The handle stands beside the text and not in it, so a drag begun there
        // ends there: nothing in the editor would have heard it, and the line
        // saying where the block would land would stay drawn.
        document.dispatchEvent(new Event('dragend'));

        expect(heard).toEqual(['over']);
        expect(editor.view.dom.style.getPropertyValue('--fe-drop-indent')).toBe('');
    });

    it('says nothing of a gesture that was over the text all along', () => {
        const editor = editorWith('<p>un</p>');

        editor.view.dom.getBoundingClientRect = () => ({ left: 100, top: 0, right: 800, bottom: 400 });

        expect(alongMargin(editor.view, new MouseEvent('mousemove', { clientX: 150, clientY: 10 }))).toBe(false);

        // Beside the page rather than beside a line: the margin only answers for
        // what the blocks really occupy.
        expect(alongMargin(editor.view, new MouseEvent('mousemove', { clientX: 4, clientY: 900 }))).toBe(false);
    });

    it('carries what is written deeper below it, and nothing more', () => {
        const editor = editorWith('<p>un</p><p data-indent="1">sous un</p><p>deux</p>');

        caretIn(editor, 0);

        dropOn(editor, 2, false);

        expect(said(editor)).toEqual(['deux', 'un', 'sous un']);
    });
});
