/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { describe, expect, it } from 'vitest';

import { boundedDelta, rangeFrom } from '../../extensions/indent.js';

const blocks = [{ indent: 0 }, { indent: 1 }, { indent: 2 }, { indent: 1 }, { indent: 0 }];

describe('rangeFrom', () => {
    it('emporte tout ce qui est écrit plus profond en dessous', () => {
        expect(rangeFrom(blocks, 0)).toEqual({ from: 0, to: 4 });
        expect(rangeFrom(blocks, 1)).toEqual({ from: 1, to: 3 });
    });

    it("s'arrête au premier bloc de même profondeur", () => {
        expect(rangeFrom([{ indent: 0 }, { indent: 0 }], 0)).toEqual({ from: 0, to: 1 });
    });

    it('rend le bloc seul quand rien ne le suit', () => {
        expect(rangeFrom(blocks, 4)).toEqual({ from: 4, to: 5 });
    });
});

describe('boundedDelta', () => {
    it("refuse de creuser sous le premier bloc, qui n'a personne au-dessus", () => {
        expect(boundedDelta(blocks, rangeFrom(blocks, 0), 1)).toBe(0);
    });

    it("ne saute jamais deux niveaux d'un coup", () => {
        const gap = [{ indent: 0 }, { indent: 0 }];

        expect(boundedDelta(gap, rangeFrom(gap, 1), 1)).toBe(1);
    });

    it('ne descend pas sous zéro', () => {
        expect(boundedDelta(blocks, rangeFrom(blocks, 0), -1)).toBe(0);
    });
});
