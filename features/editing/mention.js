import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { h } from 'vue';

import MentionSuggestions from '../../components/surfaces/MentionSuggestions.vue';
import { mentionSuggestion, suggestionState } from '../../extensions/mention-suggestion.js';
import { RecordMention } from '../../extensions/record-mention.js';

/**
 * What writes a mention: tiptap's own node in place of the one the core reads,
 * a trigger per source and the list it opens, and the entries that type one.
 *
 * @param {object[]} sources - The feature's, highest priority first
 * @returns {import('../registry.js').RichTextEditing}
 */
export function mentionEditing(sources) {
    const triggers = sources.map((source) => ({ source, ...mentionSuggestion(source) }));
    const isWriting = (editor) => triggers.some(({ key }) => suggestionState(editor, key) !== null);

    return {
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

        // Enter belongs to the list while it is open, or a field that sends on
        // Enter sends the message somebody was addressing.
        holdsEnter: (state) => isWriting(state?.editor),
    };
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
