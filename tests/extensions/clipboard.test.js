import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';
import { looksLikeMarkdown, pasteFromClipboard, richTextClipboard } from '../../extensions/clipboard.js';
import { pictureCarriers } from '../../features/editing/image.js';
import { imageFeature } from '../../features/image.js';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const codec = createMarkdownCodec(createFeatures([]));
const imageCodec = createMarkdownCodec(createFeatures([imageFeature()]));

const editorOf = () =>
    new Editor({
        element: document.createElement('div'),
        extensions: [...coreExtensions(), richTextClipboard({ codec })],
        content: '<p></p>',
    });

/**
 * Offers the editor what a clipboard would carry, and answers whether the
 * plugin took it.
 */
function paste(editor, { text = '', html = '' }) {
    const event = {
        preventDefault: () => {},
        clipboardData: { getData: (kind) => (kind === 'text/html' ? html : text) },
    };

    return editor.view.someProp('handlePaste', (handle) => handle(editor.view, event)) === true;
}

describe('looksLikeMarkdown', () => {
    it('reads a marked span wherever it sits', () => {
        expect(looksLikeMarkdown('voir **ceci**')).toBe(true);
        expect(looksLikeMarkdown('voir [ceci](https://melimelo.app)')).toBe(true);
    });

    it('reads a block marker only where there are lines to structure', () => {
        expect(looksLikeMarkdown('# une note prise à la volée')).toBe(false);
        expect(looksLikeMarkdown('# titre\n\ndu texte')).toBe(true);
    });

    it('says no to what was simply typed', () => {
        expect(looksLikeMarkdown('trois pommes et deux poires')).toBe(false);
        expect(looksLikeMarkdown('   ')).toBe(false);
    });
});

describe('the clipboard', () => {
    /** Asks the editor to copy, and answers what it wrote. */
    function copy(editor) {
        const written = {};
        const event = {
            preventDefault: () => {},
            clipboardData: { setData: (kind, value) => (written[kind] = value) },
        };

        editor.view.someProp('handleDOMEvents', (handlers) => handlers.copy?.(editor.view, event));

        return written;
    }

    it('writes markdown where a reader asks for text, and html where it asks for format', () => {
        const editor = editorOf();

        editor.commands.setContent('<p><strong>gras</strong> et <em>italique</em></p>');
        editor.commands.selectAll();

        const written = copy(editor);

        expect(written['text/plain']).toBe('**gras** et _italique_');
        expect(written['text/html']).toContain('<strong>gras</strong>');

        editor.destroy();
    });

    it('carries a picture inside what was copied', async () => {
        const written = [];

        globalThis.ClipboardItem = class {
            constructor(parts) {
                this.parts = parts;
            }
        };

        Object.defineProperty(globalThis.navigator, 'clipboard', {
            configurable: true,
            value: { write: async (items) => written.push(...items), writeText: () => {} },
        });

        const editor = new Editor({
            element: document.createElement('div'),
            extensions: [
                ...coreExtensions(),
                ...imageFeature().extensions,
                richTextClipboard({
                    codec: imageCodec,
                    carriers: pictureCarriers({
                        resolveImage: async () => 'data:image/png;base64,iVBORw0KGgo=',
                        fetchImage: async () => null,
                    }),
                }),
            ],
            content: { type: 'doc', content: [{ type: 'image', attrs: { src: 'attachment:15' } }] },
        });

        editor.commands.selectAll();
        copy(editor);

        await Promise.resolve();

        const blob = await written[0].parts['text/plain'];

        expect(await blob.text()).toBe('![](data:image/png;base64,iVBORw0KGgo=)');

        editor.destroy();
        delete globalThis.ClipboardItem;
    });

    it('reads pasted markdown as the blocks it describes', async () => {
        const editor = editorOf();

        expect(paste(editor, { text: '# titre\n\n* une puce' })).toBe(true);

        await Promise.resolve();

        expect(editor.getJSON().content.map((block) => block.type)).toEqual(['heading', 'bulletList']);

        editor.destroy();
    });

    it('pastes what is not markdown as the characters it is', () => {
        const editor = editorOf();

        expect(paste(editor, { text: 'trois pommes' })).toBe(false);

        editor.destroy();
    });
});

describe('pasting from a button', () => {
    const clipboardOf = (value) =>
        Object.defineProperty(globalThis.navigator, 'clipboard', { configurable: true, value });

    it('asks for the clipboard and reads what it holds', async () => {
        const editor = editorOf();

        clipboardOf({ readText: async () => '# titre\n\ndu texte' });

        expect(await pasteFromClipboard(editor)).toBe('pasted');

        await Promise.resolve();

        expect(editor.getJSON().content.map((block) => block.type)).toEqual(['heading', 'paragraph']);

        editor.destroy();
    });

    it('says when the reader refused, rather than pretending nothing happened', async () => {
        const editor = editorOf();

        clipboardOf({
            readText: async () => {
                throw Object.assign(new Error('no'), { name: 'NotAllowedError' });
            },
        });

        expect(await pasteFromClipboard(editor)).toBe('refused');

        editor.destroy();
    });

    it('says when there was nothing to paste', async () => {
        const editor = editorOf();

        clipboardOf({ readText: async () => '' });

        expect(await pasteFromClipboard(editor)).toBe('empty');

        editor.destroy();
    });

    it('says when the browser will not answer at all', async () => {
        const editor = editorOf();

        clipboardOf({});

        expect(await pasteFromClipboard(editor)).toBe('unsupported');

        editor.destroy();
    });
});
