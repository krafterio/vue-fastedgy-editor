import { describe, expect, it } from 'vitest';

import { attachmentId, encodeImage, imageFeature, isAttachment } from '../../features/image.js';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const codec = createMarkdownCodec(createFeatures([imageFeature()]));
const document = (...content) => ({ type: 'doc', content });
const image = (attrs) => ({ type: 'image', attrs });

describe('image', () => {
    it('writes the size in the address, rounded', () => {
        expect(encodeImage(image({ src: 'attachment:15', width: 419.6, height: 280.2 }))).toBe(
            '![](attachment:15?w=420&h=280)'
        );
    });

    it('writes a width alone, never a height alone', () => {
        expect(encodeImage(image({ src: 'a.png', width: 420 }))).toBe('![](a.png?w=420)');
        expect(encodeImage(image({ src: 'a.png', height: 280 }))).toBe('![](a.png)');
    });

    it('keeps all three forms of address as they stand', () => {
        for (const src of ['attachment:15', 'data:image/png;base64,iVBORw0KGgo=', 'https://melimelo.app/a.png']) {
            expect(codec.decode(`![](${src})`).content[0]).toMatchObject({ type: 'image', attrs: { src } });
        }
    });

    it('never makes a picture of an address that could run', () => {
        // The parser refuses the address before the feature ever sees it, and
        // what stays is the text somebody typed. The guard in the feature is the
        // second lock: this asserts the door, not which lock held.
        expect(codec.decode('![](javascript:alert(1))').content[0].type).toBe('paragraph');
        expect(codec.decode('![](vbscript:x)').content[0].type).toBe('paragraph');
    });

    it('hands back the paragraph that is not a picture alone', () => {
        const blocks = codec.decode('avant ![](a.png) après').content;

        expect(blocks.map((block) => block.type)).toEqual(['paragraph']);
    });

    it('reads and rewrites a picture in the middle of a document', () => {
        const source = 'avant\n\n![](attachment:15?w=420&h=280)\n\naprès';

        expect(codec.encode(codec.decode(source))).toBe(source);
    });

    it('does not take a lone picture for a cleared field', () => {
        expect(codec.encode(document(image({ src: 'attachment:15' })))).toBe('![](attachment:15)');
    });

    it('names what is stored beside the record', () => {
        expect(isAttachment('attachment:15')).toBe(true);
        expect(isAttachment('https://melimelo.app/a.png')).toBe(false);
        expect(attachmentId('attachment:15?w=420')).toBe(15);
        expect(attachmentId('data:image/png;base64,x')).toBe(null);
    });
});
