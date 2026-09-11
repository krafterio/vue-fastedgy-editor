import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import History from '@tiptap/extension-history';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import { extendedOnce } from './extend.js';
import { GapStart } from './gap-start.js';
import { richTextExtensions } from './schema.js';

/**
 * What only writing needs: where a dragged block would land, the caret beside a
 * block that holds no text, and the undo history.
 *
 * Kept apart from what a document is made of, so a reader that never writes
 * never loads them: an application that only reads bundles none of this.
 *
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function editingExtensions(options = {}) {
    return [
        /*
         * The line drawn between two blocks.
         *
         * Dressed by a class of its own rather than by a colour written inline:
         * ProseMirror hangs the line on the editor's `offsetParent`, which is
         * somewhere in the application's layout and not under `.fe-editor`, so a
         * colour read from a variable of the theme resolves to nothing there and
         * the line comes out invisible.
         */
        Dropcursor.configure({ color: '', width: 2, class: 'fe-editor-drop-cursor' }),
        Gapcursor,
        GapStart,
        ...(options.history === false ? [] : [History]),
    ];
}

/**
 * What an editor of [features] is made of: the rich text the viewer reads, what
 * the features bring to write it with, each node a feature draws with a
 * component drawn by it as a node view, and what only writing needs.
 *
 * What a feature brings under the name of one of the document's own takes its
 * place, where it stood: a code block that can be typed is the one that could
 * only be read, and more.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @param {import('../features/registry.js').RichTextEditingSet} editing
 *   What the features bring to an editor, as `features.editing()` answers it
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function richTextEditorExtensions(features, editing, options = {}) {
    const views = features.views;
    const read = richTextExtensions(features);
    const written = new Map(editing.extensions.map((extension) => [extension.name, extension]));
    const readNames = new Set(read.map((extension) => extension.name));

    return [
        ...read.map((extension) => written.get(extension.name) ?? extension),
        ...[...written.values()].filter((extension) => !readNames.has(extension.name)),
    ]
        .map((extension) =>
            views[extension.name]
                ? extendedOnce(extension, { addNodeView: () => VueNodeViewRenderer(views[extension.name]) })
                : extension
        )
        .concat(editingExtensions(options));
}
