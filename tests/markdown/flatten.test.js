import { describe, expect, it } from 'vitest';

import { flatten } from '../../markdown/encode.js';

const said = (block) => block.node.content?.[0]?.content?.[0]?.text ?? '';
const laid = (doc) => flatten(doc).map((block) => [said(block), block.indent, block.number]);

const item = (text, content = []) => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }, ...content],
});

describe('flatten', () => {
    it('reads a depth an item carries as an attribute', () => {
        const doc = {
            type: 'doc',
            content: [
                { type: 'bulletList', content: [item('un')] },
                { type: 'bulletList', content: [{ ...item('a'), attrs: { indent: 1 } }] },
            ],
        };

        expect(laid(doc)).toEqual([
            ['un', 0, null],
            ['a', 1, null],
        ]);
    });

    it('reads a list nested inside an item as items written one level deeper', () => {
        // What `Tab` makes of an item: ProseMirror nests, the format says depth
        // with an attribute, and an encoder that walked past this would store a
        // note without somebody's sub-items.
        const doc = {
            type: 'doc',
            content: [
                {
                    type: 'bulletList',
                    content: [
                        item('un'),
                        item('deux', [
                            {
                                type: 'bulletList',
                                content: [item('a'), item('b', [{ type: 'bulletList', content: [item('i')] }])],
                            },
                        ]),
                    ],
                },
            ],
        };

        expect(laid(doc)).toEqual([
            ['un', 0, null],
            ['deux', 0, null],
            ['a', 1, null],
            ['b', 1, null],
            ['i', 2, null],
        ]);
    });

    it('lets the nesting win over the depth an item still carries', () => {
        // `Tab` moves an item into a list it makes, and the item goes on saying
        // the depth it had before: under a nest, the nesting is the truth.
        const doc = {
            type: 'doc',
            content: [
                {
                    type: 'bulletList',
                    content: [
                        { ...item('un'), attrs: { indent: 0 } },
                        {
                            ...item('deux', [
                                {
                                    type: 'bulletList',
                                    content: [{ ...item('a'), attrs: { indent: 0 } }],
                                },
                            ]),
                            attrs: { indent: 0 },
                        },
                    ],
                },
            ],
        };

        expect(laid(doc)).toEqual([
            ['un', 0, null],
            ['deux', 0, null],
            ['a', 1, null],
        ]);
    });

    it('goes on numbering an ordered list from where it starts', () => {
        const doc = {
            type: 'doc',
            content: [{ type: 'orderedList', attrs: { start: 3 }, content: [item('un'), item('deux')] }],
        };

        expect(laid(doc)).toEqual([
            ['un', 0, 3],
            ['deux', 0, 4],
        ]);
    });
});
