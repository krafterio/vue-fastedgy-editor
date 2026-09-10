import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';

import RichTextViewer from '../../components/RichTextViewer.vue';
import { highlightedCode } from '../../render/highlight.js';
import { createFeatures } from '../../features/registry.js';
import { imageFeature } from '../../features/image.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const codec = createMarkdownCodec(
    createFeatures([imageFeature(), mentionFeature({ addressing: pathAddressing({ note: '/notes/{id}' }) })])
);

const viewerOf = (value) => mount(RichTextViewer, { props: { value, codec } });

describe('RichTextViewer', () => {
    it('draws the blocks a document holds', () => {
        const viewer = viewerOf('# titre\n\n* une puce\n\n> une citation');

        expect(viewer.find('h1').text()).toBe('titre');
        expect(viewer.find('ul li').text()).toBe('une puce');
        expect(viewer.find('blockquote').text()).toBe('une citation');
    });

    it('draws the marks a run wears', () => {
        const viewer = viewerOf('**gras** et _italique_ et `code`');

        expect(viewer.find('strong').text()).toBe('gras');
        expect(viewer.find('em').text()).toBe('italique');
        expect(viewer.find('code').text()).toBe('code');
    });

    it('reads a picture through the storage client', () => {
        const viewer = viewerOf('![](attachment:15?w=420&h=280)');
        const picture = viewer.find('img');

        expect(picture.attributes('src')).toContain('/storage/download/attachments/15');
        expect(picture.attributes('width')).toBe('420');
    });

    it('says which record a chip was clicked on', async () => {
        const viewer = viewerOf('voir [Courses](/notes/12)');

        await viewer.find('[data-mention]').trigger('click');

        expect(viewer.emitted('mention')?.[0]).toEqual([{ model: 'note', id: 12 }]);
    });

    it('mounts ten of them without a single editor', () => {
        const created = vi.fn();
        const viewers = Array.from({ length: 10 }, () => viewerOf('du texte'));

        expect(viewers.every((viewer) => viewer.find('.ProseMirror').exists())).toBe(false);
        expect(created).not.toHaveBeenCalled();
    });
});

describe('what a viewer draws of a code block', () => {
    it('colours it where a registry is given, and leaves it plain otherwise', () => {
        const lowlight = createLowlight();

        lowlight.register({ javascript });

        const plain = mount(RichTextViewer, { props: { value: '```javascript\nconst a = 1;\n```', codec } });
        const coloured = mount(RichTextViewer, {
            props: { value: '```javascript\nconst a = 1;\n```', codec, highlight: highlightedCode(lowlight) },
        });

        expect(plain.find('pre code').text()).toBe('const a = 1;');
        expect(plain.find('pre code span').exists()).toBe(false);

        expect(coloured.find('pre code').text()).toBe('const a = 1;');
        expect(
            coloured
                .find('pre code span')
                .classes()
                .some((one) => one.startsWith('hljs-'))
        ).toBe(true);
    });

    it('carries the token on a picture where the application registered the directive', () => {
        const seen = [];
        const viewer = mount(RichTextViewer, {
            props: { value: '![](attachment:15)', codec },
            global: { directives: { 'fetcher-src': { mounted: (el) => seen.push(el.getAttribute('src')) } } },
        });

        expect(viewer.find('img').exists()).toBe(true);
        expect(seen[0]).toContain('/storage/download/attachments/15');
    });
});
