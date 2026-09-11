import { Extension } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import { Plugin } from '@tiptap/pm/state';
import { h } from 'vue';

import LinkPopover from '../../components/surfaces/LinkPopover.vue';

/**
 * What writes a link: tiptap's own mark in place of the one the core reads, the
 * card that edits one, and the gestures and the key that reach it.
 *
 * @param {{ labels?: object }} options - The feature's
 * @returns {import('../registry.js').RichTextEditing}
 */
export function linkEditing(options) {
    return {
        extensions: [Link.configure({ openOnClick: false, autolink: false }), LinkShortcut, LinkGestures],
        surfaces: [(editor, labels) => h(LinkPopover, { editor, labels: { ...labels, ...options.labels } })],
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
