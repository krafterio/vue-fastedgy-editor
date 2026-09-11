import { extendedOnce } from '../../extensions/extend.js';

/**
 * What writes a code block: the fence typed, the keys that stay in the code,
 * and the entry that makes one.
 *
 * `offered: false` keeps every way of reading one and takes away every way of
 * creating one, the block staying as its feature reads it.
 *
 * @param {any} base - The block as its feature declares it, before reading took the ways to write it away
 * @param {{ offered: boolean }} options
 * @returns {import('../registry.js').RichTextEditing}
 */
export function codeBlockEditing(base, { offered }) {
    return {
        extensions: offered
            ? [
                  extendedOnce(base, {
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
                  }),
              ]
            : [],

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
