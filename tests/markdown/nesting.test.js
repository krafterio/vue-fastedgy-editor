/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { describe, expect, it } from 'vitest';

import { joinChunks, parentOf, splitChunks } from '../../markdown/nesting.js';

describe('splitChunks', () => {
    it('sépare sur une ligne vide', () => {
        expect(splitChunks('a\n\nb')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 0 },
        ]);
    });

    it('sépare sur un changement de profondeur, sans ligne vide', () => {
        expect(splitChunks('a\n    b')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 1 },
        ]);
    });

    it('ne coupe pas une fence sur la ligne vide qu elle contient', () => {
        expect(splitChunks('```js\nun\n\ndeux\n```\n\naprès')).toEqual([
            { markdown: '```js\nun\n\ndeux\n```', indent: 0 },
            { markdown: 'après', indent: 0 },
        ]);
    });

    it('lit une tabulation comme un niveau, ce que le paquet écrivait avant', () => {
        expect(splitChunks('a\n\n\tb\n\n\t\tc')).toEqual([
            { markdown: 'a', indent: 0 },
            { markdown: 'b', indent: 1 },
            { markdown: 'c', indent: 2 },
        ]);
    });
});

describe('joinChunks', () => {
    it('écrit quatre espaces par niveau et une ligne vide entre les blocs', () => {
        expect(
            joinChunks([
                { markdown: 'a', indent: 0 },
                { markdown: 'b', indent: 2 },
            ])
        ).toBe('a\n\n        b');
    });

    it('n écrit jamais une tabulation', () => {
        expect(joinChunks([{ markdown: 'b', indent: 1 }])).not.toContain('\t');
    });

    it('laisse tomber un bloc qui ne dit rien', () => {
        expect(
            joinChunks([
                { markdown: 'a', indent: 0 },
                { markdown: '   ', indent: 0 },
            ])
        ).toBe('a');
    });
});

describe('parentOf', () => {
    it('rend le bloc ouvert le plus proche à une profondeur moindre', () => {
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
