import { Editor } from '@tiptap/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { coreExtensions } from '../../extensions/schema.js';
import { linkFeature } from '../../features/link.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { createFeatures } from '../../features/registry.js';
import { tableFeature } from '../../features/table.js';

const editors = [];

function editorWith(features, content) {
    const editor = new Editor({
        element: document.createElement('div'),
        extensions: [...coreExtensions(), ...features.extensions],
        content,
    });

    editors.push(editor);

    return editor;
}

/** Mounts what a feature floats above its editor, as RichTextEditor will. */
function mountSurfaces(features, editor) {
    return mount(
        defineComponent({
            setup: () => () =>
                h(
                    'div',
                    features.surfaces.map((surface) => surface(editor))
                ),
        })
    );
}

afterEach(() => {
    while (editors.length > 0) {
        editors.pop().destroy();
    }
});

describe('LinkPopover', () => {
    const features = createFeatures([linkFeature({ labels: { address: 'Address' } })]);

    it('opens on the link the caret sits in, and on nothing else', async () => {
        const editor = editorWith(features, '<p>see <a href="https://melimelo.app">this</a></p>');
        const mounted = mountSurfaces(features, editor);

        expect(mounted.find('[data-slot="editor-link-popover"]').exists()).toBe(false);

        editor.commands.setTextSelection(8);
        await nextTick();

        expect(mounted.find('[data-slot="editor-link-popover"]').exists()).toBe(true);
        expect(mounted.find('input').element.value).toBe('https://melimelo.app');
    });
});

describe('TableHandles', () => {
    const features = createFeatures([tableFeature()]);
    const table = '<table><tbody><tr><th>a</th><th>b</th></tr><tr><td>c</td><td>d</td></tr></tbody></table>';

    it('hangs one handle per column and per row on the table under the pointer', async () => {
        const editor = editorWith(features, table);
        const mounted = mountSurfaces(features, editor);

        expect(mounted.find('[data-slot="editor-table-handles"]').exists()).toBe(false);

        editor.view.dom.querySelector('td').dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        await nextTick();

        expect(mounted.find('[data-slot="editor-table-handles"]').exists()).toBe(true);
        expect(mounted.findAll('[data-slot="editor-menu"]')).toHaveLength(4);
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

    it('offers what the source answers, and writes the mention that was picked', async () => {
        vi.useFakeTimers();

        const editor = editorWith(features, '<p></p>');
        const mounted = mountSurfaces(features, editor);

        editor.commands.insertContent('@fra');
        await nextTick();

        expect(features.holdsEnter({ editor })).toBe(true);

        await vi.advanceTimersByTimeAsync(300);
        await nextTick();

        expect(source.search).toHaveBeenCalledWith('fra');
        expect(mounted.findAll('[role="option"]')).toHaveLength(2);

        await mounted.findAll('[role="option"]')[0].trigger('click');
        await nextTick();

        const written = editor.getJSON().content[0].content[0];

        expect(written).toEqual({ type: 'mention', attrs: { model: 'user', id: 7, label: 'François' } });
        expect(features.holdsEnter({ editor })).toBe(false);

        vi.useRealTimers();
    });
});
