import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';

import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const addressing = pathAddressing({ note: '/notes/{id}', user: '/household/members/{id}' });
const codec = createMarkdownCodec(createFeatures([mentionFeature({ addressing })]));
const plain = createMarkdownCodec(createFeatures([mentionFeature()]));

const paragraph = (...content) => ({ type: 'doc', content: [{ type: 'paragraph', content }] });
const mention = (attrs) => ({ type: 'mention', attrs });

describe('mention', () => {
    it('writes a mention as the link it is', () => {
        expect(codec.encode(paragraph(mention({ model: 'note', id: 12, label: 'Courses' })))).toBe(
            '[Courses](/notes/12)'
        );
    });

    it('escapes the label rather than stripping it', () => {
        const markdown = codec.encode(paragraph(mention({ model: 'user', id: 9, label: 'jean@melimelo.app' })));

        expect(markdown).toBe(String.raw`[jean\@melimelo.app](/household/members/9)`);
        expect(codec.decode(markdown).content[0].content[0].attrs.label).toBe('jean@melimelo.app');
    });

    it('turns record links back into mentions, and those alone', () => {
        const read = codec.decode('[Courses](/notes/12) et [ailleurs](https://melimelo.app)');
        const kinds = read.content[0].content.map((run) => run.type);

        expect(kinds).toEqual(['mention', 'text', 'text']);
        expect(read.content[0].content[0].attrs).toEqual({ model: 'note', id: 12, label: 'Courses' });
    });

    it('refuses an address carrying a scheme', () => {
        expect(addressing.decode('https://melimelo.app/notes/12')).toBe(null);
        expect(addressing.decode('/notes/12')).toEqual({ model: 'note', id: 12 });
        expect(addressing.decode('/notes/12/edit')).toBe(null);
    });

    it('with no addressing, writes the label and reads no mention back', () => {
        expect(plain.encode(paragraph(mention({ model: 'note', id: 12, label: 'Courses' })))).toBe('Courses');
        expect(plain.decode('[Courses](/notes/12)').content[0].content[0].type).toBe('text');
    });
});

describe('while a mention is being written', () => {
    const editorOf = (feature) =>
        new Editor({
            element: document.createElement('div'),
            extensions: [...coreExtensions(), ...feature.extensions],
            content: '<p></p>',
        });

    /** Types [text] the way a keyboard does, so input rules see it. */
    function type(editor, text) {
        for (const character of text) {
            const { from, to } = editor.state.selection;
            const handled = editor.view.someProp('handleTextInput', (rule) => rule(editor.view, from, to, character));

            if (!handled) {
                editor.view.dispatch(editor.state.tr.insertText(character, from, to));
            }
        }
    }

    it('keeps the markdown rules out of the query', () => {
        const feature = mentionFeature({ sources: [{ trigger: '@', model: 'user', search: async () => [] }] });
        const editor = editorOf(feature);

        type(editor, '@**gras**');

        const runs = editor.getJSON().content[0].content;

        expect(runs).toHaveLength(1);
        expect(runs[0].text).toBe('@**gras**');
        expect(runs[0].marks).toBeUndefined();

        editor.destroy();
    });

    it('lets them through once nothing is being written', () => {
        const feature = mentionFeature({ sources: [{ trigger: '@', model: 'user', search: async () => [] }] });
        const editor = editorOf(feature);

        type(editor, '**gras** ');

        expect(editor.getJSON().content[0].content[0].marks).toEqual([{ type: 'bold' }]);

        editor.destroy();
    });

    it('offers one menu entry per source, the highest priority first', () => {
        const feature = mentionFeature({
            sources: [
                { trigger: '$', model: 'note', search: async () => [] },
                { trigger: '@', model: 'user', priority: 100, search: async () => [] },
            ],
        });

        expect(feature.menuItems.map((item) => item.name)).toEqual(['user', 'note']);
    });
});
