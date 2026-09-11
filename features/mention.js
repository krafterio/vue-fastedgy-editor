import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { h } from 'vue';

import MentionPreview from '../components/surfaces/MentionPreview.vue';
import MentionSuggestions from '../components/surfaces/MentionSuggestions.vue';
import { mentionSuggestion, suggestionState } from '../extensions/mention-suggestion.js';
import { RecordMention } from '../extensions/mention.js';

/**
 * What markdown would read as markup inside the text of a link.
 *
 * The backslash comes first, or escaping the rest would double back on it.
 */
const MARKUP = /[\\[\]@*_`<>~]/g;

/**
 * Mentions, written as the plain links they are stored as.
 *
 * Markdown has no inline object, and it should not: the field is read by the
 * agent and by everything else that touches it, and a link is something they all
 * understand. The chip is how a mention is *edited*, not how it is kept.
 *
 * A label is escaped rather than stripped, so a name comes back the name it was.
 * Without it, an email in a name, which is what a member with no name is called,
 * is pulled out as a `mailto:` of its own, and a bracket closes the link early
 * and takes the record with it.
 *
 * @param {object} [options]
 * @param {{ encode: (record: { model: string, id: number }) => string|null, decode: (address: string) => { model: string, id: number }|null }} [options.addressing]
 *   Where a mention points, in the shape the application routes. Mounted without
 *   one, mentions still draw and still write their label: nothing here decides
 *   what a path looks like.
 * @param {Array<{ trigger: string, model: string, search: (query: string) => Promise<Array<{ id: number, label: string, subtitle?: string, leading?: import('vue').Component }>>, preview?: (id: number) => Promise<{ title: string, subtitle?: string, leading?: import('vue').Component, facts?: Array<[string, string]> }|null>, openable?: boolean, onMention?: (candidate: object) => void }>} [options.sources]
 *   One per kind of mention: what arms it, what record it writes, and what it
 *   offers. A trigger with no source behind it is never armed, and `openable`
 *   is what puts the way there on the card of a record that has one. A `leading`
 *   is a **component**, never a built node: what draws a candidate is rendered
 *   where it is shown, and the same node cannot be in two places at once.
 * @param {(record: { model: string, id: number }) => void} [options.open]
 *   What a chip opens, a route on the web.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function mentionFeature(options = {}) {
    const addressing = options.addressing ?? null;

    // Highest priority first, ties keeping the order they were declared in, so
    // one more source slots in without renumbering the others.
    const sources = [...(options.sources ?? [])]
        .map((source, at) => ({ source, at }))
        .sort((a, b) => (b.source.priority ?? 0) - (a.source.priority ?? 0) || a.at - b.at)
        .map(({ source }) => source);

    const triggers = sources.map((source) => ({ source, ...mentionSuggestion(source) }));
    const isWriting = (editor) => triggers.some(({ key }) => suggestionState(editor, key) !== null);

    return {
        name: 'mention',
        extensions: [
            RecordMention,
            ...triggers.map(({ extension }) => extension),
            ...(triggers.length > 0 ? [queryGuard(isWriting)] : []),
        ],

        // A block is something the document holds and comes first; a mention
        // points at something outside it, and belongs under them however the
        // set was composed.
        menuGroup: 1,

        // One entry per source, each doing nothing but typing the trigger: the
        // list takes over from there, exactly as if it had been typed by hand.
        menuItems: sources.map((source) => ({
            name: source.model,
            glyph: source.glyph,
            keywords: [source.model, source.trigger],
            run: (editor) => editor.chain().focus().insertContent(source.trigger).run(),
        })),

        surfaces: [(editor) => h(MentionSuggestions, { editor, triggers })],

        // A tap shows the card, written or read alike.
        readingSurfaces: [
            (text, labels) =>
                h(MentionPreview, {
                    text,
                    sources,
                    open: options.open ?? null,
                    labels: { ...labels, ...options.labels },
                }),
        ],

        // Enter belongs to the list while it is open, or a field that sends on
        // Enter sends the message somebody was addressing.
        holdsEnter: (state) => isWriting(state?.editor),

        markdown: {
            before: (doc) => mentionsAsLinks(doc, addressing),
            after: (blocks) => linksAsMentions(blocks, addressing),
        },
    };
}

/**
 * Paths written and read the one way, from the table an application declares.
 *
 * A URI carrying a scheme is refused, an address being a route inside this
 * application and not somewhere else, and the identifier is the last segment.
 *
 * @param {Record<string, string>} paths - By model, `/notes/{id}` shaped
 * @returns {{ encode: (record: { model: string, id: number }) => string|null, decode: (address: string) => { model: string, id: number }|null }}
 */
export function pathAddressing(paths) {
    const patterns = Object.entries(paths).map(([model, path]) => ({
        model,
        // `/notes/{id}` matches `/notes/123`, and nothing longer.
        pattern: new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).replace('\\{id\\}', '(\\d+)')}$`),
    }));

    return {
        encode: ({ model, id }) => paths[model]?.replace('{id}', String(id)) ?? null,

        decode(address) {
            if (typeof address !== 'string' || /^[a-z][\w+.-]*:/i.test(address)) {
                return null;
            }

            for (const { model, pattern } of patterns) {
                const found = pattern.exec(address);

                if (found) {
                    return { model, id: Number(found[1]) };
                }
            }

            return null;
        },
    };
}

/**
 * Every mention turned into the link it is written as.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {object|null} addressing
 * @returns {object}
 */
export function mentionsAsLinks(doc, addressing) {
    return mapContent(doc, (node) => {
        if (node.type !== 'mention') {
            return node;
        }

        const label = escaped((node.attrs?.label ?? '').trim());
        const href = addressing?.encode({ model: node.attrs?.model, id: node.attrs?.id }) ?? null;

        return href === null
            ? { type: 'text', text: label }
            : { type: 'text', text: label, marks: [{ type: 'link', attrs: { href } }] };
    });
}

/**
 * Every link that points at a record turned back into the mention it was.
 *
 * The mirror of {@link mentionsAsLinks}, and the reason a mention survives a
 * round trip at all. A link to anywhere else stays a link.
 *
 * @param {object[]} blocks
 * @param {object|null} addressing
 * @returns {object[]}
 */
export function linksAsMentions(blocks, addressing) {
    if (!addressing) {
        return blocks;
    }

    return blocks.map((block) =>
        mapContent(block, (node) => {
            if (node.type !== 'text') {
                return node;
            }

            const href = (node.marks ?? []).find((mark) => mark.type === 'link')?.attrs?.href;
            const record = href === undefined ? null : addressing.decode(href);

            return record === null ? node : { type: 'mention', attrs: { ...record, label: node.text ?? '' } };
        })
    );
}

/**
 * Keeps the editor's own typing out of a query being written.
 *
 * A query is ordinary text sitting in the block, and the editor reads that text
 * as markdown as it is typed: a pair of asterisks inside a name would turn it
 * bold, and what the trigger was armed on is gone. While a hunt is on, every
 * rule declines and the character simply lands in the text, which is all a query
 * ever is.
 */
function queryGuard(isWriting) {
    return Extension.create({
        name: 'mentionQueryGuard',

        // Ahead of the input rules, which is the whole point.
        priority: 1000,

        addProseMirrorPlugins() {
            const editor = this.editor;

            return [
                new Plugin({
                    props: {
                        handleTextInput(view, from, to, text) {
                            if (!isWriting(editor)) {
                                return false;
                            }

                            view.dispatch(view.state.tr.insertText(text, from, to));

                            return true;
                        },
                    },
                }),
            ];
        },
    });
}

function escaped(label) {
    return label.replace(MARKUP, (character) => `\\${character}`);
}

/** [map] over every inline node of [node], however deep it sits. */
function mapContent(node, map) {
    if (!node || !Array.isArray(node.content)) {
        return node;
    }

    return {
        ...node,
        content: node.content.map((child) => (Array.isArray(child.content) ? mapContent(child, map) : map(child))),
    };
}
