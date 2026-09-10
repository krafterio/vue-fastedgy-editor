import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { h } from 'vue';

import LinkPopover from '../components/surfaces/LinkPopover.vue';

/**
 * Links, and the one thing markdown needs told about them.
 *
 * The mark itself belongs to the core schema, being one of the seven a run can
 * carry. What a feature owns is the round trip: a link whose address is its own
 * text is written bare.
 *
 * The card that edits one floats above the editor, and it is where an address
 * is filtered on the way in: a document is a place people paste into, and the
 * schemes that could run are refused there as they are on the way out.
 *
 * @param {{ labels?: { address?: string, title?: string, apply?: string, open?: string, unlink?: string } }} [options]
 * @returns {import('./registry.js').RichTextFeature}
 */
export function linkFeature(options = {}) {
    return {
        name: 'link',
        extensions: [LinkShortcut, LinkGestures],
        markdown: { before: withoutSelfLinks },
        surfaces: [(editor) => h(LinkPopover, { editor, labels: options.labels ?? {} })],

        actions: [
            {
                name: 'link',
                glyph: 'link',
                group: 4,
                isActive: (editor) => editor.isActive('link'),
                isEnabled: (editor) => !editor.state.selection.empty || editor.isActive('link'),
                run: (editor) => openLink(editor),
            },
        ],
    };
}

/**
 * What opens the card: an address of nothing on the words that were selected.
 *
 * The card shows itself on the link the caret sits in, so writing an empty one
 * is how a selection becomes something to edit. Nothing is stored until an
 * address is typed, the empty href being dropped on the way out.
 */
function openLink(editor) {
    if (editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').run();

        return true;
    }

    return editor.state.selection.empty ? false : editor.chain().focus().setLink({ href: '' }).run();
}

/**
 * What a click on a link does.
 *
 * Reading it opens it, and so does asking for it plainly with the modifier or a
 * second click. A single click while writing places the caret in the link, which
 * is what shows the card: opening a page under somebody who was editing a word
 * is not what they asked for.
 */
const LinkGestures = Extension.create({
    name: 'linkGestures',

    addProseMirrorPlugins() {
        const editor = this.editor;

        const opened = (event) => {
            const href = editor.getAttributes('link').href;

            if (!href || !isSafe(href)) {
                return false;
            }

            event.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');

            return true;
        };

        return [
            new Plugin({
                props: {
                    handleClick: (_view, _pos, event) =>
                        (!editor.isEditable || event.metaKey || event.ctrlKey) && opened(event),

                    handleDoubleClick: (_view, _pos, event) => opened(event),
                },
            }),
        ];
    },
});

/** The schemes a link is allowed to carry, wherever it was written. */
function isSafe(href) {
    return !/^\s*(javascript|data|vbscript):/i.test(href);
}

/** The one binding people expect on a link, on both platforms. */
const LinkShortcut = Extension.create({
    name: 'linkShortcut',

    addKeyboardShortcuts() {
        return { 'Mod-k': ({ editor }) => openLink(editor) };
    },
});

/**
 * Drops the href of a run that links to its own text, so it is written bare.
 *
 * `[https://example.com](https://example.com)` and `https://example.com` are
 * read back as the very same document, markdown autolinking a plain URL, so the
 * long form carries nothing but noise into a field people and agents read.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object}
 */
export function withoutSelfLinks(doc) {
    return strip(doc);
}

function strip(node) {
    if (!node || !Array.isArray(node.content)) {
        return node;
    }

    return {
        ...node,
        content: node.content.map((child) => (child.type === 'text' ? bare(child) : strip(child))),
    };
}

function bare(run) {
    const marks = run.marks ?? [];

    if (!marks.some((mark) => mark.type === 'link' && mark.attrs?.href === run.text)) {
        return run;
    }

    const kept = marks.filter((mark) => mark.type !== 'link');

    return { type: 'text', text: run.text, ...(kept.length > 0 ? { marks: kept } : {}) };
}
