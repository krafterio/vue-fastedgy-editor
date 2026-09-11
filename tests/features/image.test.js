import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { attachmentId, encodeImage, imageFeature, isAttachment } from '../../features/image.js';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { editorExtensionsOf } from '../built.js';

const codec = createMarkdownCodec(createFeatures([imageFeature()]));
const document = (...content) => ({ type: 'doc', content });
const image = (attrs) => ({ type: 'image', attrs });

/** What ProseMirror writes when it builds the DOM of a document. */
async function serialised(content) {
    const features = createFeatures([imageFeature()]);
    const editor = new Editor({
        element: window.document.createElement('div'),
        extensions: await editorExtensionsOf(features),
        content,
    });

    const html = editor.getHTML();

    editor.destroy();

    return html;
}

/** An editor with the feature mounted, and the pictures it is given. */
async function editorWithPictures(content, options = {}) {
    const features = createFeatures([imageFeature({ store: async () => 15, ...options })]);

    const editor = new Editor({
        element: window.document.createElement('div'),
        extensions: await editorExtensionsOf(features),
        content,
    });

    return editor;
}

const picture = (name) => new File(['x'], name, { type: 'image/png' });

describe('image', () => {
    it('lands a dropped picture where the pointer let go', async () => {
        const editor = await editorWithPictures('<p>avant</p><p>après</p>');

        // Where the second paragraph starts, which is not where the caret is.
        const dropped = editor.state.doc.content.size - 6;

        editor.view.posAtCoords = () => ({ pos: dropped, inside: dropped });

        const handled = editor.view.someProp('handleDrop', (handle) =>
            handle(
                editor.view,
                { dataTransfer: { files: [picture('a.png')] }, clientX: 0, clientY: 0, preventDefault: () => {} },
                null,
                false
            )
        );

        expect(handled).toBe(true);

        await new Promise((resolve) => setTimeout(resolve, 0));

        const kinds = editor.getJSON().content.map((block) => block.type);

        expect(kinds).toEqual(['paragraph', 'image', 'paragraph']);

        editor.destroy();
    });

    it('leaves a block moved inside the document alone', async () => {
        const editor = await editorWithPictures('<p>avant</p>');

        const handled = editor.view.someProp('handleDrop', (handle) =>
            handle(editor.view, { dataTransfer: { files: [picture('a.png')] } }, null, true)
        );

        expect(handled).toBeUndefined();

        editor.destroy();
    });

    it('keeps an address the browser cannot fetch off `src`', async () => {
        // Written on `src`, `attachment:` is an address as far as the browser is
        // concerned, and every DOM ProseMirror builds sets out to fetch it.
        const html = await serialised('<p></p><img data-src="attachment:15">');

        expect(html).toContain('data-src="attachment:15"');
        expect(html).not.toMatch(/\ssrc=/);
    });

    it('leaves an address it can fetch on `src`', async () => {
        expect(await serialised('<p></p><img src="https://melimelo.app/a.png">')).toContain(
            'src="https://melimelo.app/a.png"'
        );
    });

    it('writes the size in the address, rounded', async () => {
        expect(encodeImage(image({ src: 'attachment:15', width: 419.6, height: 280.2 }))).toBe(
            '![](attachment:15?w=420&h=280)'
        );
    });

    it('writes a width alone, never a height alone', async () => {
        expect(encodeImage(image({ src: 'a.png', width: 420 }))).toBe('![](a.png?w=420)');
        expect(encodeImage(image({ src: 'a.png', height: 280 }))).toBe('![](a.png)');
    });

    it('keeps all three forms of address as they stand', async () => {
        for (const src of ['attachment:15', 'data:image/png;base64,iVBORw0KGgo=', 'https://melimelo.app/a.png']) {
            expect(codec.decode(`![](${src})`).content[0]).toMatchObject({ type: 'image', attrs: { src } });
        }
    });

    it('never makes a picture of an address that could run', async () => {
        // The parser refuses the address before the feature ever sees it, and
        // what stays is the text somebody typed. The guard in the feature is the
        // second lock: this asserts the door, not which lock held.
        expect(codec.decode('![](javascript:alert(1))').content[0].type).toBe('paragraph');
        expect(codec.decode('![](vbscript:x)').content[0].type).toBe('paragraph');
    });

    it('hands back the paragraph that is not a picture alone', async () => {
        const blocks = codec.decode('avant ![](a.png) après').content;

        expect(blocks.map((block) => block.type)).toEqual(['paragraph']);
    });

    it('reads and rewrites a picture in the middle of a document', async () => {
        const source = 'avant\n\n![](attachment:15?w=420&h=280)\n\naprès';

        expect(codec.encode(codec.decode(source))).toBe(source);
    });

    it('does not take a lone picture for a cleared field', async () => {
        expect(codec.encode(document(image({ src: 'attachment:15' })))).toBe('![](attachment:15)');
    });

    it('names what is stored beside the record', async () => {
        expect(isAttachment('attachment:15')).toBe(true);
        expect(isAttachment('https://melimelo.app/a.png')).toBe(false);
        expect(attachmentId('attachment:15?w=420')).toBe(15);
        expect(attachmentId('data:image/png;base64,x')).toBe(null);
    });
});
