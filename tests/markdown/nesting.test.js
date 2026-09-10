import { describe, expect, it } from 'vitest';

import { joinChunks, parentOf, splitChunks } from '../../markdown/nesting.js';

describe('splitChunks', () => {
    it('ends a chunk on a blank line', () => {
        expect(splitChunks('a\n\nb')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 0 },
        ]);
    });

    it('ends a chunk on a change of depth, blank line or not', () => {
        expect(splitChunks('a\n    b')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 1 },
        ]);
    });

    it('never cuts a fence on the blank line it holds', () => {
        expect(splitChunks('```js\nun\n\ndeux\n```\n\naprès')).toEqual([
            { markdown: '```js\nun\n\ndeux\n```', indent: 0 },
            { markdown: 'après', indent: 0 },
        ]);
    });

    it('reads a tab as one level, which is what was written before', () => {
        expect(splitChunks('a\n\n\tb\n\n\t\tc')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 1 },
            { markdown: 'c', indent: 2 },
        ]);
    });
});

describe('joinChunks', () => {
    it('writes four spaces per level and a blank line between blocks', () => {
        expect(
            joinChunks([
                { markdown: 'a', indent: 0 },
                { markdown: 'b', indent: 2 },
            ])
        ).toBe('a\n\n        b');
    });

    it('never writes a tab', () => {
        expect(joinChunks([{ markdown: 'b', indent: 1 }])).not.toContain('\t');
    });

    it('drops a block that says nothing', () => {
        expect(
            joinChunks([
                { markdown: 'a', indent: 0 },
                { markdown: '   ', indent: 0 },
            ])
        ).toBe('a');
    });
});

describe('parentOf', () => {
    it('answers the nearest open block sitting less deep', () => {
        expect(
            parentOf(
                new Map([
                    [0, 'racine'],
                    [1, 'enfant'],
                ]),
                2
            )
        ).toBe('enfant');
        expect(parentOf(new Map([[0, 'racine']]), 2)).toBe('racine');
        expect(parentOf(new Map(), 1)).toBeNull();
    });
});
