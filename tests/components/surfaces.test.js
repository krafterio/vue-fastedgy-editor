import { Editor } from '@tiptap/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { linkFeature } from '../../features/link.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { createFeatures } from '../../features/registry.js';
import { tableFeature } from '../../features/table.js';
import { editorExtensionsOf } from '../built.js';

const editors = [];

/** What a surface renders, which reka teleports out of the wrapper. */
const inBody = (selector) => document.querySelector(selector);
const allInBody = (selector) => [...document.querySelectorAll(selector)];

async function editorWith(features, content) {
    const editor = new Editor({
        element: document.createElement('div'),
        extensions: await editorExtensionsOf(features),
        content,
    });

    editors.push(editor);

    return editor;
}

/** Mounts what a feature floats above its editor, as RichTextEditor will. */
async function mountSurfaces(features, editor) {
    const editing = await features.editing();
    const mounted = mount(
        defineComponent({
            setup: () => () =>
                h('div', [
                    ...editing.surfaces.map((surface) => surface(editor)),
                    ...features.readingSurfaces.map((surface) => surface(() => editor.view.dom, {})),
                ]),
        }),
        { attachTo: document.body }
    );

    mountedSurfaces.push(mounted);

    return mounted;
}

const mountedSurfaces = [];

afterEach(() => {
    while (mountedSurfaces.length > 0) {
        mountedSurfaces.pop().unmount();
    }

    while (editors.length > 0) {
        editors.pop().destroy();
    }

    // Teleported surfaces outlive their wrapper otherwise, and answer for the
    // next test.
    document.body.innerHTML = '';
});

describe('LinkPopover', () => {
    const features = createFeatures([linkFeature({ labels: { address: 'Address' } })]);

    it('opens on the link the caret sits in, and on nothing else', async () => {
        const editor = await editorWith(features, '<p>see <a href="https://melimelo.app">this</a></p>');
        await mountSurfaces(features, editor);

        expect(inBody('[data-slot="editor-link-popover"]') !== null).toBe(false);

        editor.commands.setTextSelection(8);
        await nextTick();

        expect(inBody('[data-slot="editor-link-popover"]') !== null).toBe(true);
        expect(inBody('[data-slot="editor-link-popover"] input').value).toBe('https://melimelo.app');
    });
});

describe('TableHandles', () => {
    const features = createFeatures([tableFeature()]);
    const table = '<table><tbody><tr><th>a</th><th>b</th></tr><tr><td>c</td><td>d</td></tr></tbody></table>';

    it('hangs one handle per column and per row on the table under the pointer', async () => {
        const editor = await editorWith(features, table);
        const mounted = await mountSurfaces(features, editor);

        // The holder is always there, being what every handle is measured
        // against; what comes and goes is the handles.
        expect(mounted.find('[data-slot="editor-table-handles"]').exists()).toBe(true);
        expect(mounted.findAll('[data-slot="editor-menu"]')).toHaveLength(0);

        editor.view.dom.querySelector('td').dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        await nextTick();

        expect(mounted.findAll('[data-slot="editor-menu"]')).toHaveLength(4);
        expect(mounted.findAll('[data-slot="editor-table-grow"]')).toHaveLength(2);
    });
});

describe('MentionSuggestions', () => {
    const source = {
        trigger: '@',
        model: 'user',
        search: vi.fn(async () => [
            { id: 7, label: 'François', subtitle: 'francois@melimelo.app' },
            { id: 9, label: 'Jean' },
        ]),
    };

    const features = createFeatures([
        mentionFeature({
            sources: [source],
            addressing: pathAddressing({ user: '/household/members/{id}' }),
        }),
    ]);

    it('draws nothing rather than throwing when the record is gone', async () => {
        const missing = {
            ...source,
            preview: async () => null,
            search: async () => [{ id: 7, label: 'François' }],
        };

        const set = createFeatures([
            mentionFeature({ sources: [missing], addressing: pathAddressing({ user: '/household/members/{id}' }) }),
        ]);

        const editor = await editorWith(
            set,
            '<p><span data-type="mention" data-model="user" data-id="7" data-label="François">François</span></p>'
        );

        await mountSurfaces(set, editor);
        await nextTick();

        const chip = editor.view.dom.querySelector('[data-mention]');

        chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        await nextTick();

        expect(inBody('[data-slot="editor-mention-preview-title"]')).toBeNull();
    });

    it('shows the card when it is asked for, and never on the way past', async () => {
        const known = { ...source, preview: async () => ({ title: 'François' }) };

        const set = createFeatures([
            mentionFeature({ sources: [known], addressing: pathAddressing({ user: '/household/members/{id}' }) }),
        ]);

        const editor = await editorWith(
            set,
            '<p><span data-type="mention" data-model="user" data-id="7" data-label="François">François</span></p>'
        );

        await mountSurfaces(set, editor);
        await nextTick();

        const chip = editor.view.dom.querySelector('[data-mention]');

        // A card that opened on its own under a pointer merely reading covers
        // what is being read, line after line.
        chip.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
        await nextTick();
        await nextTick();

        expect(inBody('[data-slot="editor-mention-preview-title"]')).toBeNull();

        chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        // The card is loaded the first time one is asked for.
        await vi.waitFor(() =>
            expect(inBody('[data-slot="editor-mention-preview-title"]')?.textContent).toBe('François')
        );
    });

    it('draws the mark a source lends a candidate', async () => {
        vi.useFakeTimers();

        const faced = {
            ...source,
            search: async () => [{ id: 7, label: 'François', leading: () => h('i', { 'data-face': '' }) }],
        };

        const set = createFeatures([
            mentionFeature({ sources: [faced], addressing: pathAddressing({ user: '/household/members/{id}' }) }),
        ]);

        const editor = await editorWith(set, '<p></p>');

        await mountSurfaces(set, editor);

        editor.commands.insertContent('@fra');
        await vi.advanceTimersByTimeAsync(300);
        await nextTick();

        // A component, drawn where it is shown. A built node handed over instead
        // is the same node in two lists at once, and neither of them renders.
        expect(inBody('[data-face]') !== null).toBe(true);

        vi.useRealTimers();
    });

    it('offers what the source answers, and writes the mention that was picked', async () => {
        vi.useFakeTimers();

        const editor = await editorWith(features, '<p></p>');
        const editing = await features.editing();

        await mountSurfaces(features, editor);

        editor.commands.insertContent('@fra');
        await nextTick();

        expect(editing.holdsEnter({ editor })).toBe(true);

        await vi.advanceTimersByTimeAsync(300);
        await nextTick();

        expect(source.search).toHaveBeenCalledWith('fra');
        expect(allInBody('[role="option"]')).toHaveLength(2);

        allInBody('[role="option"]')[0].click();
        await nextTick();

        const written = editor.getJSON().content[0].content[0];

        expect(written).toEqual({ type: 'mention', attrs: { model: 'user', id: 7, label: 'François' } });
        expect(editing.holdsEnter({ editor })).toBe(false);

        vi.useRealTimers();
    });
});
