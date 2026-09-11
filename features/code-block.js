import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import hljs from 'highlight.js/lib/core';
import { createLowlight } from 'lowlight';
import { shallowRef } from 'vue';

import CodeBlockView from '../components/blocks/CodeBlockView.vue';
import { extendedOnce } from '../extensions/extend.js';
import { withoutAuthoring } from '../extensions/schema.js';

/**
 * The languages a code block is coloured in unless the application says which,
 * by name: those a note most often holds (cf `code-languages.js`).
 */
const DEFAULT_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'dart',
    'json',
    'xml',
    'yaml',
    'ini',
    'markdown',
    'swift',
    'java',
    'kotlin',
];

/** What tells an editor its code blocks are to be coloured again. */
const RECOLOURED = 'codeBlockRecoloured';

/**
 * The default languages, loaded once for the whole application: a block drawn
 * on the next screen, by features built again for it, is coloured at once.
 */
let defaults = null;
let loadingDefaults = null;

function loadDefaults() {
    loadingDefaults ??= import('./code-languages.js').then((module) => (defaults = module.languages));

    return loadingDefaults;
}

/**
 * Fenced code, highlighted by tiptap's own `CodeBlockLowlight`.
 *
 * The fence itself is written and read by the core codec, and the core holds
 * the node; what this adds is the colours, the block drawn with its language
 * picker, and the ways to write one.
 *
 * The languages it colours are those `languages` gives, what `lowlight` takes:
 * `{ javascript, python }` from `highlight.js/lib/languages/*`, or `all` from
 * `lowlight` for every one there is, and nothing else is bundled. Given none,
 * a dozen a note most often holds, loaded the first time a block is drawn: a
 * block drawn before they arrive is drawn plain, and coloured the moment they
 * do, written or read. `features.ready()` is settled once they are there.
 *
 * What a block names and is not among them is guessed, as a block that names
 * nothing is, among those languages or among `guess` where it says otherwise:
 * highlight.js guessing among all it knows is wrong more often than right.
 *
 * `vue` is highlighted as `xml` where no grammar of that name was given:
 * highlight.js has none, and the value a document carries is not something to
 * rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, languages?: Record<string, any>, guess?: string[], labels?: object }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. An application that writes none can leave the feature
 *   out instead: the core still reads a block, drawn plain, and nothing of the
 *   highlighter is loaded.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options = {}) {
    const registry = createLowlight();
    const grammars = {};

    // Read while a block is coloured, bumped when grammars arrive: whatever drew
    // without them draws again, a reader through what it computed, an editor
    // through what it is told.
    const revision = shallowRef(0);
    const editors = new Set();
    let loading = null;

    const take = (given) => {
        registry.register(given);
        Object.assign(grammars, given);

        if (registry.registered('xml') && !registry.registered('vue')) {
            registry.registerAlias('xml', 'vue');
        }
    };

    // Given, or already loaded by features built before these: there at once.
    const at = options.languages ?? defaults;

    if (at) {
        take(at);
    }

    /** Settled once the languages are there: at once where they were given or loaded, once loaded otherwise. */
    const ready = () => {
        loading ??= at
            ? Promise.resolve()
            : loadDefaults()
                  .then((languages) => {
                      take(languages);
                      revision.value++;
                      editors.forEach((tell) => tell());
                  })
                  .catch((failure) => console.warn('The languages of the code blocks could not be loaded.', failure));

        return loading;
    };

    /** Asked for by whatever colours a block: the languages are loaded then, and it draws again once they are. */
    const asked = () => {
        void ready();
        void revision.value;
    };

    // Guessed among few, whatever is offered: among every grammar highlight.js
    // knows, a Python function reads as Lua and Dart as a properties file.
    const guessed = options.guess ?? (options.languages ? Object.keys(options.languages) : DEFAULT_LANGUAGES);

    // The one registry both the colours and the label read, so they agree.
    const lowlight = {
        highlight: (...said) => (asked(), registry.highlight(...said)),
        highlightAuto: (value, said = {}) => (asked(), registry.highlightAuto(value, { subset: guessed, ...said })),
        listLanguages: () => (asked(), registry.listLanguages()),
        registered: (name) => (asked(), registry.registered(name)),
        register: (...said) => registry.register(...said),
        registerAlias: (...said) => registry.registerAlias(...said),
    };

    const named = namesOf(grammars);

    const base = extendedOnce(CodeBlockLowlight, {
        addOptions() {
            return {
                ...this.parent?.(),
                labels: options.labels ?? {},

                /** What the picker offers, `{ value, label }`, by the name of each grammar. */
                languages: () => (asked(), named(revision.value)),

                /** What highlight.js makes of a block that names no language it knows. */
                detect: (text) => (text ? (lowlight.highlightAuto(text).data?.language ?? null) : null),
            };
        },

        addProseMirrorPlugins() {
            return (this.parent?.() ?? []).map((plugin) =>
                plugin.key.startsWith('lowlight') ? recolouredWhenTold(plugin, editors) : plugin
            );
        },
    }).configure({ lowlight, defaultLanguage: null });

    return {
        name: 'codeBlock',

        // Drawn by the same component whether it is written or read.
        views: { codeBlock: CodeBlockView },

        // Read with its colours; the ways to write one come with the editor.
        extensions: [withoutAuthoring(base)],

        ready,

        editing: () =>
            import('./editing/code-block.js').then((module) =>
                module.codeBlockEditing(base, { offered: options.offered !== false })
            ),
    };
}

/**
 * tiptap's colouring, which colours a block again when the block changes, told
 * also to colour every block again once the languages arrive: a block drawn
 * before them would otherwise stay plain until somebody typed in it.
 *
 * @param {Plugin} plugin - tiptap's own, `LowlightPlugin`
 * @param {Set<() => void>} editors - Where an editor leaves the way to tell it
 */
function recolouredWhenTold(plugin, editors) {
    const { init, apply } = plugin.spec.state;

    const recoloured = new Plugin({
        key: new PluginKey('lowlightRecoloured'),

        state: {
            init,
            apply: (transaction, set, before, after) =>
                transaction.getMeta(RECOLOURED) ? init(undefined, after) : apply(transaction, set, before, after),
        },

        props: { decorations: (state) => recoloured.getState(state) },

        view(view) {
            const tell = () => view.dispatch(view.state.tr.setMeta(RECOLOURED, true));

            editors.add(tell);

            return { destroy: () => editors.delete(tell) };
        },
    });

    return recoloured;
}

/**
 * The languages of [grammars], each by its own name, in the order of those names.
 *
 * Read once for each set of them, when a picker first asks: every grammar is a
 * function building its rules, and `all` holds close to two hundred of them.
 */
function namesOf(grammars) {
    let named = null;
    let at = null;

    return (revision) => {
        if (at !== revision) {
            at = revision;
            named = Object.entries(grammars)
                .map(([value, grammar]) => ({ value, label: grammar(hljs)?.name ?? value }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        return named;
    };
}
