import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';

import { createFeatures } from '../../features/registry.js';
import { encodeTable, tableFeature } from '../../features/table.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const codec = createMarkdownCodec(createFeatures([tableFeature()]));

const cell = (text, attrs = {}) => ({
    type: 'tableCell',
    attrs: { colspan: 1, rowspan: 1, colwidth: null, ...attrs },
    content: [{ type: 'paragraph', ...(text === '' ? {} : { content: [{ type: 'text', text }] }) }],
});

const table = (...rows) => ({ type: 'table', content: rows.map((cells) => ({ type: 'tableRow', content: cells })) });

describe('table', () => {
    it('writes a separator under the first row, and only there', () => {
        const markdown = encodeTable(table([cell('a'), cell('b')], [cell('c'), cell('d')], [cell('e'), cell('f')]));

        expect(markdown).toBe('|a|b|\n|-|-|\n|c|d|\n|e|f|');
    });

    it('leaves an empty cell empty', () => {
        expect(encodeTable(table([cell('a'), cell('')]))).toBe('|a||\n|-|-|');
    });

    it('keeps a cell on its line, whatever it holds', () => {
        const broken = {
            type: 'tableCell',
            attrs: { colspan: 1, rowspan: 1, colwidth: null },
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'un' },
                        { type: 'hardBreak' },
                        { type: 'text', text: 'deux|trois' },
                    ],
                },
            ],
        };

        expect(encodeTable(table([broken, cell('b')]))).toBe(String.raw`|un<br>deux\|trois|b|` + '\n|-|-|');
    });

    it('writes the widths marker only where a column was dragged', () => {
        expect(encodeTable(table([cell('a'), cell('b')]))).toBe('|a|b|\n|-|-|');
        expect(encodeTable(table([cell('a', { colwidth: [180] }), cell('b')]))).toBe(
            '|a|b|\n|-|-|\n<!-- cols:180,160 -->'
        );
    });

    it('gives the widths back to the table above them', () => {
        const read = codec.decode('|a|b|\n|-|-|\n|c|d|\n<!-- cols:180,240 -->');
        const widths = read.content[0].content[0].content.map((one) => one.attrs.colwidth);

        expect(read.content).toHaveLength(1);
        expect(widths).toEqual([[180], [240]]);
    });

    it('reads back a line break written inside a cell', () => {
        const read = codec.decode('|un<br>deux|b|\n|-|-|');
        const kinds = read.content[0].content[0].content[0].content[0].content.map((run) => run.type);

        expect(kinds).toEqual(['text', 'hardBreak', 'text']);
    });
});

describe('duplicating', () => {
    const editorOf = (html) =>
        new Editor({
            element: document.createElement('div'),
            extensions: [...coreExtensions(), ...tableFeature().extensions],
            content: html,
        });

    /** Where a word sits, so a test says which cell it means. */
    const posOf = (editor, word) => {
        let found = null;

        editor.state.doc.descendants((node, pos) => {
            if (found === null && node.isText && node.text === word) {
                found = pos + 1;
            }
        });

        return found;
    };

    const rowsOf = (editor) =>
        editor
            .getJSON()
            .content[0].content.map((row) => row.content.map((cell) => cell.content[0].content?.[0]?.text ?? ''));

    it('copies a column into the one it inserts', () => {
        const editor = editorOf(
            '<table><tbody><tr><th>a</th><th>b</th></tr><tr><td>c</td><td>d</td></tr></tbody></table>'
        );

        editor.commands.setTextSelection(posOf(editor, 'a'));
        editor.commands.duplicateColumn();

        expect(rowsOf(editor)).toEqual([
            ['a', 'a', 'b'],
            ['c', 'c', 'd'],
        ]);

        editor.destroy();
    });

    it('copies a row into the one it inserts', () => {
        const editor = editorOf(
            '<table><tbody><tr><th>a</th><th>b</th></tr><tr><td>c</td><td>d</td></tr></tbody></table>'
        );

        editor.commands.setTextSelection(posOf(editor, 'c'));
        editor.commands.duplicateRow();

        expect(rowsOf(editor)).toEqual([
            ['a', 'b'],
            ['c', 'd'],
            ['c', 'd'],
        ]);

        editor.destroy();
    });
});
