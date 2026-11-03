import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createFetcher } from 'vue-fastedgy';
import { afterEach, describe, expect, it } from 'vitest';

import DocumentEditor from '../../components/DocumentEditor.vue';
import DocumentViewer from '../../components/DocumentViewer.vue';
import RichTextEditor from '../../components/RichTextEditor.vue';
import RichTextViewer from '../../components/RichTextViewer.vue';
import { createFeatures } from '../../features/registry.js';
import { tableFeature } from '../../features/table.js';

const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

const features = createFeatures([tableFeature()]);

/** A table of [count] columns, their widths said when [widths] is given. */
function tableOf(count, widths = null) {
    const cells = (word) => `| ${Array.from({ length: count }, (_, at) => `${word} ${at + 1}`).join(' | ')} |`;
    const lines = [cells('Col'), `|${' --- |'.repeat(count)}`, cells('cell')];

    return lines.join('\n') + (widths ? `\n\n<!-- cols: ${widths.join(',')} -->` : '');
}

const RENDERINGS = {
    written: (value) => [RichTextEditor, { features, modelValue: value, editable: true }],
    locked: (value) => [RichTextEditor, { features, modelValue: value, editable: false }],
    read: (value) => [RichTextViewer, { features, value }],
    'page written': (value) => [DocumentEditor, { features, modelValue: value, editable: true }],
    'page read': (value) => [DocumentViewer, { features, value }],
};

/** The rendering drawn in a field [width] wide, once its table is. */
async function drawn(rendering, value, width) {
    const [component, props] = RENDERINGS[rendering](value);
    const holder = document.createElement('div');

    // The reset every application lays first: a page's column counts its
    // margins inside its width, and would stick out of the field without it.
    const reset = document.createElement('style');

    reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';
    holder.style.cssText = `position:absolute;left:0;top:0;width:${width}px`;
    document.body.append(reset, holder);
    mounted.push(mount(component, { props, attachTo: holder, global: { plugins: [createPinia(), createFetcher()] } }));

    await expect.poll(() => holder.querySelector('.tableWrapper table')).not.toBeNull();

    const wrapper = holder.querySelector('.tableWrapper');

    return { holder, wrapper, table: wrapper.querySelector('table') };
}

const scrolls = (element) => element.scrollWidth > element.clientWidth;

const near = (actual, expected, tolerance) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

/** The share of the table's width each of its columns takes. */
function sharesOf(table) {
    const total = table.getBoundingClientRect().width;

    return [...table.rows[0].cells].map((cell) => cell.getBoundingClientRect().width / total);
}

describe('a table', () => {
    for (const rendering of Object.keys(RENDERINGS)) {
        it(`narrows its columns to fit its field, ${rendering}`, async () => {
            const { holder, wrapper } = await drawn(rendering, tableOf(5), 640);

            expect(scrolls(wrapper)).toBe(false);
            expect(scrolls(holder)).toBe(false);
        });

        it(`narrows the widths dragged to fit its field, ${rendering}`, async () => {
            const { holder, wrapper } = await drawn(rendering, tableOf(3, [300, 300, 300]), 640);

            expect(scrolls(wrapper)).toBe(false);
            expect(scrolls(holder)).toBe(false);
        });

        it(`scrolls inside its field past the narrowest its columns go, ${rendering}`, async () => {
            const { holder, wrapper } = await drawn(rendering, tableOf(12), 400);

            expect(scrolls(wrapper)).toBe(true);
            expect(scrolls(holder)).toBe(false);
        });

        it(`fills its field, its columns in the proportions they were dragged to, ${rendering}`, async () => {
            const { wrapper, table } = await drawn(rendering, tableOf(3, [264, 100, 120]), 1000);

            near(table.getBoundingClientRect().width, wrapper.clientWidth, 2);
            sharesOf(table).forEach((share, at) => near(share, [264, 100, 120][at] / 484, 0.01));
        });

        it(`fills its field in equal shares where nobody resized a column, ${rendering}`, async () => {
            const { wrapper, table } = await drawn(rendering, tableOf(2), 1000);

            near(table.getBoundingClientRect().width, wrapper.clientWidth, 2);
            sharesOf(table).forEach((share) => near(share, 0.5, 0.01));
        });
    }
});

describe('the handles of a table', () => {
    it('hang on the table, wherever its field sits on the page', async () => {
        const holder = document.createElement('div');

        holder.style.cssText = 'position:absolute;left:300px;top:200px;width:600px';
        document.body.append(holder);
        mounted.push(
            mount(RichTextEditor, {
                props: { features, modelValue: tableOf(2), editable: true },
                attachTo: holder,
                global: { plugins: [createPinia(), createFetcher()] },
            })
        );

        await expect.poll(() => holder.querySelector('.ProseMirror[contenteditable] td')).not.toBeNull();

        const cell = holder.querySelector('.ProseMirror td');

        cell.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        await expect.poll(() => holder.querySelector('[data-slot="editor-table-grow"]')).not.toBeNull();

        // The plus that adds a column, beside the table's right edge.
        const grow = holder.querySelector('[data-slot="editor-table-grow"]').getBoundingClientRect();
        const table = holder.querySelector('.ProseMirror table').getBoundingClientRect();

        near(grow.left, table.right + 4, 2);
        near(grow.top, table.top, 2);
    });
});
