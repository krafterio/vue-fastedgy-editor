import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { escapeOffsets, escapedAt, unescaped } from '../../markdown/escape.js';

const codec = createMarkdownCodec(createFeatures([]));
const paragraph = (text) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe('escapeOffsets', () => {
    it('offers the first punctuation character, then the whole first word', () => {
        expect(escapeOffsets('--- suite')).toEqual([[0], [0, 1, 2]]);
    });

    it('offers nothing where nothing could be escaped', () => {
        expect(escapeOffsets('abc def')).toEqual([]);
        expect(escapeOffsets('   ')).toEqual([]);
    });

    it('looks at the first word and no further', () => {
        expect(escapeOffsets('a #b')).toEqual([]);
    });
});

describe('unescaped', () => {
    it('answers the characters the backslashes stand for', () => {
        expect(unescaped('\\#titre')).toBe('#titre');
    });

    it('leaves a backslash that stands for nothing', () => {
        expect(unescaped('\\1')).toBe('\\1');
    });
});

describe('escapedAt', () => {
    it('refuse ce qui tombe hors du premier run', () => {
        const block = {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'ab' },
                { type: 'text', text: 'cd' },
            ],
        };

        expect(escapedAt(block, [3])).toBeNull();
    });
});

// No list decides what is escaped: the block is written, read back, compared
// to itself, and escaped until it comes back whole.
describe('escaping by reading back', () => {
    const ambiguous = [
        ['# pas un titre', '\\# pas un titre'],
        ['- pas une puce', '\\- pas une puce'],
        ['> pas une citation', '\\> pas une citation'],
        ['1. pas une liste', '1\\. pas une liste'],
        ['---', '\\---'],
        ['```js', '\\```js'],
    ];

    for (const [text, expected] of ambiguous) {
        it(`writes ${JSON.stringify(text)} so that it reads back`, () => {
            const markdown = codec.encode(paragraph(text));

            expect(markdown).toBe(expected);
            expect(codec.decode(markdown).content[0].type).toBe('paragraph');
            expect(codec.decode(markdown).content[0].content[0].text).toBe(text);
        });
    }

    it('escapes nothing markdown would read the right way anyway', () => {
        expect(codec.encode(paragraph('#pas un titre'))).toBe('#pas un titre');
        expect(codec.encode(paragraph('| a | b |'))).toBe('| a | b |');
    });
});
