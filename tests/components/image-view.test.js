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
