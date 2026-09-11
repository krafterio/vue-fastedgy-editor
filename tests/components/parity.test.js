import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import RichTextEditor from '../../components/RichTextEditor.vue';
import RichTextViewer from '../../components/RichTextViewer.vue';
import { codeBlockFeature } from '../../features/code-block.js';
import { imageFeature } from '../../features/image.js';
import { linkFeature } from '../../features/link.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { plusUnderlineFeature } from '../../features/plus-underline.js';
import { createFeatures } from '../../features/registry.js';
import { tableFeature } from '../../features/table.js';
import { todoListFeature } from '../../features/todo-list.js';
import { built } from '../built.js';
import { decoratingFeature } from '../fixtures/decorating.js';

const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

const features = createFeatures([
    todoListFeature(),
    codeBlockFeature(),
    tableFeature(),
    imageFeature(),
    linkFeature(),
    mentionFeature({ addressing: pathAddressing({ note: '/notes/{id}' }) }),
    plusUnderlineFeature(),
]);

/** One pixel, so no picture is ever asked of a server. */
const PICTURE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

/**
 * What only an editor carries: what makes it editable, what says where the caret
 * is, and the hints drawn on an empty line. None of it is laid out; everything
 * else has to be the same, element for element.
 */
const EDITING_ONLY = [
    'contenteditable',
    'draggable',
    'translate',
    'tabindex',
    'role',
    'spellcheck',
    'data-placeholder',
    // A box read is a box nobody can tick; the stylesheet draws it the same.
    'disabled',
];
const EDITING_CLASSES = ['is-empty', 'is-editor-empty', 'ProseMirror-selectednode', 'has-focus'];

/**
 * The markup a reader sees, with what only writing puts there set aside.
 *
 * Strict, only what ProseMirror writes on the element it edits is set aside:
 * against an editor nobody can write in, nothing else may differ.
 */
function drawn(root, { strict = false } = {}) {
    const copy = root.cloneNode(true);

    // ProseMirror's own devices, the handle a picture is resized by and the
    // picker a code block's language is chosen with: tools for writing, laid
    // over the page or beside what it holds, never moving it.
    copy.querySelectorAll(
        strict
            ? 'img.ProseMirror-separator, .ProseMirror-gapcursor'
            : 'img.ProseMirror-separator, .ProseMirror-gapcursor, [data-slot="editor-image-handle"], [data-slot="editor-picker"]'
    ).forEach((tool) => tool.remove());

    // A template's comments, which Vue keeps while developing and a browser
    // never draws.
    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_COMMENT);
    const comments = [];

    while (walker.nextNode()) {
        comments.push(walker.currentNode);
    }

    comments.forEach((comment) => comment.remove());

    // ProseMirror marks the node views it can drag, even where nothing is
    // written, and a page one only reads must not hand its pictures to a drag.
    copy.querySelectorAll('[data-node-view-wrapper][draggable="true"]').forEach((view) =>
        view.removeAttribute('draggable')
    );

    for (const element of strict ? [copy] : [copy, ...copy.querySelectorAll('*')]) {
        for (const name of element.getAttributeNames()) {
            if (EDITING_ONLY.includes(name) || name.startsWith('aria-')) {
                element.removeAttribute(name);
            }
        }

        element.classList.remove(...EDITING_CLASSES);

        if (element.getAttribute('class') === '') {
            element.removeAttribute('class');
        }
    }

    return copy.innerHTML;
}

async function bothOf(markdown, { editable = true, strict = false, set = features } = {}) {
    const editor = mount(RichTextEditor, {
        props: { features: set, modelValue: markdown, editable },
        attachTo: document.body,
    });
    const viewer = mount(RichTextViewer, { props: { features: set, value: markdown }, attachTo: document.body });

    mounted.push(editor, viewer);

    // A code block's colours arrive after the block: compared once they have.
    await set.ready();
    await built(editor);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    return {
        written: drawn(editor.get('.ProseMirror').element, { strict }),
        read: drawn(viewer.get('.ProseMirror').element, { strict }),
        editor,
        viewer,
    };
}

const cases = {
    headings: '# un\n\n## deux\n\n### trois',
    marks: 'du **gras**, de l’_italique_, du `code`, ~~barré~~, __souligné__ et **tout _à la_ fois**',
    link: 'un [lien](https://example.com) dans le texte',
    'an empty paragraph': 'avant\n\n&nbsp;\n\naprès',
    'a hard break': 'une ligne  \nla suivante',
    'spaces kept': 'deux  espaces',
    lists: '* un\n* deux\n  * sous deux\n\n1. premier\n2. second',
    tasks: '- [ ] à faire\n- [x] fait',
    quote: '> une citation',
    code: '```javascript\nconst a = 1;\n```',
    'code without a language': '```\nplain\n```',
    rule: 'avant\n\n---\n\naprès',
    table: '| A | B |\n| --- | --- |\n| un | deux |',
    picture: `![](${PICTURE}?w=320&h=200)`,
    mention: 'voir [Courses](/notes/12)',
    indented: 'parent\n\n    enfant',
};

describe('a document read and the same document written', () => {
    for (const [name, markdown] of Object.entries(cases)) {
        it(`draws ${name} element for element`, async () => {
            const { written, read } = await bothOf(markdown);

            expect(read).toBe(written);
        });

        // Against an editor nobody can write in, there is no tool to set aside:
        // the viewer is that editor, less the editor.
        it(`draws ${name} as an editor locked for reading does`, async () => {
            const { written, read } = await bothOf(markdown, { editable: false, strict: true });

            expect(read).toBe(written);
        });
    }

    it('opens what the codec reads on its own, with no feature at all', async () => {
        // Given a node its schema did not hold, an editor opened the whole
        // document empty: the core holds everything the core codec reads.
        const bare = createFeatures([]);
        const markdown = 'avant\n\n```js\nconst a = 1;\n```\n\n- [ ] à faire\n- [x] fait\n\naprès';
        const editor = mount(RichTextEditor, {
            props: { features: bare, modelValue: markdown },
            attachTo: document.body,
        });
        const viewer = mount(RichTextViewer, { props: { features: bare, value: markdown }, attachTo: document.body });

        mounted.push(editor, viewer);
        await built(editor);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextTick();

        const written = editor.get('.ProseMirror');

        expect(written.text()).toContain('const a = 1;');
        expect(written.text()).toContain('à faire');
        expect(written.text()).toContain('après');
        expect(drawn(viewer.get('.ProseMirror').element)).toBe(drawn(written.element));
    });

    it('shows the document read while the editor is built, and the editor in its place once it is', async () => {
        let release;
        const held = new Promise((resolve) => (release = resolve));
        const set = features.and([{ name: 'held', editing: () => held.then(() => ({})) }]);
        const markdown = '# titre\n\n* une puce';
        const editor = mount(RichTextEditor, {
            props: { features: set, modelValue: markdown },
            attachTo: document.body,
        });
        const viewer = mount(RichTextViewer, { props: { features: set, value: markdown }, attachTo: document.body });

        mounted.push(editor, viewer);
        await nextTick();

        expect(editor.find('[contenteditable]').exists()).toBe(false);
        expect(drawn(editor.get('.ProseMirror').element)).toBe(drawn(viewer.get('.ProseMirror').element));

        release();
        await built(editor);

        expect(editor.findAll('.ProseMirror')).toHaveLength(1);
        expect(drawn(editor.get('.ProseMirror').element)).toBe(drawn(viewer.get('.ProseMirror').element));
    });

    it('never loads what writing needs to read', async () => {
        let asked = 0;
        const set = features.and([{ name: 'counted', editing: () => (asked++, {}) }]);
        const viewer = mount(RichTextViewer, { props: { features: set, value: 'du texte' }, attachTo: document.body });

        mounted.push(viewer);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(asked).toBe(0);
    });

    it('mounts no editor to read with', async () => {
        const { viewer } = await bothOf('du texte');

        expect(viewer.find('.ProseMirror').attributes('contenteditable')).toBeUndefined();
        expect(viewer.findComponent({ name: 'EditorContent' }).exists()).toBe(false);
    });
});

describe('what a plugin lays over a document, read and written', () => {
    // Every kind of decoration, over every block: the viewer draws them as the
    // editor's view does, where no view is there to draw them.
    const decorated = features.and([decoratingFeature()]);

    for (const [name, markdown] of Object.entries(cases)) {
        it(`draws them over ${name} element for element`, async () => {
            const { written, read } = await bothOf(markdown, { set: decorated });

            expect(read).toBe(written);
        });

        it(`draws them over ${name} as an editor locked for reading does`, async () => {
            const { written, read } = await bothOf(markdown, { editable: false, strict: true, set: decorated });

            expect(read).toBe(written);
        });
    }

    it('draws them at all', async () => {
        const { read } = await bothOf('un paragraphe', { set: decorated });

        expect(read).toContain('class="between');
        expect(read).toContain('data-marked="yes"');
        expect(read).toContain('<mark class="over">');
        expect(read).toContain('★');
        expect(read).toContain('☆');
    });
});
