import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import RichTextEditor from '../../components/RichTextEditor.vue';
import RichTextViewer from '../../components/RichTextViewer.vue';
import { codeBlockFeature } from '../../features/code-block.js';
import { createFeatures } from '../../features/registry.js';
import { imageFeature } from '../../features/image.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';

const features = createFeatures([
    imageFeature(),
    mentionFeature({ addressing: pathAddressing({ note: '/notes/{id}' }) }),
]);

const viewerOf = (value, set = features) => mount(RichTextViewer, { props: { value, features: set } });

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

    it('reads a picture through the storage client, at the size it was given', () => {
        const viewer = viewerOf('![](attachment:15?w=420&h=280)');

        expect(viewer.find('img').attributes('src')).toContain('/storage/download/attachments/15');
        expect(viewer.find('[data-slot="editor-image-frame"]').attributes('style')).toContain('width: 420px');
    });

    it('opens the card of a chip clicked, as the editor does', async () => {
        const known = createFeatures([
            mentionFeature({
                addressing: pathAddressing({ note: '/notes/{id}' }),
                sources: [
                    {
                        model: 'note',
                        trigger: '@',
                        search: async () => [],
                        preview: async () => ({ title: 'Courses' }),
                    },
                ],
            }),
        ]);
        const viewer = mount(RichTextViewer, {
            props: { value: 'voir [Courses](/notes/12)', features: known },
            attachTo: document.body,
        });

        await viewer.get('[data-mention]').trigger('click');
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextTick();

        expect(document.body.querySelector('[data-slot="editor-mention-preview-title"]')?.textContent).toBe('Courses');

        viewer.unmount();
    });

    it('mounts ten of them without a single editor', () => {
        const viewers = Array.from({ length: 10 }, () => viewerOf('du texte'));

        // The elements an editor draws in, so the one stylesheet lays both out
        // alike, and none of what makes one: nothing editable, nothing mounted.
        expect(viewers.every((viewer) => viewer.find('.ProseMirror').exists())).toBe(true);
        expect(viewers.some((viewer) => viewer.find('[contenteditable]').exists())).toBe(false);
        expect(viewers.some((viewer) => viewer.findComponent({ name: 'EditorContent' }).exists())).toBe(false);
    });
});

describe('what a viewer draws of a code block', () => {
    it('colours it as the editor does, the feature bringing the colours', () => {
        const coloured = viewerOf('```javascript\nconst a = 1;\n```', features.and([codeBlockFeature()]));

        expect(coloured.find('pre code').text()).toBe('const a = 1;');
        expect(
            coloured
                .find('pre code span')
                .classes()
                .some((one) => one.startsWith('hljs-'))
        ).toBe(true);
    });

    it('reads a picture through the directive the fetcher registered, once it comes into sight', () => {
        const watched = vi.spyOn(IntersectionObserver.prototype, 'observe');
        const viewer = mount(RichTextViewer, { props: { value: '![](attachment:15)', features } });
        const picture = viewer.find('img').element;

        expect(watched).toHaveBeenCalledWith(picture);
        expect(picture.getAttribute('src')).toContain('/storage/download/attachments/15');

        watched.mockRestore();
    });
});

describe('a picture clicked', () => {
    const PICTURE = 'data:image/png;base64,iVBORw0KGgo=';

    const settled = async () => {
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextTick();
    };

    /** The same picture, in an editor and in a reader, each clicked. */
    async function clickedIn(component, set) {
        const value = `![](${PICTURE})`;
        const props = component === RichTextEditor ? { features: set, modelValue: value } : { features: set, value };
        const wrapper = mount(component, { props, attachTo: document.body });

        await settled();
        await wrapper.get('[data-slot="editor-image"] img').trigger('click');
        await settled();

        return wrapper;
    }

    for (const component of [RichTextEditor, RichTextViewer]) {
        const where = component === RichTextEditor ? 'written' : 'read';

        it(`opens the package's viewer, ${where}`, async () => {
            const wrapper = await clickedIn(component, createFeatures([imageFeature()]));

            expect(document.body.querySelector('[data-slot="editor-lightbox"]')).not.toBeNull();

            wrapper.unmount();
        });

        it(`opens the application's viewer instead, ${where}`, async () => {
            const seen = [];
            const Theirs = defineComponent({
                props: { picture: Object, labels: Object },
                setup: (props) => {
                    seen.push(props.picture);

                    return () => h('div', { 'data-theirs': '' });
                },
            });

            const wrapper = await clickedIn(component, createFeatures([imageFeature({ viewer: Theirs })]));

            expect(seen).toEqual([{ src: PICTURE, alt: '' }]);
            expect(document.body.querySelector('[data-slot="editor-lightbox"]')).toBeNull();

            wrapper.unmount();
        });

        it(`hands the picture to the application where it shows it its own way, ${where}`, async () => {
            const opened = [];
            const wrapper = await clickedIn(
                component,
                createFeatures([imageFeature({ open: (picture) => opened.push(picture) })])
            );

            expect(opened).toEqual([{ src: PICTURE, alt: '' }]);
            expect(document.body.querySelector('[data-slot="editor-lightbox"]')).toBeNull();

            wrapper.unmount();
        });
    }
});
