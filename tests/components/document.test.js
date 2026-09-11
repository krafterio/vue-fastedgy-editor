import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DocumentEditor from '../../components/DocumentEditor.vue';
import DocumentViewer from '../../components/DocumentViewer.vue';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { built } from '../built.js';

const features = createFeatures([]);
const codec = createMarkdownCodec(features);
const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

async function documentOf({ slots, ...props } = {}) {
    const page = mount(DocumentEditor, {
        props: { features, codec, ...props },
        slots,
        attachTo: document.body,
    });

    mounted.push(page);

    await built(page);
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

    it('sets itself into the column it is given when flush', async () => {
        expect((await documentOf()).find('[data-slot="document"]').attributes('data-flush')).toBeUndefined();
        expect((await documentOf({ flush: true })).find('[data-slot="document"]').attributes('data-flush')).toBe('true');
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

    it('locks the text itself, which is what a form does while it saves', async () => {
        const page = await documentOf({ modelValue: 'du texte', editable: false });
        const editor = editorOf(page);

        expect(editor.isEditable).toBe(false);
        expect(page.find('.ProseMirror').attributes('contenteditable')).toBe('false');

        await page.setProps({ editable: true });

        expect(editor.isEditable).toBe(true);
    });

    it('reaches down the whole block, so the pointer can get to the handle', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const editor = editorOf(page);
        const gutter = page.find('[data-slot="document-gutter"]');

        expect(gutter.attributes('style')).toBeUndefined();

        // jsdom lays nothing out, so the block says how tall it is.
        editor.view.nodeDOM = () =>
            Object.assign(document.createElement('p'), {
                getBoundingClientRect: () => ({ height: 58 }),
            });

        page.findComponent({ name: 'DocumentGutter' }).vm.onNodeChange({ node: {}, pos: 0 });
        await nextTick();

        // One line tall, it is given up before the pointer leaving a paragraph
        // of three lines has reached it.
        expect(page.find('[data-slot="document-gutter"]').attributes('style')).toContain('min-height: 58px');
    });

    it('answers for the line beside it over the whole width of the margin', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const blocks = editorOf(page).view.dom;

        // jsdom lays nothing out, so the text says where its edges are.
        blocks.getBoundingClientRect = () => ({ left: 100, top: 0, right: 800, bottom: 400 });

        const said = [];

        blocks.addEventListener('mousemove', (event) => said.push([event.clientX, event.clientY]));

        const walk = (clientX, clientY) =>
            page
                .find('[data-slot="document-scroll"]')
                .element.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX, clientY }));

        // The handle is only as tall as its own line, and hangs far from the
        // text: what the pointer walks past out there is the whole margin.
        walk(4, 300);

        expect(said).toEqual([[101, 300]]);

        // Over the text it says itself, and answering would never end.
        walk(150, 300);

        // Beside the header, which is the application's and answers for itself.
        walk(4, 900);

        expect(said).toEqual([[101, 300]]);
    });

    it('drops what was dragged along the margin, at no depth at all', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const blocks = editorOf(page).view.dom;

        blocks.getBoundingClientRect = () => ({ left: 100, top: 0, right: 800, bottom: 400 });

        const said = [];

        blocks.addEventListener('drop', (event) => said.push([event.clientX, event.clientY]));

        const drop = new MouseEvent('drop', { bubbles: true, cancelable: true, clientX: 4, clientY: 300 });

        page.find('[data-slot="document-scroll"]').element.dispatchEvent(drop);

        // Said at the edge of the text: ProseMirror reads a drop by asking what
        // is under it, and nothing is under the margin.
        expect(said).toEqual([[101, 300]]);

        // The browser is told to do nothing of its own with it.
        expect(drop.defaultPrevented).toBe(true);
    });

    it('gives the handle up when the pointer leaves the page', async () => {
        const page = await documentOf({ modelValue: 'du texte' });
        const gutter = page.findComponent({ name: 'DocumentGutter' });

        gutter.vm.onNodeChange({ node: {}, pos: 0 });
        await nextTick();

        expect(page.find('[data-slot="document-gutter"]').attributes('data-shown')).toBe('true');

        await page.find('[data-slot="document-scroll"]').trigger('mouseleave');
        await nextTick();

        expect(page.find('[data-slot="document-gutter"]').attributes('data-shown')).toBeUndefined();
    });

    it('says the grip is draggable, a browser refusing to drag from a button', async () => {
        const page = await documentOf({ modelValue: 'du texte' });

        // The menu brick is rendered as a button, and a form control swallows
        // the press that would have started the drag of what holds it.
        expect(page.find('[data-slot="document-gutter"] [data-slot="editor-menu"]').attributes('draggable')).toBe(
            'true'
        );
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

        page.find('[data-slot="document-blocks"]').element.dispatchEvent(outside);
        page.find('[data-slot="document-blocks"]').element.dispatchEvent(inside);

        expect(outside.defaultPrevented).toBe(true);
        expect(inside.defaultPrevented).toBe(false);
    });

    it('leaves the header and the footer their own pointer, a title being typed in one', async () => {
        const page = await documentOf({
            modelValue: 'du texte',
            slots: { header: '<input data-title />', footer: '<button data-said>dire</button>' },
        });

        const blocks = editorOf(page).view.dom.getBoundingClientRect();

        for (const selector of ['[data-title]', '[data-said]']) {
            const pressed = new MouseEvent('pointerdown', {
                clientY: blocks.bottom + 200,
                cancelable: true,
                bubbles: true,
            });

            page.find(selector).element.dispatchEvent(pressed);

            expect(pressed.defaultPrevented, selector).toBe(false);
        }
    });

    it('says how far an upload is, out loud', async () => {
        let told;
        const page = await documentOf({
            cover: 'notes/15/cover.png',
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

        // The bar is loaded the first time a cover is sent.
        await vi.waitFor(() => expect(page.find('[data-slot="document-cover-progress"]').exists()).toBe(true));

        const bar = page.find('[data-slot="document-cover-progress"]');

        expect(bar.attributes('role')).toBe('progressbar');
        expect(bar.attributes('aria-label')).toBe('Envoi');

        told();
    });

    it('says when a cover was chosen, and stores it before saying so', async () => {
        const store = vi.fn(async () => 'notes/15/new.png');
        const page = await documentOf({
            cover: 'notes/15/cover.png',
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
    it('keeps the column and the cover, and nothing to write with', () => {
        const page = mount(DocumentViewer, {
            props: { value: '# titre', features, cover: 'notes/15/cover.png' },
        });

        expect(page.find('[data-slot="document-column"] h1').text()).toBe('titre');
        expect(page.find('[data-slot="document-cover"]').exists()).toBe(true);
        expect(page.find('[data-slot="document-gutter"]').exists()).toBe(false);
    });

    it('is laid out on the elements the editor is laid out on', async () => {
        const slots = (root) =>
            [...root.querySelectorAll('[data-slot]')]
                .map((element) => element.getAttribute('data-slot'))
                .filter((slot) => slot.startsWith('document-') && slot !== 'document-gutter');

        const written = await documentOf({ modelValue: '# titre', minHeight: '24rem' });
        const read = mount(DocumentViewer, {
            props: { value: '# titre', features, minHeight: '24rem' },
            attachTo: document.body,
        });

        mounted.push(read);

        // The same chain, down to the blocks, and the same size on the same
        // element: switched from one to the other, the page does not move.
        expect(slots(read.element)).toEqual(slots(written.element));
        expect(read.find('[data-slot="document-scroll"]').attributes('style')).toBe(
            written.find('[data-slot="document-scroll"]').attributes('style')
        );
        expect(read.element.style.containerType).toBe(written.element.style.containerType);
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

describe('a page without a cover', () => {
    it('keeps no room for one, even where one could be added', async () => {
        // As on mobile: a band offered to add a cover is a page that moves when
        // it is switched to reading.
        const page = await documentOf({ cover: '', pickFile: async () => null });

        expect(page.find('[data-slot="document-cover"]').exists()).toBe(false);
    });
});
