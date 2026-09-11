import javascript from 'highlight.js/lib/languages/javascript';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RichTextEditor from '../../components/RichTextEditor.vue';
import RichTextViewer from '../../components/RichTextViewer.vue';
import { codeBlockFeature } from '../../features/code-block.js';
import { createFeatures } from '../../features/registry.js';
import { built } from '../built.js';

/** The default languages, held back until [release] lets them through. */
let release;
let asked = 0;

vi.mock('../../features/code-languages.js', async (original) => {
    asked++;
    await new Promise((resolve) => (release = resolve));

    return original();
});

const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

const CODE = '```javascript\nconst a = 1;\n```';
const coloured = (wrapper) =>
    wrapper.findAll('pre code span').some((span) => span.classes().some((one) => one.startsWith('hljs-')));

describe('the languages of a code block', () => {
    it('colours a block written with the ones the application gives, and loads nothing', async () => {
        const feature = codeBlockFeature({ languages: { javascript } });
        const viewer = mount(RichTextViewer, { props: { value: CODE, features: createFeatures([feature]) } });

        mounted.push(viewer);

        expect(coloured(viewer)).toBe(true);
        await feature.ready();
        expect(asked).toBe(0);
    });

    // One load, held back once: a module is loaded once, and so is what holds it.
    it('draws a block plain until its default languages arrive, then coloured, read or written', async () => {
        const features = createFeatures([codeBlockFeature()]);
        const viewer = mount(RichTextViewer, { props: { value: CODE, features } });
        const editor = mount(RichTextEditor, { props: { modelValue: CODE, features }, attachTo: document.body });

        mounted.push(viewer, editor);

        // The editor built before they arrive, which is what it is told of.
        await built(editor);
        await vi.waitFor(() => expect(release).toBeTypeOf('function'));

        expect(coloured(viewer)).toBe(false);
        expect(coloured(editor)).toBe(false);

        release();

        await vi.waitFor(() => expect(coloured(viewer)).toBe(true));
        await vi.waitFor(() => expect(coloured(editor)).toBe(true));
        expect(asked).toBe(1);
    });

    it('colours at once the blocks of features built after they arrived, on the next screen', async () => {
        // Loaded by the test before; features built again, as a screen builds its own.
        const viewer = mount(RichTextViewer, {
            props: { value: CODE, features: createFeatures([codeBlockFeature()]) },
        });

        mounted.push(viewer);

        expect(coloured(viewer)).toBe(true);
    });
});
