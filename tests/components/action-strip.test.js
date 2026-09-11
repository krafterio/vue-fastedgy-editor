import { Editor } from '@tiptap/core';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import RichTextActionBar from '../../components/RichTextActionBar.vue';
import RichTextEditor from '../../components/RichTextEditor.vue';
import { createFeatures } from '../../features/registry.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { todoListFeature } from '../../features/todo-list.js';
import { editorExtensionsOf } from '../built.js';

const mounted = [];
const editors = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    while (editors.length > 0) {
        editors.pop().destroy();
    }

    document.body.innerHTML = '';
});

/**
 * An editor of its own, never one drawn by a mounted field.
 *
 * The bar takes the editor as a prop, and vue-test-utils walks every prop it is
 * handed looking for a ref: an editor a field is drawing holds the component
 * drawing it, and walking a live component instance is what Vue warns about.
 */
async function editorOf(markdown = '', features = createFeatures([])) {
    const editor = new Editor({
        element: document.createElement('div'),
        extensions: await editorExtensionsOf(features),
        content: createMarkdownCodec(features).decode(markdown),
    });

    editors.push(editor);

    return editor;
}

async function barOf(props) {
    const bar = mount(RichTextActionBar, { props, attachTo: document.body });

    mounted.push(bar);

    // What the features bring to write with, which the bar loads as an editor does.
    await props.features?.editing();
    await nextTick();

    return bar;
}

describe('the action strip', () => {
    it('offers the same groups as the mobile side, told apart by a rule', async () => {
        const editor = await editorOf('du texte');
        const bar = await barOf({ editor, features: createFeatures([]) });

        const labels = bar.findAll('[data-slot="editor-tappable"]').map((button) => button.attributes('aria-label'));

        expect(labels).toHaveLength(14);

        // One rule per group boundary: history, marks, lists, blocks, insert.
        expect(bar.findAll('[data-slot="editor-actions-rule"]')).toHaveLength(4);
    });

    it('offers the arrow only where the row has somewhere left to go', async () => {
        const editor = await editorOf('du texte');
        const bar = await barOf({ editor, features: createFeatures([]) });
        const nudges = () =>
            bar.findAll('[data-slot="editor-actions-nudge"]').map((one) => one.attributes('data-side'));

        // jsdom lays nothing out, so the row measures zero and has nowhere to go.
        expect(nudges()).toEqual([]);

        const track = bar.get('[data-slot="editor-actions-track"]').element;

        Object.defineProperty(track, 'scrollWidth', { value: 900, configurable: true });
        Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
        track.scrollLeft = 40;

        await bar.get('[data-slot="editor-actions-track"]').trigger('scroll');

        // Taken away rather than hidden: the dressing an application draws these
        // with has a component for a root, which Vue refuses `v-show` on.
        expect(nudges()).toEqual(['start', 'end']);
    });

    it('keeps an action it cannot run, and says it cannot', async () => {
        const editor = await editorOf('du texte');
        const bar = await barOf({ editor, features: createFeatures([]), labels: { undo: 'Annuler' } });

        const undo = bar.get('[aria-label="Annuler"]');

        expect(undo.attributes('disabled')).toBeDefined();

        editor.commands.insertContentAt(1, 'x');
        await nextTick();

        expect(bar.get('[aria-label="Annuler"]').attributes('disabled')).toBeUndefined();
    });

    it('lights up what the caret already wears', async () => {
        const editor = await editorOf('# un titre');
        const bar = await barOf({ editor, features: createFeatures([]), labels: { heading1: 'Titre 1' } });

        editor.commands.setTextSelection(3);
        await nextTick();

        expect(bar.get('[aria-label="Titre 1"]').attributes('data-state')).toBe('on');
    });

    it('takes what a feature adds, in the group the feature names', async () => {
        const features = createFeatures([todoListFeature()]);
        const editor = await editorOf('du texte', features);
        const bar = await barOf({ editor, features, labels: { todoList: 'Liste de tâches' } });

        expect(bar.find('[aria-label="Liste de tâches"]').exists()).toBe(true);
    });

    it('leaves the caret where it is when a button is pressed', async () => {
        const editor = await editorOf('du texte');
        const bar = await barOf({ editor, features: createFeatures([]), labels: { bold: 'Gras' } });

        const pressed = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

        bar.get('[aria-label="Gras"]').element.dispatchEvent(pressed);

        expect(pressed.defaultPrevented).toBe(true);
    });

    it('is the bubble that stands down where the application docks a bar', async () => {
        const field = mount(RichTextEditor, {
            props: { features: createFeatures([]), modelValue: 'du texte', formatBubble: false },
            attachTo: document.body,
        });

        mounted.push(field);
        await nextTick();

        expect(field.findComponent({ name: 'FormatBubble' }).exists()).toBe(false);
    });
});
