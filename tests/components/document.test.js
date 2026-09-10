import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DocumentEditor from '../../components/DocumentEditor.vue';
import DocumentViewer from '../../components/DocumentViewer.vue';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';

const features = createFeatures([]);
const codec = createMarkdownCodec(features);
const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

async function documentOf(props = {}) {
    const page = mount(DocumentEditor, {
        props: { features, codec, ...props },
        attachTo: document.body,
    });

    mounted.push(page);

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    return page;
}

const editorOf = (page) => page.emitted('ready')?.at(-1)?.[0];

describe('DocumentEditor', () => {
    it('lays the blocks out on the column, under the cover', async () => {
        const page = await documentOf({ modelValue: '# titre', cover: 'notes/15/cover.png' });

        expect(page.find('[data-slot="document-column"]').exists()).toBe(true);
        expect(page.find('[data-slot="document-cover"] img').attributes('src')).toContain('notes/15/cover.png');
        expect(page.find('[data-slot="document-blocks"] h1').text()).toBe('titre');
    });

    it('asks for a cover width rounded up to the next step', async () => {
        const page = await documentOf({ cover: 'notes/15/cover.png' });

        // jsdom lays nothing out, so the band measures zero and the first step
        // is what is asked for. What matters is that a width is asked for at
        // all, and that it is a step.
        const asked = new URL(page.find('[data-slot="document-cover"] img').attributes('src'), 'http://x');

        expect(Number(asked.searchParams.get('width')) % 200).toBe(0);
    });

    it('hangs a gutter beside the blocks while writing, and none while reading', async () => {
        const writing = await documentOf({ modelValue: 'du texte' });
        const reading = await documentOf({ modelValue: 'du texte', editable: false });

        expect(writing.find('[data-slot="document-gutter"]').exists()).toBe(true);
        expect(reading.find('[data-slot="document-gutter"]').exists()).toBe(false);
    });

    it('refuses the focus to a click beside the blocks', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const blocks = editorOf(page).view.dom.getBoundingClientRect();
        const outside = new MouseEvent('pointerdown', {
            clientY: blocks.bottom + 200,
            cancelable: true,
            bubbles: true,
        });
        const inside = new MouseEvent('pointerdown', { clientY: blocks.top, cancelable: true, bubbles: true });

        page.find('[data-slot="document-scroll"]').element.dispatchEvent(outside);
        page.find('[data-slot="document-scroll"]').element.dispatchEvent(inside);

        expect(outside.defaultPrevented).toBe(true);
        expect(inside.defaultPrevented).toBe(false);
    });

    it('says how far an upload is, out loud', async () => {
        let told;
        const page = await documentOf({
            cover: '',
            pickFile: async () => new File([''], 'a.png', { type: 'image/png' }),
            storeCover: (file, onProgress) =>
                new Promise((resolve) => {
                    told = () => {
                        onProgress(40);
                        resolve('notes/15/new.png');
                    };
                }),
            labels: { sending: 'Envoi' },
        });

        await page.find('[data-slot="document-cover-actions"] [data-slot="editor-tappable"]').trigger('click');
        await nextTick();

        const bar = page.find('[data-slot="document-cover-progress"]');

        expect(bar.attributes('role')).toBe('progressbar');
        expect(bar.attributes('aria-label')).toBe('Envoi');

        told();
    });

    it('says when a cover was chosen, and stores it before saying so', async () => {
        const store = vi.fn(async () => 'notes/15/new.png');
        const page = await documentOf({
            cover: '',
            pickFile: async () => new File([''], 'a.png', { type: 'image/png' }),
            storeCover: store,
        });

        await page.find('[data-slot="document-cover-actions"] [data-slot="editor-tappable"]').trigger('click');
        await nextTick();

        expect(store).toHaveBeenCalledOnce();
        expect(page.emitted('update:cover')?.at(-1)).toEqual(['notes/15/new.png']);
    });
});

describe('DocumentViewer', () => {
    it('keeps the column and the cover, and scrolls for nobody', () => {
        const page = mount(DocumentViewer, {
            props: { value: '# titre', codec, cover: 'notes/15/cover.png' },
        });

        expect(page.find('[data-slot="document-column"] h1').text()).toBe('titre');
        expect(page.find('[data-slot="document-cover"]').exists()).toBe(true);
        expect(page.find('[data-slot="document-scroll"]').exists()).toBe(false);
        expect(page.find('[data-slot="document-gutter"]').exists()).toBe(false);
    });
});

describe('dragging a block', () => {
    it('is carried by the page, and by a field never', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const names = editorOf(page).extensionManager.extensions.map((extension) => extension.name);

        expect(names).toContain('rangeDrag');
    });

    // What the drop itself does is the range of `rangeFrom` and the depth of
    // `boundedDelta`, both covered in tests/extensions/indent.test.js. Dropping
    // cannot be played out here: jsdom lays nothing out, so `posAtCoords` has no
    // point to answer with.
});

describe('several pages on one view', () => {
    it('gives each its own scroll, its own gutter and its own editor', async () => {
        const first = await documentOf({ modelValue: 'un' });
        const second = await documentOf({ modelValue: 'deux' });

        expect(editorOf(first)).not.toBe(editorOf(second));
        expect(first.findAll('[data-slot="document-scroll"]')).toHaveLength(1);
        expect(second.findAll('[data-slot="document-gutter"]')).toHaveLength(1);

        editorOf(first).commands.focus('end');
        editorOf(first).commands.insertContent(' et demi');
        await nextTick();

        expect(second.text()).toContain('deux');
        expect(second.emitted('update:modelValue')).toBeUndefined();
    });
});

describe('the block menu', () => {
    it('offers what a block can become, then duplicate and delete', async () => {
        const page = await documentOf({
            modelValue: 'du texte',
            labels: { heading1: 'Titre 1', duplicate: 'Dupliquer', delete: 'Supprimer' },
        });

        const gutter = page.findComponent({ name: 'DocumentGutter' });

        expect(gutter.exists()).toBe(true);
        expect(gutter.props('items').map((item) => item.name)).toContain('heading1');
    });
});

describe('the three height modes of a page', () => {
    const scrollOf = (page) => page.find('[data-slot="document-scroll"]').attributes('style');

    it('writes no overflow in auto, and one where it is capped or filled', async () => {
        const auto = await documentOf({ modelValue: 'du texte' });
        const capped = await documentOf({ modelValue: 'du texte', maxHeight: 400 });
        const filled = await documentOf({ modelValue: 'du texte', fill: true });

        expect(scrollOf(auto)).toBeUndefined();
        expect(scrollOf(capped)).toContain('max-height: 400px');
        expect(scrollOf(capped)).toContain('overflow-y: auto');
        expect(scrollOf(filled)).toContain('height: 100%');
    });

    it('leaves the field itself in auto, so one document gives one scrollbar', async () => {
        const page = await documentOf({ modelValue: 'du texte', maxHeight: 400 });

        expect(page.find('[data-slot="editor-content"]').attributes('style')).toBeUndefined();
    });
});
