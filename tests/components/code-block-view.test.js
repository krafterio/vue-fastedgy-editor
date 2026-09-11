import { EditorContent, useEditor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import { all } from 'lowlight';

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
        await vi.waitFor(() => expect(mounted.find('[data-slot="editor-picker"]').exists()).toBe(true));
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

    it('offers the dozen a note most often holds, each by its name, once they are loaded', async () => {
        const feature = codeBlockFeature();

        await feature.ready();

        const offered = extensionOf(feature).options.languages();

        expect(offered.map((language) => language.value).sort()).toEqual([
            'dart',
            'ini',
            'java',
            'javascript',
            'json',
            'kotlin',
            'markdown',
            'python',
            'swift',
            'typescript',
            'xml',
            'yaml',
        ]);
        expect(offered).toContainEqual({ value: 'javascript', label: 'JavaScript' });
    });

    it('offers every language highlight.js knows, where the application asks for them all', () => {
        const offered = extensionOf(codeBlockFeature({ languages: all })).options.languages();

        expect(offered.length).toBeGreaterThan(150);
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

        await vi.waitFor(() => expect(mounted.find('[data-slot="editor-picker"]').text()).toBe('Auto · JavaScript'));
    });

    it('says the language a block names, by its name', async () => {
        const mounted = await mountEditor(codeBlockFeature(), block('print(1)', 'python'));

        await settled();

        await vi.waitFor(() => expect(mounted.find('[data-slot="editor-picker"]').text()).toBe('Python'));
    });

    it('colours the code with the grammar it names', async () => {
        const mounted = await mountEditor(codeBlockFeature(), block('def a(): pass', 'python'));

        await vi.waitFor(() => expect(mounted.find('pre code span.hljs-keyword').text()).toBe('def'));
    });
});
