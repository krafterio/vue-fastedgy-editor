/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';

import { Indent } from './indent.js';

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
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function coreExtensions(options = {}) {
    return [
        Document,
        Text,
        Paragraph,
        Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
        Blockquote,
        HorizontalRule,
        BulletList,
        OrderedList,
        ListItem,
        Bold,
        Italic,
        Strike,
        Underline,
        Code,
        Link.configure({ openOnClick: false, autolink: false }),
        Dropcursor,
        Gapcursor,
        Indent,
        ...(options.history === false ? [] : [History]),
    ];
}
