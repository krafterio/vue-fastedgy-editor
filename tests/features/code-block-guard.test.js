import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { editorExtensionsOf } from '../built.js';
import { codeBlockFeature } from '../../features/code-block.js';

const editorWithFence = async () =>
    new Editor({
        element: document.createElement('div'),
        extensions: await editorExtensionsOf(createFeatures([codeBlockFeature()])),
        content: { type: 'doc', content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'x' }] }] },
    });

describe('typing inside a fence', () => {
    it('writes the markdown triggers as the characters they are', async () => {
        const editor = await editorWithFence();

        editor.commands.setTextSelection(3);
        editor.commands.insertContent('\n# heading ');
        editor.commands.insertContent('\n* bullet ');

        const blocks = editor.getJSON().content;

        expect(blocks.map((block) => block.type)).toEqual(['codeBlock']);
        expect(blocks[0].content[0].text).toBe('x\n# heading \n* bullet ');

        editor.destroy();
    });
});
