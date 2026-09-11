import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';

import { editingExtensions } from '../../extensions/editing.js';
import { coreExtensions } from '../../extensions/schema.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { writeInto } from '../../composables/editor.js';

const codec = createMarkdownCodec();
const editors = [];

afterEach(() => {
    while (editors.length > 0) {
        editors.pop().destroy();
    }
});

function editorWith(markdown) {
    const editor = new Editor({
        element: document.createElement('div'),
        extensions: [...coreExtensions(), ...editingExtensions()],
        content: codec.decode(markdown),
    });

    editors.push(editor);

    return editor;
}

const said = (editor) => editor.state.doc.content.content.map((node) => node.textContent);

describe('writing a document into an editor', () => {
    const written = ['du pain', '', 'du lait', '', 'des œufs'].join('\n');

    it('leaves the caret where it was when another block changed', () => {
        const editor = editorWith(written);
        const caret = editor.state.doc.content.content[0].nodeSize + 3;

        editor.commands.setTextSelection(caret);

        expect(writeInto(editor, codec.decode(written.replace('des œufs', 'des œufs frais')))).toBe(true);

        expect(said(editor)).toEqual(['du pain', 'du lait', 'des œufs frais']);
        expect(editor.state.selection.from).toBe(caret);
    });

    it('replaces the block that changed, and no other', () => {
        const editor = editorWith(written);
        const kept = editor.state.doc.content.content[2];

        writeInto(editor, codec.decode(written.replace('du pain', 'du pain complet')));

        // The very node, not one that reads the same: the rest of the document
        // was never touched.
        expect(editor.state.doc.content.content[2]).toBe(kept);
    });

    it('says nothing was written when the document is already that one', () => {
        const editor = editorWith(written);

        expect(writeInto(editor, codec.decode(written))).toBe(false);
    });

    it('takes a block away, and adds one', () => {
        const shorter = editorWith(written);

        writeInto(shorter, codec.decode(['du pain', '', 'des œufs'].join('\n')));

        expect(said(shorter)).toEqual(['du pain', 'des œufs']);

        const longer = editorWith(written);

        writeInto(longer, codec.decode(`${written}\n\ndu beurre`));

        expect(said(longer)).toEqual(['du pain', 'du lait', 'des œufs', 'du beurre']);
    });

    it('stays out of the undo history, holding what nobody here wrote', () => {
        const editor = editorWith(written);

        editor.commands.focus('end');
        editor.commands.insertContent(' frais');

        writeInto(editor, codec.decode(['du pain de la veille', '', 'du lait', '', 'des œufs frais'].join('\n')));
        editor.commands.undo();

        // Undone back to before what was typed here, never back over what came
        // from elsewhere: the picture a server stored under a name of its own.
        expect(said(editor)).toEqual(['du pain de la veille', 'du lait', 'des œufs']);
    });
});
