/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { escapeOffsets, escapedAt, unescaped } from '../../markdown/escape.js';

const codec = createMarkdownCodec(createFeatures([]));
const paragraph = (text) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe('escapeOffsets', () => {
    it('propose le premier caractère de ponctuation, puis tout le premier mot', () => {
        expect(escapeOffsets('--- suite')).toEqual([[0], [0, 1, 2]]);
    });

    it('ne propose rien quand rien ne peut être échappé', () => {
        expect(escapeOffsets('abc def')).toEqual([]);
        expect(escapeOffsets('   ')).toEqual([]);
    });

    it('ne regarde que le premier mot', () => {
        expect(escapeOffsets('a #b')).toEqual([]);
    });
});

describe('unescaped', () => {
    it('rend les caractères que les backslashs représentent', () => {
        expect(unescaped('\\#titre')).toBe('#titre');
    });

    it('laisse un backslash qui ne représente rien', () => {
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

// L'échappement n'est décidé par aucune liste : le bloc est écrit, relu, comparé
// à lui-même, et échappé jusqu'à ce qu'il revienne entier.
describe('échappement par vérification', () => {
    const ambiguous = [
        ['# pas un titre', '\\# pas un titre'],
        ['- pas une puce', '\\- pas une puce'],
        ['> pas une citation', '\\> pas une citation'],
        ['1. pas une liste', '1\\. pas une liste'],
        ['---', '\\---'],
        ['```js', '\\```js'],
    ];

    for (const [text, expected] of ambiguous) {
        it(`écrit ${JSON.stringify(text)} de façon à le relire`, () => {
            const markdown = codec.encode(paragraph(text));

            expect(markdown).toBe(expected);
            expect(codec.decode(markdown).content[0].type).toBe('paragraph');
            expect(codec.decode(markdown).content[0].content[0].text).toBe(text);
        });
    }

    it("n'échappe pas ce que markdown ne lirait pas de travers", () => {
        expect(codec.encode(paragraph('#pas un titre'))).toBe('#pas un titre');
        expect(codec.encode(paragraph('| a | b |'))).toBe('| a | b |');
    });
});
