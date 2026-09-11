import { getSchema } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { DOMParser, DOMSerializer } from '@tiptap/pm/model';
import { describe, expect, it } from 'vitest';

import { MentionNode } from '../../extensions/mention.js';
import { RecordMention } from '../../extensions/record-mention.js';

/** The mention the core reads with, and tiptap's own as the mention feature writes it. */
const read = getSchema([Document, Paragraph, Text, MentionNode]);
const written = getSchema([Document, Paragraph, Text, RecordMention]);

const drawnIn = (schema, attrs) => {
    const doc = schema.nodeFromJSON({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'mention', attrs }] }],
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

describe('the mention the core reads with', () => {
    it('declares what tiptap declares', () => {
        const [ours, theirs] = [read.nodes.mention.spec, written.nodes.mention.spec];

        expect(Object.keys(ours.attrs)).toEqual(Object.keys(theirs.attrs));
        expect([ours.group, ours.inline, ours.atom, ours.selectable]).toEqual([
            theirs.group,
            theirs.inline,
            theirs.atom,
            theirs.selectable,
        ]);
    });

    it('draws a mention as tiptap does', () => {
        const attrs = { model: 'note', id: 12, label: 'Courses' };

        expect(drawnIn(read, attrs)).toBe(drawnIn(written, attrs));
    });

    it('reads one back as tiptap does', () => {
        const html =
            '<p><span data-type="mention" data-model="user" data-id="7" data-label="François">François</span></p>';

        expect(parsedIn(read, html)).toEqual(parsedIn(written, html));
    });
});
