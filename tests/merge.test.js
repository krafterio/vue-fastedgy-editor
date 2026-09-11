import { describe, expect, it } from 'vitest';

import { mergeMarkdown, useMergedDocument } from '../merge.js';

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

describe('useMergedDocument', () => {
    const opened = (markdown) => {
        const content = { value: '' };
        const body = useMergedDocument(content);

        body.hold(markdown);

        return { content, body };
    };

    it('says there is nothing to save until something is written', () => {
        const { content, body } = opened('un\n\ndeux');

        expect(body.changed()).toBe(false);

        content.value = 'un\n\ndeux\n\ntrois';

        expect(body.changed()).toBe(true);
    });

    it('writes what somebody else wrote into what is being written, and holds it', () => {
        const { content, body } = opened('un\n\ndeux');

        content.value = 'un, ici\n\ndeux';
        body.absorb('un\n\ndeux, ailleurs');

        expect(content.value).toBe('un, ici\n\ndeux, ailleurs');
        expect(body.held()).toBe('un\n\ndeux, ailleurs');
        expect(body.changed()).toBe(true);
    });

    it('writes in what a save stored of what was sent, keeping what was typed since', () => {
        const { content, body } = opened('');
        const sent = '![](data:image/png;base64,AAA)\n\nla suite';

        content.value = `${sent}\n\nencore`;
        body.answered(sent, '![](attachment:15)\n\nla suite');

        expect(content.value).toBe('![](attachment:15)\n\nla suite\n\nencore');
        expect(body.held()).toBe('![](attachment:15)\n\nla suite');
    });

    it('holds what was sent where the server stored it as it was', () => {
        const { content, body } = opened('');

        content.value = 'du texte';
        body.answered('du texte', 'du texte');

        expect(body.changed()).toBe(false);
    });
});
