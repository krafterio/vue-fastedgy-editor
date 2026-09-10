import { describe, expect, it } from 'vitest';

import { createJsonCodec } from '../../json/codec.js';

const codec = createJsonCodec();

describe('the json codec', () => {
    it('carries a document back exactly as it went', () => {
        const document = {
            type: 'doc',
            content: [
                { type: 'heading', attrs: { level: 2, indent: 1 }, content: [{ type: 'text', text: 'titre' }] },
                { type: 'image', attrs: { src: 'attachment:15', width: 420 } },
            ],
        };

        expect(codec.decode(codec.encode(document))).toEqual(document);
    });

    it('writes nothing for a cleared field', () => {
        expect(codec.encode({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe('');
        expect(codec.encode({ type: 'doc', content: [] })).toBe('');
    });

    it('keeps a lone picture, which is something said', () => {
        expect(codec.encode({ type: 'doc', content: [{ type: 'image', attrs: { src: 'attachment:15' } }] })).not.toBe(
            ''
        );
    });

    it('never answers a document without a block', () => {
        for (const source of [null, '', '   ', 'pas du json', '{"type":"doc","content":[]}']) {
            expect(codec.decode(source)).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
        }
    });
});
