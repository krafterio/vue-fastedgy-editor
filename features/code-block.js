import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import css from 'highlight.js/lib/languages/css';
import dart from 'highlight.js/lib/languages/dart';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { createLowlight } from 'lowlight';

import CodeBlockView from '../components/blocks/CodeBlockView.vue';

/** What a code block can be tagged with, in the order a picker should offer them. */
export const codeBlockLanguages = ['css', 'dart', 'javascript', 'python', 'typescript', 'vue', 'xml'];

/**
 * Fenced code, highlighted.
 *
 * The fence itself is written and read by the core codec; what a document is
 * missing without this is the node that holds one, and the colours.
 *
 * `vue` is offered and stored as `vue`, and highlighted as `xml`: highlight.js
 * has no grammar of that name, and the value a document carries is not something
 * to rewrite because of what a highlighter happens to know.
 *
 * @param {{ offered?: boolean, labels?: { auto?: string, language?: string, copy?: string, copied?: string } }} [options]
 *   `offered: false` keeps every way of reading a code block and takes away every
 *   way of creating one. Dropping the feature instead would take the reading with
 *   it, and a document holding a fence would come back without it.
 *
 *   `labels` are the words the block shows. None are shipped: what is visible in
 *   a document is written in the language of the application, not of a package.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function codeBlockFeature(options = {}) {
    const lowlight = createLowlight();

    lowlight.register({ css, dart, javascript, python, typescript, xml });
    lowlight.registerAlias('xml', 'vue');

    const extension = CodeBlockLowlight.extend({
        addOptions() {
            return { ...this.parent?.(), labels: options.labels ?? {} };
        },

        addNodeView() {
            return VueNodeViewRenderer(CodeBlockView);
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

function withoutAuthoring(extension) {
    return extension.extend({
        addInputRules: () => [],
        addPasteRules: () => [],
        addKeyboardShortcuts: () => ({}),
    });
}
