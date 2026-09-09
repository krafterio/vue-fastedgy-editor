/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { flatten } from '../markdown/encode.js';

/**
 * The block vocabulary the shared corpus is written in, which is no
 * implementation's own: a fixture that took a side would stop being an arbiter.
 */
const NEUTRAL_TYPES = {
    paragraph: 'paragraph',
    heading: 'heading',
    blockquote: 'quote',
    horizontalRule: 'divider',
    codeBlock: 'code',
    taskItem: 'todo',
    image: 'image',
    table: 'table',
};

/** Blocks that hold a paragraph rather than the words themselves. */
const WRAPS_A_PARAGRAPH = new Set(['listItem', 'taskItem', 'blockquote']);

/** Written out in this order on both sides, so two outlines compare literally. */
const MARK_ORDER = ['bold', 'italic', 'underline', 'strike', 'code'];

/**
 * A document as the corpus describes it: what each block is, how deep it sits,
 * what it says, and how what it says is marked.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object[]}
 */
export function outlineOf(doc) {
    return flatten(doc).map(({ node, indent, number }) => {
        const body = WRAPS_A_PARAGRAPH.has(node.type) ? (node.content ?? [])[0] : node;
        const type = node.type === 'listItem' ? (number === null ? 'bullet' : 'numbered') : NEUTRAL_TYPES[node.type];

        return {
            type: type ?? node.type,
            indent,
            attrs: {
                ...(node.attrs?.level != null ? { level: node.attrs.level } : {}),
                ...(node.attrs?.checked != null ? { checked: node.attrs.checked } : {}),
                ...(node.attrs?.language != null ? { language: node.attrs.language } : {}),
            },
            runs: (body?.content ?? [])
                .filter((run) => run.type === 'text')
                .map((run) => ({
                    t: run.text,
                    m: MARK_ORDER.filter((mark) => (run.marks ?? []).some((own) => own.type === mark)),
                    href: (run.marks ?? []).find((mark) => mark.type === 'link')?.attrs?.href ?? null,
                })),
        };
    });
}
