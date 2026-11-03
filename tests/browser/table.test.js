import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createFetcher } from 'vue-fastedgy';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

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
    /** An editor holding a table, set away from the corner of the page. */
    async function handled() {
        const holder = document.createElement('div');
        const elsewhere = document.createElement('div');

        holder.style.cssText = 'position:absolute;left:300px;top:200px;width:600px';
        elsewhere.style.cssText = 'position:absolute;left:0;top:0;width:40px;height:40px';
        document.body.append(holder, elsewhere);
        mounted.push(
            mount(RichTextEditor, {
                props: { features, modelValue: tableOf(2), editable: true },
                attachTo: holder,
                global: { plugins: [createPinia(), createFetcher()] },
            })
        );

        await expect.poll(() => holder.querySelector('.ProseMirror[contenteditable] td')).not.toBeNull();
        await userEvent.hover(holder.querySelector('.ProseMirror td'));
        await expect.poll(() => holder.querySelector('[data-slot="editor-menu"][data-side="row"]')).not.toBeNull();

        return {
            holder,
            elsewhere,
            table: () => holder.querySelector('.ProseMirror table').getBoundingClientRect(),
            handle: (slot, side) => holder.querySelector(`[data-slot="${slot}"][data-side="${side}"]`),
        };
    }

    const middle = (box) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

    it('stand astride the rules they take, wherever the field sits on the page', async () => {
        const { table, handle } = await handled();
        const box = table();

        near(middle(handle('editor-menu', 'column').getBoundingClientRect()).y, box.top, 2);
        near(middle(handle('editor-menu', 'row').getBoundingClientRect()).x, box.left, 2);
        near(handle('editor-table-grow', 'column').getBoundingClientRect().left, box.right, 2);
        near(handle('editor-table-grow', 'row').getBoundingClientRect().top, box.bottom, 2);
    });

    it('stay while the pointer goes to one, and while its menu is open', async () => {
        const { holder, handle } = await handled();
        const grip = handle('editor-menu', 'column');

        await userEvent.hover(grip);
        expect(grip.isConnected).toBe(true);

        await userEvent.click(grip);
        await expect
            .poll(() => document.querySelector('[data-slot="editor-menu-content"] [role="menuitem"]'))
            .not.toBeNull();
        await userEvent.hover(document.querySelector('[data-slot="editor-menu-content"] [role="menuitem"]'));

        expect(grip.isConnected).toBe(true);
        expect(holder.querySelector('[data-slot="editor-table-grow"]')).not.toBeNull();

        // The first action inserts a column to the left of the one the grip took.
        await userEvent.click(document.querySelector('[data-slot="editor-menu-content"] [role="menuitem"]'));
        await expect.poll(() => holder.querySelector('.ProseMirror table').rows[0].cells.length).toBe(3);
    });

    it('add a column and a row with their plus', async () => {
        const { holder, handle } = await handled();
        const shape = () => {
            const table = holder.querySelector('.ProseMirror table');

            return [table.rows.length, table.rows[0].cells.length];
        };

        await userEvent.click(handle('editor-table-grow', 'column'));
        await expect.poll(shape).toEqual([2, 3]);

        await userEvent.hover(holder.querySelector('.ProseMirror td'));
        await userEvent.click(handle('editor-table-grow', 'row'));
        await expect.poll(shape).toEqual([3, 3]);
    });

    it('go once the pointer is somewhere else', async () => {
        const { holder, elsewhere } = await handled();

        await userEvent.hover(elsewhere);

        await expect.poll(() => holder.querySelector('[data-slot="editor-table-grow"]')).toBeNull();
    });
});

describe('the edge of a column', () => {
    it('shows where it is taken by when the pointer is on it', async () => {
        const holder = document.createElement('div');

        holder.style.cssText = 'position:absolute;left:0;top:0;width:600px';
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
        const box = cell.getBoundingClientRect();

        cell.dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX: box.right - 1, clientY: box.top + box.height / 2 })
        );
        await expect.poll(() => holder.querySelector('.column-resize-handle')).not.toBeNull();

        const handle = holder.querySelector('.column-resize-handle').getBoundingClientRect();

        expect(handle.width).toBeGreaterThan(0);
        near(handle.left + handle.width / 2, box.right, 3);
        expect(getComputedStyle(holder.querySelector('.ProseMirror')).cursor).toBe('col-resize');
    });
});

describe('a selection of cells', () => {
    it('shows on the cells it holds', async () => {
        const holder = document.createElement('div');

        holder.style.cssText = 'position:absolute;left:0;top:0;width:600px';
        document.body.append(holder);
        mounted.push(
            mount(RichTextEditor, {
                props: { features, modelValue: tableOf(2), editable: true },
                attachTo: holder,
                global: { plugins: [createPinia(), createFetcher()] },
            })
        );

        await expect.poll(() => holder.querySelector('.ProseMirror[contenteditable] td')).not.toBeNull();

        // Three clicks take the whole cell.
        await userEvent.tripleClick(holder.querySelector('.ProseMirror td'));
        await expect.poll(() => holder.querySelector('.ProseMirror td.selectedCell')).not.toBeNull();

        const shade = getComputedStyle(holder.querySelector('.ProseMirror td.selectedCell'), '::after').backgroundColor;

        expect(shade).not.toBe('rgba(0, 0, 0, 0)');
    });
});
