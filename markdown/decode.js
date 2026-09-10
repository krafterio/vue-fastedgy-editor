import MarkdownIt from 'markdown-it';

import { splitChunks } from './nesting.js';

const NBSP = ' ';

/** Schemes a link is never allowed to carry, wherever the markdown came from. */
const DENIED_SCHEMES = /^\s*(javascript|data|vbscript):/i;

/**
 * The parser the decoder reads with.
 *
 * `html: false`, and deliberately: the dialect needs `<u>`, `<br>` in a table
 * cell and `&nbsp;`, and each of those gets a rule of its own. Turning raw HTML
 * on would open an XSS surface for nothing, on content written by another
 * client.
 *
 * @param {{ inlineRules?: Array<(md: MarkdownIt) => void> }} [options]
 * @returns {MarkdownIt}
 */
export function createParser(options = {}) {
    const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

    md.inline.ruler.before('autolink', 'underline_html', underlineHtml);

    for (const rule of options.inlineRules ?? []) {
        rule(md);
    }

    return md;
}

/** `<u>` and `</u>`, the way underline is written. */
function underlineHtml(state, silent) {
    const { src, pos } = state;

    if (src.charCodeAt(pos) !== 0x3c) {
        return false;
    }

    const open = src.startsWith('<u>', pos);

    if (!open && !src.startsWith('</u>', pos)) {
        return false;
    }

    if (!silent) {
        state.push(open ? 'u_open' : 'u_close', 'u', open ? 1 : -1);
    }

    state.pos += open ? 3 : 4;

    return true;
}

/**
 * A link's address, or null when it is one no document is allowed to carry.
 *
 * @param {string|null|undefined} href
 * @returns {string|null}
 */
export function safeHref(href) {
    return typeof href === 'string' && href.length > 0 && !DENIED_SCHEMES.test(href) ? href : null;
}

const MARK_OF = {
    strong_open: 'bold',
    em_open: 'italic',
    s_open: 'strike',
    u_open: 'underline',
};

const CLOSE_OF = {
    strong_close: 'bold',
    em_close: 'italic',
    s_close: 'strike',
    u_close: 'underline',
};

/**
 * The runs of one inline token, marks resolved.
 *
 * @param {object} token
 * @returns {object[]}
 */
export function inlineContent(token) {
    const content = [];
    const open = [];
    const push = (text, marks) => {
        if (text.length === 0) {
            return;
        }

        const last = content.at(-1);
        const same = last && JSON.stringify(last.marks ?? []) === JSON.stringify(marks);

        // ProseMirror merges neighbouring runs carrying the same marks, and the
        // encoder writes one pair of markers per run: two runs left apart would
        // be written `**a****b**`.
        if (same) {
            last.text += text;

            return;
        }

        content.push({ type: 'text', text, ...(marks.length > 0 ? { marks } : {}) });
    };

    for (const child of token.children ?? []) {
        const marks = open.map((mark) => ({ ...mark }));

        switch (child.type) {
            case 'text':
                push(child.content, marks);
                break;

            case 'code_inline':
                push(child.content, [...marks, { type: 'code' }]);
                break;

            case 'softbreak':
                push(' ', marks);
                break;

            case 'link_open': {
                const href = safeHref(child.attrGet('href'));

                open.push(href === null ? { type: 'ignored' } : { type: 'link', attrs: { href } });
                break;
            }

            case 'link_close':
                open.pop();
                break;

            default:
                if (MARK_OF[child.type]) {
                    open.push({ type: MARK_OF[child.type] });
                } else if (CLOSE_OF[child.type]) {
                    const at = open.findLastIndex((mark) => mark.type === CLOSE_OF[child.type]);

                    if (at >= 0) {
                        open.splice(at, 1);
                    }
                }
        }
    }

    return content.filter((run) => !(run.marks ?? []).some((mark) => mark.type === 'ignored'));
}

/** The paragraph a chunk holds, blank where markdown wrote it `&nbsp;`. */
function paragraphOf(token) {
    const content = token ? inlineContent(token) : [];
    const blank = content.length === 1 && content[0].text === NBSP;

    return { type: 'paragraph', ...(blank || content.length === 0 ? {} : { content }) };
}

const TASK = /^\[([ xX])\]\s+/;

/** A list item, turned into a task where markdown wrote it one. */
function itemOf(paragraph, number) {
    const first = paragraph.content?.[0];
    const marker = first?.type === 'text' ? TASK.exec(first.text) : null;

    if (!marker) {
        return { type: 'listItem', attrs: { number }, content: [paragraph] };
    }

    const content = [{ ...first, text: first.text.slice(marker[0].length) }, ...paragraph.content.slice(1)];

    return {
        type: 'taskItem',
        attrs: { checked: marker[1].toLowerCase() === 'x' },
        content: [{ type: 'paragraph', content }],
    };
}

/**
 * The blocks of one chunk, with nothing indented left in it.
 *
 * A list item comes back as the item alone, never wrapped: the container is what
 * {@link decodeDocument} rebuilds once it knows which items sit at the same
 * depth. It is also what the encoder compares its own output against, and it
 * writes one chunk per item.
 *
 * @param {string} markdown
 * @param {{ parser?: MarkdownIt, features?: object }} [options]
 * @returns {object[]}
 */
export function decodeChunk(markdown, options = {}) {
    const md = options.parser ?? createParser();
    const tokens = md.parse(markdown, {});
    const blocks = [];
    let number = null;

    for (let at = 0; at < tokens.length; at++) {
        const token = tokens[at];
        const inline = () => (tokens[at + 1]?.type === 'inline' ? tokens[at + 1] : null);
        const own = options.features?.decoders?.[token.type];
        const taken = own ? own(token, tokens, at) : null;

        // A feature reads the tokens it recognises and hands the rest back:
        // an image is a paragraph holding nothing else, and every other
        // paragraph is still the core's to read.
        if (taken) {
            blocks.push(...taken);

            continue;
        }

        switch (token.type) {
            case 'paragraph_open':
                // A paragraph inside a list item belongs to the item, which the
                // list branch has already taken.
                if (token.level === 0) {
                    blocks.push(paragraphOf(inline()));
                }
                break;

            case 'heading_open':
                blocks.push({
                    type: 'heading',
                    attrs: { level: Number(token.tag.slice(1)) },
                    content: inlineContent(inline() ?? { children: [] }),
                });
                break;

            case 'hr':
                blocks.push({ type: 'horizontalRule' });
                break;

            case 'fence':
            case 'code_block': {
                // An empty text node is not a node ProseMirror will hold, so a
                // fence holding nothing holds nothing.
                const written = token.content.replace(/\n$/, '');

                blocks.push({
                    type: 'codeBlock',
                    attrs: { language: token.info?.trim() || null },
                    ...(written.length > 0 ? { content: [{ type: 'text', text: written }] } : {}),
                });
                break;
            }

            case 'blockquote_open': {
                const body = tokens.slice(at).find((next) => next.type === 'inline');

                blocks.push({ type: 'blockquote', content: [paragraphOf(body)] });
                break;
            }

            case 'ordered_list_open':
                number = Number(token.attrGet('start') ?? 1);
                break;

            case 'bullet_list_open':
                number = null;
                break;

            case 'list_item_open': {
                const body = tokens.slice(at).find((next) => next.type === 'inline');

                blocks.push(itemOf(paragraphOf(body), number));

                if (number !== null) {
                    number++;
                }
                break;
            }
        }

        // Everything a block branch consumed is skipped by the loop reading past
        // its own opening token; the closing tokens carry nothing.
        if (token.type === 'blockquote_open' || token.type === 'list_item_open') {
            at = skipTo(tokens, at, token.type.replace('_open', '_close'));
        }
    }

    return blocks.map((block) => (block.content?.length === 0 ? { ...block, content: undefined } : block));
}

function skipTo(tokens, from, closing) {
    let depth = 0;

    for (let at = from; at < tokens.length; at++) {
        if (tokens[at].type === closing && depth === 1) {
            return at;
        }

        if (tokens[at].nesting === 1) {
            depth++;
        } else if (tokens[at].nesting === -1) {
            depth--;
        }
    }

    return tokens.length;
}

/** The blank document a cleared or unreadable field opens on. */
export function blankDocument() {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
}

/**
 * A markdown source read back into a document.
 *
 * Never returns a document without a block: the decoders drop what they cannot
 * read, and a document with no block renders as a dead zone, nothing to click,
 * nothing to type into, not even a placeholder.
 *
 * @param {string|null|undefined} source
 * @param {{ parser?: MarkdownIt, features?: object }} [options]
 * @returns {object}
 */
export function decodeDocument(source, options = {}) {
    if (typeof source !== 'string' || source.trim().length === 0) {
        return blankDocument();
    }

    const parser = options.parser ?? createParser();
    const blocks = [];

    for (const { markdown, indent } of splitChunks(source)) {
        for (const node of decodeChunk(markdown, { ...options, parser })) {
            blocks.push({ ...node, attrs: { ...node.attrs, indent } });
        }
    }

    const content = options.features?.after ? options.features.after(grouped(blocks)) : grouped(blocks);

    return content.length === 0 ? blankDocument() : { type: 'doc', content };
}

/**
 * Puts the list items back in the container markdown has no word for.
 *
 * Consecutive items of the same depth and the same kind belong together; a
 * change of either opens a new list, which is what an indented item is.
 */
function grouped(blocks) {
    const content = [];

    for (const block of blocks) {
        const kind = kindOf(block);

        if (kind === null) {
            content.push(block);

            continue;
        }

        const last = content.at(-1);
        const item = itemWithoutNumber(block);

        if (last && last.type === kind && (last.attrs?.indent ?? 0) === (block.attrs?.indent ?? 0)) {
            last.content.push(item);

            continue;
        }

        content.push({
            type: kind,
            attrs: {
                indent: block.attrs?.indent ?? 0,
                ...(kind === 'orderedList' ? { start: block.attrs?.number ?? 1 } : {}),
            },
            content: [item],
        });
    }

    return content;
}

function kindOf(block) {
    if (block.type === 'taskItem') {
        return 'taskList';
    }

    if (block.type !== 'listItem') {
        return null;
    }

    return block.attrs?.number === null || block.attrs?.number === undefined ? 'bulletList' : 'orderedList';
}

/** The number is the container's business once the container exists. */
function itemWithoutNumber(block) {
    const attrs = { ...block.attrs };

    delete attrs.number;

    return { ...block, attrs };
}
