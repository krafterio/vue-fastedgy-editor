import { getSchema } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Link from '@tiptap/extension-link';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { DOMParser, DOMSerializer } from '@tiptap/pm/model';
import { describe, expect, it } from 'vitest';

import { LinkMark } from '../../extensions/link.js';

/** The link the core reads with, and tiptap's own as the link feature brings it. */
const read = getSchema([Document, Paragraph, Text, LinkMark]);
const written = getSchema([Document, Paragraph, Text, Link.configure({ openOnClick: false, autolink: false })]);

const ADDRESSES = [
    'https://example.com',
    '/notes/12',
    'mailto:a@b.c',
    'tel:+33600000000',
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    `java${String.fromCharCode(0x2028)}script:alert(1)`,
    'data:text/html,x',
    'vbscript:x',
    'foo:bar',
    '',
];

const drawnIn = (schema, attrs) => {
    const doc = schema.nodeFromJSON({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'lien', marks: [{ type: 'link', attrs }] }] }],
    });
    const holder = document.createElement('div');

    holder.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));

    return holder.innerHTML;
};

const parsedIn = (schema, html) => {
    const holder = document.createElement('div');

    holder.innerHTML = html;

    return DOMParser.fromSchema(schema).parse(holder).toJSON();
};

describe('the link the core reads with', () => {
    it('declares what tiptap declares', () => {
        const [ours, theirs] = [read.marks.link.spec, written.marks.link.spec];

        expect(Object.keys(ours.attrs)).toEqual(Object.keys(theirs.attrs));
        expect(ours.attrs.target.default).toBe(theirs.attrs.target.default);
        expect(ours.attrs.rel.default).toBe(theirs.attrs.rel.default);
        expect([ours.inclusive, ours.excludes, ours.spanning]).toEqual([
            theirs.inclusive,
            theirs.excludes,
            theirs.spanning,
        ]);
    });

    for (const href of ADDRESSES) {
        it(`draws and reads ${JSON.stringify(href)} as tiptap does`, () => {
            const attrs = { href, title: 'un titre' };

            expect(drawnIn(read, attrs)).toBe(drawnIn(written, attrs));
            expect(parsedIn(read, `<p><a href="${href}" title="t">lien</a></p>`)).toEqual(
                parsedIn(written, `<p><a href="${href}" title="t">lien</a></p>`)
            );
        });
    }
});
