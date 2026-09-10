import { EditorContent, useEditor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import { codeBlockFeature } from '../../features/code-block.js';
import { coreExtensions } from '../../extensions/schema.js';

const mountEditor = (features, content) =>
    mount(
        defineComponent({
            setup() {
                const editor = useEditor({ extensions: [...coreExtensions(), ...features.extensions], content });

                return () => h('div', editor.value ? [h(EditorContent, { editor: editor.value })] : []);
            },
        })
    );

const fence = {
    type: 'doc',
    content: [{ type: 'codeBlock', attrs: { language: 'dart' }, content: [{ type: 'text', text: 'void main() {}' }] }],
};

describe('CodeBlockView', () => {
    it('mounts the language picker and the copy button on the lent bricks', async () => {
        const mounted = mountEditor(codeBlockFeature({ labels: { copy: 'Copier', auto: 'auto' } }), fence);

        await nextTick();
        await nextTick();

        expect(mounted.find('[data-slot="editor-code-block"]').exists()).toBe(true);
        expect(mounted.find('[data-slot="editor-picker"]').exists()).toBe(true);
        expect(mounted.find('[data-slot="editor-tappable"]').attributes('aria-label')).toBe('Copier');
        expect(mounted.text()).toContain('void main() {}');
    });

    it('two editors on one view share nothing', async () => {
        const first = mountEditor(codeBlockFeature(), fence);
        const second = mountEditor(codeBlockFeature(), fence);

        await nextTick();
        await nextTick();

        expect(first.findAll('[data-slot="editor-code-block"]')).toHaveLength(1);
        expect(second.findAll('[data-slot="editor-code-block"]')).toHaveLength(1);

        first.unmount();

        expect(second.find('[data-slot="editor-code-block"]').exists()).toBe(true);
    });
});
