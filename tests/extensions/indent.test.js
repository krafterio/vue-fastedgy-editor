import { describe, expect, it } from 'vitest';

import { boundedDelta, rangeFrom } from '../../extensions/indent.js';

const blocks = [{ indent: 0 }, { indent: 1 }, { indent: 2 }, { indent: 1 }, { indent: 0 }];

describe('rangeFrom', () => {
    it('takes everything written deeper below it', () => {
        expect(rangeFrom(blocks, 0)).toEqual({ from: 0, to: 4 });
        expect(rangeFrom(blocks, 1)).toEqual({ from: 1, to: 3 });
    });

    it('stops at the first block sitting as deep', () => {
        expect(rangeFrom([{ indent: 0 }, { indent: 0 }], 0)).toEqual({ from: 0, to: 1 });
    });

    it('answers the block alone when nothing follows it', () => {
        expect(rangeFrom(blocks, 4)).toEqual({ from: 4, to: 5 });
    });
});

describe('boundedDelta', () => {
    it('refuses to dig under the first block, which has nobody above it', () => {
        expect(boundedDelta(blocks, rangeFrom(blocks, 0), 1)).toBe(0);
    });

    it('never jumps two levels at once', () => {
        const gap = [{ indent: 0 }, { indent: 0 }];

        expect(boundedDelta(gap, rangeFrom(gap, 1), 1)).toBe(1);
    });

    it('never goes below zero', () => {
        expect(boundedDelta(blocks, rangeFrom(blocks, 0), -1)).toBe(0);
    });
});
