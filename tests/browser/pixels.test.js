import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createFetcher } from 'vue-fastedgy';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import DocumentEditor from '../../components/DocumentEditor.vue';
import DocumentViewer from '../../components/DocumentViewer.vue';
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

/** Forty pixels by twenty, in two colours, so a picture drawn wrong shows. */
const PICTURE = (() => {
    const canvas = document.createElement('canvas');

    canvas.width = 40;
    canvas.height = 20;

    const pen = canvas.getContext('2d');

    pen.fillStyle = '#c0392b';
    pen.fillRect(0, 0, 20, 20);
    pen.fillStyle = '#2980b9';
    pen.fillRect(20, 0, 20, 20);

    return canvas.toDataURL('image/png');
})();

const CASES = {
    headings: '# un\n\n## deux\n\n### trois',
    paragraphs:
        'un premier paragraphe\n\nun second, plus long, qui doit revenir à la ligne dans une colonne étroite comme celle-ci',
    marks: 'du **gras**, de l’_italique_, du `code`, ~~barré~~, __souligné__ et **tout _à la_ fois**',
    link: 'un [lien](https://example.com) dans le texte',
    'empty paragraphs': 'avant\n\n&nbsp;\n\n&nbsp;\n\naprès',
    'hard break': 'une ligne  \nla suivante',
    spaces: 'deux  espaces   et trois',
    'bulleted list': '* un\n* deux\n  * sous deux\n    * sous sous deux\n* trois',
    'numbered list': '1. premier\n2. second\n3. troisième',
    tasks: '- [ ] à faire\n- [x] fait\n- [ ] encore',
    quote: '> une citation qui tient sur une ligne',
    code: '```javascript\nconst a = 1;\nfunction b() {\n  return a;\n}\n```',
    'code without a language': '```\nplain text\n```',
    rule: 'avant\n\n---\n\naprès',
    table: '| A | B |\n| --- | --- |\n| un | deux |\n| trois | quatre |',
    picture: `avant\n\n![](${PICTURE}?w=320&h=160)\n\naprès`,
    mention: 'voir [Courses](/notes/12) ici',
    indented: 'parent\n\n    enfant',
    'indented table': '* une puce\n\n  | A | B |\n  | --- | --- |\n  | un | deux |',
};

/** Where every element of a document is drawn, from its own corner. */
function geometry(root) {
    const origin = root.getBoundingClientRect();

    return [root, ...root.querySelectorAll('*')].map((element) => {
        const box = element.getBoundingClientRect();

        return [
            element.tagName.toLowerCase(),
            Math.round((box.left - origin.left) * 100) / 100,
            Math.round((box.top - origin.top) * 100) / 100,
            Math.round(box.width * 100) / 100,
            Math.round(box.height * 100) / 100,
        ].join(' ');
    });
}

/**
 * Where two captures differ, pixel by pixel: the box holding every pixel that
 * is not the same, and how many there are. Null when not one differs.
 */
async function difference(first, second) {
    const read = async (base64) => {
        const image = new Image();

        image.src = `data:image/png;base64,${base64}`;
        await image.decode();

        const canvas = document.createElement('canvas');

        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0);

        return canvas.getContext('2d').getImageData(0, 0, image.width, image.height);
    };

    const [a, b] = await Promise.all([read(first), read(second)]);

    if (a.width !== b.width || a.height !== b.height) {
        return { size: [a.width, a.height, b.width, b.height] };
    }

    let count = 0;
    let left = Infinity;
    let top = Infinity;
    let right = -1;
    let bottom = -1;

    for (let at = 0; at < a.data.length; at += 4) {
        if (a.data[at] !== b.data[at] || a.data[at + 1] !== b.data[at + 1] || a.data[at + 2] !== b.data[at + 2]) {
            const x = (at / 4) % a.width;
            const y = Math.floor(at / 4 / a.width);

            count++;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }

    return count === 0 ? null : { count, box: [left, top, right - left + 1, bottom - top + 1] };
}

/** What only writing puts on a page, laid over it rather than out in it. */
const TOOLS = '[data-slot="editor-image-handle"], .ProseMirror-gapcursor, img.ProseMirror-separator';

async function settled() {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    // Loaded or refused, a picture has said what it will draw.
    await Promise.all(
        [...document.images].map((image) =>
            image.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                      image.addEventListener('load', resolve, { once: true });
                      image.addEventListener('error', resolve, { once: true });
                  })
        )
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

const content = (root) => root.querySelector('.ProseMirror');

/** What only writing puts on a page, and where each element of the rest is. */
const layoutOf = (root) => {
    const elements = [root, ...root.querySelectorAll('*')];

    return geometry(root).filter((_, at) => !elements[at].closest(TOOLS));
};

const drawnPicture = (image) => image.complete && image.naturalWidth > 0;

/**
 * One rendering, drawn alone, at the top left of the page, then taken away.
 *
 * Alone and at the same place for every rendering: a capture scrolls the page
 * to what it captures, and the same element drawn lower down is rasterised a
 * little differently, which is noise and not a difference between renderings.
 */
async function capture(component, props) {
    const holder = document.createElement('div');

    holder.style.cssText = 'position:absolute;left:0;top:0;width:560px;background:#fff';
    document.body.appendChild(holder);

    const wrapper = mount(component, {
        props,
        attachTo: holder,
        global: { plugins: [createPinia(), createFetcher()] },
    });

    mounted.push(wrapper);
    await settled();

    const root = wrapper.element;

    // A stored picture is fetched before it is drawn, and is compared drawn.
    await expect
        .poll(() => [...root.querySelectorAll('img:not(.ProseMirror-separator)')].every(drawnPicture))
        .toBe(true);
    const { width, height } = root.getBoundingClientRect();
    const blocks = content(root).getBoundingClientRect();
    const drawn = {
        layout: layoutOf(content(root)),
        size: [width, height],
        blocksAt: [blocks.left - root.getBoundingClientRect().left, blocks.top - root.getBoundingClientRect().top],
        pixels: await page.screenshot({ element: root, save: false }),
    };

    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    holder.remove();

    return drawn;
}

async function renderingsOf([Editor, Viewer], props, value) {
    return {
        written: await capture(Editor, { ...props, modelValue: value, editable: true }),
        locked: await capture(Editor, { ...props, modelValue: value, editable: false }),
        read: await capture(Viewer, { ...props, value }),
    };
}

/** @type {Array<{ name: string, components: any[], set: any }>} */
const RENDERINGS = [
    { name: 'field', components: [RichTextEditor, RichTextViewer], set: features },
    { name: 'page', components: [DocumentEditor, DocumentViewer], set: features },
    // What the core draws on its own, a code block and a task list included.
    { name: 'field with no feature', components: [RichTextEditor, RichTextViewer], set: createFeatures([]) },
];

for (const { name, components, set } of RENDERINGS) {
    describe(`a ${name}, written, locked and read`, () => {
        for (const [block, markdown] of Object.entries(CASES)) {
            it(`draws ${block} at the same pixels`, async () => {
                const { written, locked, read } = await renderingsOf(components, { features: set }, markdown);

                // Every element at the same place and the same size, and the
                // whole of it the same size too.
                expect(read.layout).toEqual(locked.layout);
                expect(read.layout).toEqual(written.layout);
                expect(read.size).toEqual(locked.size);
                expect(read.size).toEqual(written.size);

                // And nothing to set aside between a locked editor and a reader:
                // the very same pixels.
                expect(await difference(read.pixels, locked.pixels)).toBeNull();
            });
        }
    });
}

describe('a page and its cover, written, locked and read', () => {
    const pages = {
        'with a cover': { cover: 'covers/cover.png' },
        'without one, where one can be added': { pickFile: async () => null },
    };

    for (const [name, props] of Object.entries(pages)) {
        it(`draws a page ${name} at the same pixels`, async () => {
            const { pickFile, ...shared } = props;
            const [Editor, Viewer] = [DocumentEditor, DocumentViewer];
            const written = await capture(Editor, { features, modelValue: '# titre', ...shared, pickFile });
            const locked = await capture(Editor, { features, modelValue: '# titre', ...shared, editable: false });
            const read = await capture(Viewer, { features, value: '# titre', ...shared });

            expect([read.size, read.blocksAt]).toEqual([locked.size, locked.blocksAt]);
            expect([read.size, read.blocksAt]).toEqual([written.size, written.blocksAt]);
            expect(await difference(read.pixels, locked.pixels)).toBeNull();
        });
    }
});
