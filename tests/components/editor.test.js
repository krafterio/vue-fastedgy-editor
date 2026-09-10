import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import RichTextEditor from '../../components/RichTextEditor.vue';
import { codeBlockFeature } from '../../features/code-block.js';
import { imageFeature } from '../../features/image.js';
import { todoListFeature } from '../../features/todo-list.js';
import { createFeatures } from '../../features/registry.js';

const features = createFeatures([codeBlockFeature()]);

/** What a surface renders, which reka teleports out of the wrapper. */
const inBody = (selector) => document.querySelector(selector);
const allInBody = (selector) => [...document.querySelectorAll(selector)];

const mountedEditors = [];

// Surfaces are teleported to the body, so one left standing would answer for the
// next test. Every editor is taken down, and what it hung there with it.
afterEach(() => {
    while (mountedEditors.length > 0) {
        mountedEditors.pop().unmount();
    }

    document.body.innerHTML = '';
});

async function editorOf(props = {}) {
    // In the document, or the editor never learns it has the focus, which is
    // what half of what floats above it hangs on.
    const mounted = mount(RichTextEditor, { props: { features, ...props }, attachTo: document.body });

    mountedEditors.push(mounted);

    await nextTick();
    await nextTick();

    return mounted;
}

describe('RichTextEditor', () => {
    it('opens on what the field holds and writes back what was typed', async () => {
        const mounted = await editorOf({ modelValue: '# titre' });

        expect(mounted.find('h1').text()).toBe('titre');

        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        editor.commands.focus('end');
        editor.commands.insertContent(' suite');
        await nextTick();

        expect(mounted.emitted('update:modelValue')?.at(-1)).toEqual(['# titre suite']);
    });

    it('takes the words it is given from outside', async () => {
        const mounted = await editorOf({ modelValue: 'un' });

        await mounted.setProps({ modelValue: '* une puce' });
        await nextTick();

        expect(mounted.find('ul li').text()).toBe('une puce');
    });

    it('draws no scrollbar in auto, and one where it is capped', async () => {
        const auto = await editorOf({ modelValue: 'du texte' });
        const capped = await editorOf({ modelValue: 'du texte', maxHeight: 200 });
        const filled = await editorOf({ modelValue: 'du texte', fill: true });

        expect(auto.find('[data-slot="editor-content"]').attributes('style')).toBeUndefined();
        expect(capped.find('[data-slot="editor-content"]').attributes('style')).toContain('max-height: 200px');
        expect(capped.find('[data-slot="editor-content"]').attributes('style')).toContain('overflow-y: auto');
        expect(filled.find('[data-slot="editor-content"]').attributes('style')).toContain('height: 100%');
    });

    it('sends on Enter, unless a feature is holding the key', async () => {
        const mounted = await editorOf({ modelValue: '' });
        const content = mounted.find('[data-slot="editor-content"]');

        await content.trigger('keydown', { key: 'Enter' });

        expect(mounted.emitted('submit')).toHaveLength(1);

        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        editor.commands.setCodeBlock();
        await content.trigger('keydown', { key: 'Enter' });

        expect(mounted.emitted('submit')).toHaveLength(1);
    });

    it('lets two editors on one view hold their own', async () => {
        const first = await editorOf({ modelValue: 'un' });
        const second = await editorOf({ modelValue: 'deux' });

        first.findComponent({ name: 'EditorContent' }).props('editor').commands.insertContent(' et demi');
        await nextTick();

        expect(second.text()).toContain('deux');
        expect(second.emitted('update:modelValue')).toBeUndefined();

        first.unmount();

        expect(second.find('[data-slot="editor-content"]').exists()).toBe(true);
    });
});

describe('the "/" menu', () => {
    const editorFor = async (props = {}) => {
        const mounted = await editorOf({ labels: { heading1: 'Titre 1', quote: 'Citation' }, ...props });

        return { mounted, editor: mounted.findComponent({ name: 'EditorContent' }).props('editor') };
    };

    it('opens on a slash and narrows down as it is typed', async () => {
        const { editor } = await editorFor();

        editor.commands.insertContent('/');
        await nextTick();

        expect(inBody('[data-slot="editor-slash-menu"]') !== null).toBe(true);

        editor.commands.insertContent('cit');
        await nextTick();

        const offered = allInBody('[role="option"]').map((option) => option.textContent.trim());

        expect(offered).toEqual(['Citation']);
    });

    it('offers the blocks the mobile menu offers, the checkbox included', async () => {
        const set = createFeatures([todoListFeature()]);
        const { editor } = await editorFor({
            features: set,
            labels: { paragraph: 'Texte', todoList: 'Liste de tâches', heading1: 'Titre 1' },
        });

        editor.commands.insertContent('/');
        await nextTick();

        const offered = allInBody('[role="option"]').map((option) => option.textContent.trim());

        // The block a feature brings is offered by that feature: a set mounted
        // without it must not offer a list nothing can hold.
        expect(offered).toContain('Liste de tâches');
        expect(offered).toContain('Texte');
    });

    it('offers nothing a feature did not bring', async () => {
        const { editor } = await editorFor({ labels: { todoList: 'Liste de tâches' } });

        editor.commands.insertContent('/');
        await nextTick();

        expect(allInBody('[role="option"]').map((option) => option.textContent.trim())).not.toContain(
            'Liste de tâches'
        );
    });

    it('turns the line into what was picked, slash and query taken away', async () => {
        const { editor } = await editorFor();

        editor.commands.insertContent('/cit');
        await nextTick();

        inBody('[role="option"]').click();
        await nextTick();

        expect(editor.getJSON().content[0].type).toBe('blockquote');
        expect(editor.getText()).not.toContain('/cit');
    });

    it('leaves the slash written when it is closed', async () => {
        const { editor } = await editorFor();

        editor.commands.insertContent('/');
        await nextTick();

        // Where a key really comes from: the caret is in the editable node,
        // and that is what the menu listens on.
        editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(inBody('[data-slot="editor-slash-menu"]') !== null).toBe(false);
        expect(editor.getText()).toBe('/');
    });

    it('opens in the editor it was typed in, and in no other', async () => {
        const first = await editorFor();
        await editorFor();

        first.editor.commands.insertContent('/');
        await nextTick();

        // One on the page, and it belongs to the editor the slash was typed in.
        expect(allInBody('[data-slot="editor-slash-menu"]')).toHaveLength(1);
    });
});

describe('slashMenu: false', () => {
    it('leaves the slash to be typed, and offers nothing', async () => {
        const mounted = await editorOf({ slashMenu: false });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        editor.commands.insertContent('/');
        await nextTick();

        expect(allInBody('[data-slot="editor-slash-menu"]')).toHaveLength(0);
        expect(editor.getText()).toBe('/');
    });
});

describe('a document opening on a block that holds no text', () => {
    it('puts the caret beside the picture rather than on it', async () => {
        const set = createFeatures([imageFeature()]);
        const mounted = await editorOf({ features: set, modelValue: '![](https://a.fr/a.png)\n\nun' });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        // On it, the first key typed would replace the picture.
        expect(editor.state.selection.constructor.name).toBe('GapCursor');
    });

    it('puts the caret on the side a click beside the picture landed', async () => {
        const set = createFeatures([imageFeature()]);
        const mounted = await editorOf({ features: set, modelValue: 'un\n\n![](https://a.fr/a.png)' });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        let at = 0;

        editor.state.doc.forEach((node, offset) => {
            if (node.type.name === 'image') {
                at = offset;
            }
        });

        const picture = editor.state.doc.nodeAt(at);
        const drawn = editor.view.nodeDOM(at);

        drawn.getBoundingClientRect = () => ({ left: 0, width: 400 });

        const clicked = (x) =>
            editor.view.someProp('handleClickOn', (handle) =>
                handle(editor.view, at, picture, at, { clientX: x }, true)
            );

        // To the right, after it: nothing follows, so the place has to be made.
        expect(clicked(380)).toBe(true);
        expect(editor.state.selection.constructor.name).toBe('GapCursor');
        expect(editor.state.selection.from).toBe(at + picture.nodeSize);

        // To the left, the end of the paragraph above, where a caret can stand
        // already: a gap cursor there would be a second way of saying it.
        clicked(20);

        expect(editor.state.selection.constructor.name).toBe('TextSelection');
        expect(editor.state.selection.from).toBe(at - 1);
    });

    it('makes a place after a picture nothing follows', async () => {
        const set = createFeatures([imageFeature()]);
        const mounted = await editorOf({ features: set, modelValue: 'un\n\n![](https://a.fr/a.png)' });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        let at = 0;

        editor.state.doc.forEach((node, offset) => {
            if (node.type.name === 'image') {
                at = offset;
            }
        });

        editor.commands.setNodeSelection(at);
        editor.view.someProp('handleKeyDown', (handle) =>
            handle(editor.view, new KeyboardEvent('keydown', { key: 'Enter' }))
        );
        await nextTick();

        expect(editor.getJSON().content.map((block) => block.type)).toEqual(['paragraph', 'image', 'paragraph']);

        // And the note is not dirtied: a line nobody has written in yet is not
        // a change, so nothing is even said to have changed.
        expect(mounted.emitted('update:modelValue')).toBeUndefined();
    });
});

describe('a picture dragged over the page', () => {
    /** A drag carrying files of these kinds, as a browser describes one. */
    const carrying = (...kinds) =>
        Object.assign(new Event('dragenter'), {
            dataTransfer: { types: ['Files'], items: kinds.map((type) => ({ kind: 'file', type })) },
        });

    afterEach(() => window.dispatchEvent(new Event('drop')));

    it('says the blocks would take it, so nothing else has to be guessed at', async () => {
        const mounted = await editorOf({ modelValue: 'du texte' });
        const body = mounted.get('[data-slot="editor-body"]');

        expect(body.attributes('data-offered')).toBeUndefined();

        window.dispatchEvent(carrying('image/png'));
        await nextTick();

        expect(mounted.get('[data-slot="editor-body"]').attributes('data-offered')).toBe('true');
    });

    it('says nothing of a file it would not take', async () => {
        const mounted = await editorOf({ modelValue: 'du texte' });

        window.dispatchEvent(carrying('application/pdf'));
        await nextTick();

        expect(mounted.get('[data-slot="editor-body"]').attributes('data-offered')).toBeUndefined();
    });
});

describe('the format bubble', () => {
    it('appears where its own editor has the focus and something selected', async () => {
        const first = await editorOf({ modelValue: 'du texte' });
        await editorOf({ modelValue: 'du texte' });
        const editor = first.findComponent({ name: 'EditorContent' }).props('editor');

        expect(inBody('[data-slot="editor-bubble"]') !== null).toBe(false);

        first.find('.ProseMirror').element.focus();
        editor.commands.selectAll();
        await nextTick();

        // One on the page, and it belongs to the editor that has the focus.
        expect(allInBody('[data-slot="editor-bubble"]')).toHaveLength(1);
    });

    it('stands down over a whole block taken as one', async () => {
        const set = createFeatures([imageFeature()]);
        const mounted = await editorOf({ features: set, modelValue: '' });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        mounted.find('.ProseMirror').element.focus();
        editor.commands.setContent('<p>du texte</p><img data-src="attachment:15">');
        editor.commands.setNodeSelection(editor.state.doc.content.size - 1);
        await nextTick();

        // A picture is not something to put in bold, and clicking one opens it.
        expect(inBody('[data-slot="editor-bubble"]') !== null).toBe(false);
    });
});

describe('resetWhenEmpty', () => {
    it('takes a field emptied of its words back to a paragraph', async () => {
        const mounted = await editorOf({ modelValue: '# titre', resetWhenEmpty: true });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        editor.commands.selectAll();
        editor.commands.deleteSelection();
        await nextTick();

        expect(editor.getJSON().content[0].type).toBe('paragraph');
    });

    it('leaves a heading emptied of its words as the heading it is', async () => {
        const mounted = await editorOf({ modelValue: '# titre\n\ndu texte' });
        const editor = mounted.findComponent({ name: 'EditorContent' }).props('editor');

        // The words of the heading, not the whole document: emptying a document
        // is what ProseMirror answers with a paragraph, whatever we do. Read
        // from the node rather than counted by hand, or the endpoints land
        // outside anything holding inline content.
        const heading = editor.state.doc.firstChild;

        editor.commands.setTextSelection({ from: 1, to: heading.nodeSize - 1 });
        editor.commands.deleteSelection();
        await nextTick();

        expect(editor.getJSON().content[0].type).toBe('heading');
    });
});
