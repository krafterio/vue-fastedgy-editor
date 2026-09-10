import { EditorContent, useEditor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';
import { imageFeature } from '../../features/image.js';

const mountEditor = (content) =>
    mount(
        defineComponent({
            setup() {
                const editor = useEditor({ extensions: [...coreExtensions(), ...imageFeature().extensions], content });

                return () => h('div', editor.value ? [h(EditorContent, { editor: editor.value })] : []);
            },
        })
    );

const documentOf = (src, attrs = {}) => ({
    type: 'doc',
    content: [{ type: 'image', attrs: { src, ...attrs } }],
});

describe('ImageView', () => {
    it('keeps the press off the document when the picture is clicked', async () => {
        // A paragraph before it, or the picture is the whole document and the
        // caret has nowhere else to be.
        const mounted = mountEditor({
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'du texte' }] },
                { type: 'image', attrs: { src: 'https://melimelo.app/a.png' } },
            ],
        });

        await nextTick();
        await nextTick();

        const pressed = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

        mounted.get('[data-slot="editor-image-frame"] img').element.dispatchEvent(pressed);

        // Left to reach ProseMirror, the press takes the picture as a whole and
        // the browser scrolls its own selection into view.
        expect(pressed.defaultPrevented).toBe(true);
        expect(mounted.get('[data-slot="editor-image"]').attributes('data-selected')).toBeUndefined();
    });

    it('takes hold of the picture when the handle is taken hold of', async () => {
        const mounted = mountEditor(documentOf('https://melimelo.app/a.png'));

        await nextTick();
        await nextTick();

        const handle = mounted.get('[data-slot="editor-image-handle"]');

        handle.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
        await nextTick();

        // Selected as a whole, which is what makes backspace, copy and cut mean
        // the picture rather than the letter the caret was next to.
        expect(mounted.get('[data-slot="editor-image"]').attributes('data-selected')).toBe('true');
    });

    it('draws a picture at the size it was given', async () => {
        const mounted = mountEditor(documentOf('https://melimelo.app/a.png', { width: 420, height: 280 }));

        await nextTick();
        await nextTick();

        const frame = mounted.find('[data-slot="editor-image-frame"]');

        expect(frame.attributes('style')).toContain('width: 420px');
        expect(frame.attributes('style')).toContain('height: 280px');
    });

    it('reads an attachment through the storage client, never by hand', async () => {
        const mounted = mountEditor(documentOf('attachment:15'));

        await nextTick();
        await nextTick();

        expect(mounted.find('img').attributes('src')).toContain('/storage/download/attachments/15');
    });

    it('keeps a data URI as the picture it already is', async () => {
        const mounted = mountEditor(documentOf('data:image/png;base64,iVBORw0KGgo='));

        await nextTick();
        await nextTick();

        expect(mounted.find('img').attributes('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
    });
});
