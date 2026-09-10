import { describe, expect, it } from 'vitest';

import { mergeMarkdown } from '../merge.js';

describe('mergeMarkdown', () => {
    const base = ['# Courses', '', 'du pain', '', 'du lait'].join('\n');

    it('keeps what is held when the other side rewrote nothing', () => {
        const ours = base.replace('du lait', 'du lait entier');

        expect(mergeMarkdown(base, base, ours)).toBe(ours);
    });

    it('takes the whole answer when nothing was written here since', () => {
        const theirs = base.replace('du pain', 'du pain complet');

        expect(mergeMarkdown(base, theirs, base)).toBe(theirs);
    });

    it('writes what was rewritten elsewhere into what was written here', () => {
        // What only the server knows: the picture it stored, named.
        const theirs = base.replace('du pain', '![](attachment:15)');
        const ours = base.replace('du lait', 'du lait entier');

        expect(mergeMarkdown(base, theirs, ours)).toBe(
            ['# Courses', '', '![](attachment:15)', '', 'du lait entier'].join('\n')
        );
    });

    it('writes it in whichever order the two changes were made in', () => {
        const theirs = base.replace('du lait', '![](attachment:15)');
        const ours = base.replace('du pain', 'du pain complet');

        expect(mergeMarkdown(base, theirs, ours)).toBe(
            ['# Courses', '', 'du pain complet', '', '![](attachment:15)'].join('\n')
        );
    });

    it('carries lines added on both sides', () => {
        const theirs = `${base}\n\ndes œufs`;
        const ours = ['# Courses', '', 'des pâtes', '', 'du pain', '', 'du lait'].join('\n');

        expect(mergeMarkdown(base, theirs, ours)).toBe(
            ['# Courses', '', 'des pâtes', '', 'du pain', '', 'du lait', '', 'des œufs'].join('\n')
        );
    });

    it('keeps what was typed where both wrote in the same line', () => {
        // Nothing tells the two apart there, and a rewrite lost comes back at the
        // next save, while a sentence lost is lost.
        const theirs = base.replace('du pain', 'du pain de campagne');
        const ours = base.replace('du pain', 'du pain complet');

        expect(mergeMarkdown(base, theirs, ours)).toBe(ours);
    });
});
