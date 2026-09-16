import { getSchema } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { decodeChunk } from '../../markdown/decode.js';

const schema = getSchema(coreExtensions());
const codec = createMarkdownCodec();

describe('a task item', () => {
    it('leaves no empty text behind when a mark follows its box', () => {
        expect(decodeChunk('- [ ] **Prendre le sac**')).toEqual([
            {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Prendre le sac', marks: [{ type: 'bold' }] }],
                    },
                ],
            },
        ]);
    });

    it('keeps the words that follow the mark', () => {
        const [item] = decodeChunk('- [x] *a* b');

        expect(item.attrs.checked).toBe(true);
        expect(item.content[0].content).toEqual([
            { type: 'text', text: 'a', marks: [{ type: 'italic' }] },
            { type: 'text', text: ' b' },
        ]);
    });

    it('still trims the box off plain words', () => {
        expect(decodeChunk('- [ ] à faire')[0].content[0].content).toEqual([{ type: 'text', text: 'à faire' }]);
    });

    it('stays a task with nothing written in it', () => {
        for (const markdown of ['- [ ]', '- [x]']) {
            expect(decodeChunk(markdown)).toEqual([
                {
                    type: 'taskItem',
                    attrs: { checked: markdown === '- [x]' },
                    content: [{ type: 'paragraph' }],
                },
            ]);
            expect(codec.encode(codec.decode(markdown))).toBe(markdown);
        }
    });

    it('is not what an escaped box writes', () => {
        expect(decodeChunk('* \\[ ] a')[0]).toMatchObject({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '[ ] a' }] }],
        });
    });
});

// Tiptap answers a document ProseMirror refuses with a blank one, in silence:
// whatever the source, what is read has to be a document the editor holds.
describe('a document read', () => {
    const sources = [
        '- [ ] **Prendre le sac**',
        '- [x] _a_ b',
        '- [ ] [lien](https://example.com)',
        '- [ ]',
        '- [ ] [](https://example.com)',
        '* [x] `code`',
        '1. **a**',
        '# **a**',
        '#',
        '> **a**',
        '> ',
        '- ',
        '**',
        '****',
        '<u></u>',
        '``` ```',
        '```\n```',
        '[](https://example.com)',
        '[x](javascript:alert(1))',
        '[x](javascript:alert(1)) **b**',
        '&nbsp;',
    ];

    for (const source of sources) {
        it(`holds in the editor for ${JSON.stringify(source)}`, () => {
            expect(() => schema.nodeFromJSON(codec.decode(source)).check()).not.toThrow();
        });
    }

    it('writes a task whose box a mark follows back as it was', () => {
        for (const markdown of ['- [ ] **Prendre le sac**', '- [x] _a_ b', '- [ ] [lien](https://example.com)']) {
            expect(codec.encode(codec.decode(markdown))).toBe(markdown);
        }
    });
});
