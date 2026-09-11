import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/** An element [tag] saying [text], which is what a widget draws. */
const element = (tag, text, className) => () => {
    const drawn = document.createElement(tag);

    drawn.className = className;
    drawn.textContent = text;

    return drawn;
};

/**
 * A feature laying every kind of decoration a plugin lays, over every block.
 *
 * What the viewer draws of decorations is compared with what the editor's view
 * draws of the very same ones: a node's attributes, a class, a style and an
 * attribute of its own; a widget before each block, and at both ends of each
 * line; and two decorations over the start of each line, overlapping, one of
 * them naming its own element.
 *
 * @returns {import('../../features/registry.js').RichTextFeature}
 */
export function decoratingFeature() {
    return {
        extensions: [
            Extension.create({
                name: 'decorating',

                addProseMirrorPlugins: () => [
                    new Plugin({
                        props: {
                            decorations(state) {
                                const laid = [];

                                state.doc.forEach((block, offset) => {
                                    laid.push(
                                        Decoration.widget(offset, element('div', '—', 'between'), { side: -1 }),
                                        Decoration.node(offset, offset + block.nodeSize, {
                                            class: 'marked',
                                            style: 'outline: 1px solid red',
                                            'data-marked': 'yes',
                                        })
                                    );
                                });

                                state.doc.descendants((node, position) => {
                                    if (!node.isTextblock) {
                                        return true;
                                    }

                                    const start = position + 1;
                                    const size = node.content.size;

                                    laid.push(
                                        Decoration.widget(start, element('span', '★', 'first'), { side: -1 }),
                                        Decoration.widget(start + size, element('span', '☆', 'last'), { side: 1 })
                                    );

                                    if (size >= 5) {
                                        laid.push(
                                            Decoration.inline(start, start + 3, { class: 'hit' }),
                                            Decoration.inline(start + 1, start + 5, { nodeName: 'mark', class: 'over' })
                                        );
                                    }

                                    return false;
                                });

                                return DecorationSet.create(state.doc, laid);
                            },
                        },
                    }),
                ],
            }),
        ],
    };
}
