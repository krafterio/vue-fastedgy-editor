import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';

/**
 * What arms a trigger, and nothing more.
 *
 * The plugin watches the text for `@` or `$` at a word boundary and says what
 * was typed after it; what is offered, and what happens when one is picked, is
 * the surface's (cf `components/surfaces/MentionSuggestions.vue`). Splitting it
 * this way is what lets the list be a Vue component of ours rather than a DOM
 * node a package builds.
 *
 * A trigger with no source behind it is never armed: a menu that opens on
 * nothing is worse than no menu.
 *
 * @param {{ trigger: string, model: string }} source
 * @returns {{ extension: any, key: PluginKey }}
 */
export function mentionSuggestion(source) {
    const key = new PluginKey(`fe-mention-${source.model}`);

    const extension = Extension.create({
        name: `mentionSuggestion:${source.model}`,

        addProseMirrorPlugins() {
            return [
                Suggestion({
                    editor: this.editor,
                    char: source.trigger,
                    pluginKey: key,
                    allowSpaces: false,
                    startOfLine: false,
                    items: () => [],
                    render: () => ({}),
                }),
            ];
        },
    });

    return { extension, key };
}

/**
 * What a trigger is showing right now in [editor], or `null`.
 *
 * @param {any} editor
 * @param {PluginKey} key
 * @returns {{ query: string, range: { from: number, to: number } }|null}
 */
export function suggestionState(editor, key) {
    const state = editor?.state ? key.getState(editor.state) : null;

    return state?.active ? { query: state.query ?? '', range: state.range } : null;
}
