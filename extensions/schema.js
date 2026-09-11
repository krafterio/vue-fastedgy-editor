import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';

import { extendedOnce } from './extend.js';
import { Indent } from './indent.js';
import { LinkMark } from './link.js';

/**
 * What a document is made of, declared name by name.
 *
 * No starter kit, and deliberately: it decides the schema in our place, carries
 * what we do not want, and leaves the inventory of node types unreadable. The
 * schema is the contract of the codec, so what is not listed here must not be
 * able to exist in a document.
 *
 * A list container is deliberately kept while nesting is an attribute: it is
 * what markdown has no word for, rebuilt on the way in from the items that sit
 * at the same depth.
 *
 * What only writing needs is not here but in `editingExtensions`: a reader reads
 * a document with these, and nothing else.
 *
 * @returns {any[]}
 */
export function coreExtensions() {
    return [
        Document,
        Text,
        Paragraph,
        Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
        Blockquote,
        HardBreak,
        HorizontalRule,
        BulletList,
        OrderedList,
        ListItem,
        /*
         * What the codec reads on its own, held so that no document it reads is
         * refused: given a node its schema does not know, an editor opens the
         * whole document empty. Read only here; the feature of each brings the
         * ways to write one, and how it looks.
         */
        withoutAuthoring(CodeBlock),
        withoutAuthoring(TaskList),
        withoutAuthoring(TaskItem.configure({ nested: false })),
        Bold,
        Italic,
        Strike,
        Underline,
        Code,
        // Read only here, as the blocks above: the link feature brings the ways
        // to write one.
        LinkMark,
        Indent,
    ];
}

/**
 * A node that can be read and not written: no rule turning what is typed into
 * one, no shortcut, nothing pasted becoming one, a code editor's clipboard
 * included. What draws it stays, its colours among them.
 *
 * @param {any} extension
 * @returns {any}
 */
export function withoutAuthoring(extension) {
    return extendedOnce(extension, {
        addInputRules: () => [],
        addPasteRules: () => [],
        addKeyboardShortcuts: () => ({}),
        addProseMirrorPlugins() {
            return (this.parent?.() ?? []).filter((plugin) => !plugin.props.handlePaste);
        },
    });
}

/**
 * What a rich text of [features] is made of, the one list the editor and the
 * viewer are both built from, a page's included.
 *
 * The core's nodes, less those a feature brings in their place. A feature says
 * each of these once, in the registry, and they reach the editor and the viewer
 * alike: the editor adds to them what only writing needs, the components the
 * features draw with mounted as node views among it (`richTextEditorExtensions`).
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {any[]}
 */
export function richTextExtensions(features) {
    const own = new Set(features.extensions.map((extension) => extension.name));

    return [...coreExtensions().filter((extension) => !own.has(extension.name)), ...features.extensions];
}
