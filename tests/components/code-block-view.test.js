import { EditorContent, useEditor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';

import { codeBlockFeature } from '../../features/code-block.js';
import { createFeatures } from '../../features/registry.js';
import { editorExtensionsOf } from '../built.js';

const mountEditor = async (feature, content) => {
    const extensions = await editorExtensionsOf(createFeatures([feature]));

    return mount(
        defineComponent({
            setup() {
                const editor = useEditor({ extensions, content });

                return () => h('div', editor.value ? [h(EditorContent, { editor: editor.value })] : []);
            },
        })
    );
};

const fence = {
    type: 'doc',
    content: [{ type: 'codeBlock', attrs: { language: 'dart' }, content: [{ type: 'text', text: 'void main() {}' }] }],
};

describe('CodeBlockView', () => {
    it('mounts the language picker and the copy button on the lent bricks', async () => {
        const mounted = await mountEditor(codeBlockFeature({ labels: { copy: 'Copier', auto: 'auto' } }), fence);

        await nextTick();
        await nextTick();

        expect(mounted.find('[data-slot="editor-code-block"]').exists()).toBe(true);
        expect(mounted.find('[data-slot="editor-picker"]').exists()).toBe(true);
        expect(mounted.find('[data-slot="editor-tappable"]').attributes('aria-label')).toBe('Copier');
        expect(mounted.text()).toContain('void main() {}');
    });

    it('two editors on one view share nothing', async () => {
        const first = await mountEditor(codeBlockFeature(), fence);
        const second = await mountEditor(codeBlockFeature(), fence);

        await nextTick();
        await nextTick();

        expect(first.findAll('[data-slot="editor-code-block"]')).toHaveLength(1);
        expect(second.findAll('[data-slot="editor-code-block"]')).toHaveLength(1);

        first.unmount();

        expect(second.find('[data-slot="editor-code-block"]').exists()).toBe(true);
    });
});

describe('the language of a code block, as on mobile', () => {
    const block = (text, language = null) => ({
        type: 'doc',
        content: [{ type: 'codeBlock', attrs: { language }, content: [{ type: 'text', text }] }],
    });

    const settled = async () => {
        await nextTick();
        await nextTick();
    };

    const extensionOf = (feature) => feature.extensions.find((extension) => extension.name === 'codeBlock');

    it('offers every language highlight.js knows, each by its name', () => {
        const offered = extensionOf(codeBlockFeature()).options.languages();

        expect(offered.length).toBeGreaterThan(150);
        expect(offered).toContainEqual({ value: 'javascript', label: 'JavaScript' });
    });

    it('keeps only those an application keeps', () => {
        const feature = codeBlockFeature({ languages: { javascript, python } });

        expect(
            extensionOf(feature)
                .options.languages()
                .map((language) => language.value)
        ).toEqual(['javascript', 'python']);
    });

    it('says what guessing made of a block that names no language', async () => {
        const mounted = await mountEditor(
            codeBlockFeature(),
            block('const a = () => { return 1; };\nconsole.log(a());')
        );

        await settled();

        expect(mounted.get('[data-slot="editor-picker"]').text()).toBe('Auto · JavaScript');
    });

    it('says the language a block names, by its name', async () => {
        const mounted = await mountEditor(codeBlockFeature(), block('print(1)', 'python'));

        await settled();

        expect(mounted.get('[data-slot="editor-picker"]').text()).toBe('Python');
    });

    it('colours the code with the grammar it names', async () => {
        const mounted = await mountEditor(codeBlockFeature(), block('def a(): pass', 'python'));

        await settled();

        expect(mounted.find('pre code span.hljs-keyword').text()).toBe('def');
    });
});
