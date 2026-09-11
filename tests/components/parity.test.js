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

    // ProseMirror's own devices, and the handle a picture is resized by: tools
    // for writing, laid over the page rather than laid out in it.
    copy.querySelectorAll(
        strict
            ? 'img.ProseMirror-separator, .ProseMirror-gapcursor'
            : 'img.ProseMirror-separator, .ProseMirror-gapcursor, [data-slot="editor-image-handle"]'
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

async function bothOf(markdown, { editable = true, strict = false } = {}) {
    const editor = mount(RichTextEditor, {
        props: { features, modelValue: markdown, editable },
        attachTo: document.body,
    });
    const viewer = mount(RichTextViewer, { props: { features, value: markdown }, attachTo: document.body });

    mounted.push(editor, viewer);

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    return {
        written: drawn(editor.get('.ProseMirror').element, { strict }),
        read: drawn(viewer.get('.ProseMirror').element, { strict }),
        editor,
        viewer,
    };
}

describe('a document read and the same document written', () => {
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
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextTick();

        const written = editor.get('.ProseMirror');

        expect(written.text()).toContain('const a = 1;');
        expect(written.text()).toContain('à faire');
        expect(written.text()).toContain('après');
        expect(drawn(viewer.get('.ProseMirror').element)).toBe(drawn(written.element));
    });

    it('mounts no editor to read with', async () => {
        const { viewer } = await bothOf('du texte');

        expect(viewer.find('.ProseMirror').attributes('contenteditable')).toBeUndefined();
        expect(viewer.findComponent({ name: 'EditorContent' }).exists()).toBe(false);
    });
});
