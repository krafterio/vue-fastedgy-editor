import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import hljs from 'highlight.js/lib/core';
import { all, createLowlight } from 'lowlight';

import CodeBlockView from '../components/blocks/CodeBlockView.vue';
import { withoutAuthoring } from '../extensions/schema.js';

/**
 * What a block naming no language is guessed among. Each grammar answers for
 * its aliases too: json for jsonc, xml for html, ini for toml, markdown for md.
 */
const GUESSED = [
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

/**
 * Fenced code, highlighted by tiptap's own `CodeBlockLowlight`.
 *
 * The fence itself is written and read by the core codec, and the core holds
 * the node; what this adds is the colours, the block drawn with its language
 * picker, and the ways to write one.
 *
 * Every grammar highlight.js knows is offered unless the application keeps
 * fewer, `languages` taking what `lowlight` takes: `{ javascript, python }`
 * from `highlight.js/lib/languages/*`, or `common` from `lowlight`. What a block
 * names and is not among them is guessed, as a block that names nothing is.
 *
 * Guessed among few: the mobile side's languages, or those the application
 * kept, or `guess` where it says otherwise. highlight.js guessing among all it
 * knows is wrong more often than right.
 *
 * `vue` is highlighted as `xml` where no grammar of that name was given:
 * highlight.js has none, and the value a document carries is not something to
 * rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, languages?: Record<string, any>, guess?: string[], labels?: object }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. Dropping the feature instead would take the reading with
 *   it, and a document holding a fence would come back without it.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options = {}) {
    const grammars = options.languages ?? all;
    const registry = createLowlight(grammars);

    if (registry.registered('xml') && !registry.registered('vue')) {
        registry.registerAlias('xml', 'vue');
    }

    // Guessed among few, whatever is offered: among every grammar highlight.js
    // knows, a Python function reads as Lua and Dart as a properties file.
    const guessed = options.guess ?? (options.languages ? Object.keys(options.languages) : GUESSED);

    // The one registry both the colours and the label read, so they agree.
    const lowlight = {
        highlight: (...asked) => registry.highlight(...asked),
        highlightAuto: (value, asked = {}) => registry.highlightAuto(value, { subset: guessed, ...asked }),
        listLanguages: () => registry.listLanguages(),
        registered: (name) => registry.registered(name),
        register: (...asked) => registry.register(...asked),
        registerAlias: (...asked) => registry.registerAlias(...asked),
    };

    const extension = CodeBlockLowlight.extend({
        addOptions() {
            return {
                ...this.parent?.(),
                labels: options.labels ?? {},

                /** What the picker offers, `{ value, label }`, by the name of each grammar. */
                languages: namesOf(grammars),

                /** What highlight.js makes of a block that names no language it knows. */
                detect: (text) => (text ? (lowlight.highlightAuto(text).data?.language ?? null) : null),
            };
        },

        addKeyboardShortcuts() {
            return {
                ...this.parent?.(),

                // Tab writes two spaces here rather than indenting the block:
                // code is indented, and a block of it is not.
                Tab: ({ editor }) => editor.isActive('codeBlock') && editor.commands.insertContent('  '),

                // Enter writes a line, so leaving takes a key of its own.
                'Shift-Enter': ({ editor }) =>
                    editor.isActive('codeBlock') &&
                    editor
                        .chain()
                        .command(({ tr, dispatch }) => {
                            const end = tr.selection.$head.after();

                            dispatch?.(tr.insert(end, editor.schema.nodes.paragraph.create()));

                            return true;
                        })
                        .setTextSelection(editor.state.selection.$head.after() + 1)
                        .focus()
                        .run(),
            };
        },
    }).configure({ lowlight, defaultLanguage: null });

    const offered = options.offered !== false;

    return {
        name: 'codeBlock',

        // Drawn by the same component whether it is written or read.
        views: { codeBlock: CodeBlockView },

        extensions: [offered ? extension : withoutAuthoring(extension)],

        menuItems: offered
            ? [
                  {
                      name: 'codeBlock',
                      glyph: 'code',
                      keywords: ['code', 'snippet', '```'],
                      run: (editor) => editor.chain().focus().setCodeBlock().run(),
                  },
              ]
            : [],

        // Enter writes a line here, so a field that sends on Enter has to hold it
        // back while the caret is inside a fence.
        holdsEnter: (state) => state?.editor?.isActive('codeBlock') === true,
    };
}

/**
 * The languages of [grammars], each by its own name, in the order of those names.
 *
 * Read once, when a picker first asks: every grammar is a function building its
 * rules, and there are close to two hundred of them.
 */
function namesOf(grammars) {
    let named = null;

    return () => {
        named ??= Object.entries(grammars)
            .map(([value, grammar]) => ({ value, label: grammar(hljs)?.name ?? value }))
            .sort((a, b) => a.label.localeCompare(b.label));

        return named;
    };
}
