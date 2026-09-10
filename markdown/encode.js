import { escapeOffsets, escapedAt, unescaped } from './escape.js';
import { spaceOutsideMarks } from './marks.js';
import { joinChunks } from './nesting.js';

/**
 * Markdown has no empty paragraph: a blank line only separates blocks, so an
 * intentionally empty one is written as a non-breaking space and read back from
 * it.
 */
export const BLANK_PARAGRAPH = '&nbsp;';

/** The containers a flat document only ever holds items in. */
const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList']);

/**
 * The blocks of a document in the order they are written, each with the depth it
 * sits at.
 *
 * A list container is not a block: markdown writes its items, one chunk each,
 * and the container is rebuilt on the way back in. Its items carry the indent,
 * it carries none.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {Array<{ node: object, indent: number, number: number|null }>}
 */
export function flatten(doc) {
    const blocks = [];

    for (const node of doc?.content ?? []) {
        if (!LIST_TYPES.has(node.type)) {
            blocks.push({ node, indent: node.attrs?.indent ?? 0, number: null });

            continue;
        }

        const start = node.type === 'orderedList' ? (node.attrs?.start ?? 1) : null;

        (node.content ?? []).forEach((item, at) => {
            blocks.push({
                node: item,
                indent: item.attrs?.indent ?? node.attrs?.indent ?? 0,
                number: start === null ? null : start + at,
            });
        });
    }

    return blocks;
}

/** The blocks that hold words, and are therefore blank when they hold none. */
const HOLDS_TEXT = new Set(['paragraph', 'heading', 'blockquote', 'listItem', 'taskItem', 'codeBlock']);

/**
 * Whether [doc] is what a cleared field holds: nothing said, and no blank line
 * deliberately left standing.
 *
 * A block that holds words and holds none is blank whatever kind of block it is,
 * a heading emptied of its words being as empty as the paragraph it was. A block
 * with no words to hold is content: a picture says something, and a field that
 * holds one alone is not a field somebody cleared.
 *
 * @param {object} doc
 * @returns {boolean}
 */
export function isCleared(doc) {
    const blocks = flatten(doc);

    return (
        blocks.length === 0 ||
        (blocks.length === 1 && HOLDS_TEXT.has(blocks[0].node.type) && saysNothing(blocks[0].node))
    );
}

/**
 * Whether [node] holds nothing said.
 *
 * An inline node is something said whatever it is: a mention is a word, and a
 * field holding one alone is not a field somebody cleared. Only text can be
 * empty.
 */
function saysNothing(node) {
    const content = node?.content ?? [];

    return content.every((child) => {
        if (child.type === 'text') {
            return (child.text ?? '').length === 0;
        }

        return Array.isArray(child.content) ? saysNothing(child) : false;
    });
}

/**
 * The words a block holds, marks and structure left aside.
 *
 * @param {object} node
 * @returns {string}
 */
export function plainText(node) {
    if (node?.type === 'text') {
        return node.text ?? '';
    }

    return (node?.content ?? []).map(plainText).join('');
}

/**
 * One run of text with the markers its marks are written with.
 *
 * The order of nesting is fixed and it is this one, mirrored on the way out:
 * emphasis inside strike inside underline inside code inside link.
 */
function encodeRun(run) {
    const marks = new Map((run.marks ?? []).map((mark) => [mark.type, mark]));
    const bold = marks.has('bold');
    const italic = marks.has('italic');
    const emphasis = bold && italic ? '***' : bold ? '**' : italic ? '_' : '';
    const href = marks.get('link')?.attrs?.href;

    let prefix = emphasis;
    let suffix = '';

    if (marks.has('strike')) {
        prefix += '~~';
    }

    if (marks.has('underline')) {
        prefix += '<u>';
    }

    if (marks.has('code')) {
        prefix += '`';
    }

    if (href) {
        prefix += '[';
        suffix += `](${href})`;
    }

    if (marks.has('code')) {
        suffix += '`';
    }

    if (marks.has('underline')) {
        suffix += '</u>';
    }

    if (marks.has('strike')) {
        suffix += '~~';
    }

    return `${prefix}${run.text ?? ''}${suffix}${emphasis}`;
}

/**
 * The inline content of a block, written out.
 *
 * @param {object} node
 * @returns {string}
 */
export function encodeInline(node) {
    return (node?.content ?? [])
        .map((run) => {
            if (run.type === 'text') {
                return encodeRun(run);
            }

            // A line somebody broke inside a block, which only a table cell can
            // carry into markdown, and writes it its own way there.
            return run.type === 'hardBreak' ? '\n' : '';
        })
        .join('');
}

/** The paragraph an item holds, an item never holding more than one. */
function itemBody(node) {
    return encodeInline((node.content ?? [])[0] ?? node);
}

/**
 * One block written out, the features first, the standard blocks after.
 *
 * @param {object} node
 * @param {{ number?: number|null, features?: object }} [context]
 * @returns {string}
 */
export function encodeBlock(node, context = {}) {
    const own = context.features?.encoders?.[node.type];

    if (own) {
        return own(node, context);
    }

    switch (node.type) {
        case 'paragraph': {
            const body = encodeInline(node);

            return body.length === 0 ? BLANK_PARAGRAPH : body;
        }

        case 'heading':
            return `${'#'.repeat(Math.min(Math.max(node.attrs?.level ?? 1, 1), 6))} ${encodeInline(node)}`;

        case 'blockquote':
            return `> ${encodeInline((node.content ?? [])[0] ?? node)}`;

        case 'horizontalRule':
            return '---';

        case 'codeBlock':
            return `\`\`\`${node.attrs?.language ?? ''}\n${plainText(node)}\n\`\`\``;

        case 'listItem':
            return context.number === null || context.number === undefined
                ? `* ${itemBody(node)}`
                : `${context.number}. ${itemBody(node)}`;

        case 'taskItem':
            return `${node.attrs?.checked ? '- [x]' : '- [ ]'} ${itemBody(node)}`;

        default:
            return '';
    }
}

/**
 * Whether [markdown] read back is the block it was written from: one block, the
 * same kind, the same shape, and the same words.
 *
 * The words as markdown leaves them, which is why the source is unescaped before
 * the two are compared: a feature stores what it must escape already escaped, a
 * mention's label carrying an `@` or a bracket, and the reader hands those back
 * as the characters they stand for. Comparing the two literally would call every
 * one of them a block gone wrong.
 *
 * What it does catch is a marker eaten: `> # x` comes back one quote, of the
 * same shape, having quietly lost the dash on the way.
 */
function readsBack(node, markdown, decodeChunk) {
    const read = decodeChunk(markdown);

    if (read.length !== 1 || read[0].type !== node.type) {
        return false;
    }

    if ((read[0].attrs?.level ?? null) !== (node.attrs?.level ?? null)) {
        return false;
    }

    return plainText(read[0]) === unescaped(plainText(node));
}

/**
 * One block written the way it will be read back.
 *
 * Markdown gives certain characters a meaning at the head of a line, and a
 * paragraph somebody opened with `#` is written `\#` for it: without the
 * backslash the words come back a heading the next time the document is opened,
 * having been a paragraph on the screen the whole time it was written. The same
 * goes for `-`, `>`, `1.`, a fence, a table row.
 *
 * Which characters those are is never listed anywhere, and deliberately: the
 * block is written, read back and compared to itself. What survives is stored as
 * it stands, what does not is escaped until it does. A syntax a feature teaches
 * the decoder is therefore covered the day it is taught, including one nothing
 * here has ever heard of.
 */
function written(node, context, decodeChunk) {
    const markdown = encodeBlock(node, context);
    const candidates = escapeOffsets(plainText(node));

    // Nothing a backslash could go in front of is nothing that can be done about
    // it, whatever reading it back would say, and reading every block back to
    // find that out is not free.
    if (candidates.length === 0 || readsBack(node, markdown, decodeChunk)) {
        return markdown;
    }

    for (const offsets of candidates) {
        const escaped = escapedAt(node, offsets);

        if (escaped === null) {
            continue;
        }

        const candidate = encodeBlock(escaped, context);

        if (readsBack(node, candidate, decodeChunk)) {
            return candidate;
        }
    }

    // Nothing that could be escaped brought it back whole. Storing it as it
    // stands is what happened before any of this, and reads at least right.
    return markdown;
}

/**
 * A document written to markdown.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {{ features?: object, decodeChunk: (markdown: string) => object[] }} options
 * @returns {string}
 */
export function encodeDocument(doc, { features, decodeChunk }) {
    if (isCleared(doc)) {
        return '';
    }

    const shaped = features?.before ? features.before(spaceOutsideMarks(doc)) : spaceOutsideMarks(doc);

    return joinChunks(
        flatten(shaped).map(({ node, indent, number }) => ({
            markdown: written(node, { number, features }, decodeChunk),
            indent,
        }))
    );
}
