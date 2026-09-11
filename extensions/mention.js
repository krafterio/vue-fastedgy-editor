import { Node } from '@tiptap/core';

/**
 * A mention, as the chip it is edited as.
 *
 * It carries what the address is made of rather than the address itself: a
 * record moved elsewhere is the same record, and the paths belong to the
 * application (cf `features/mention.js`). The label is stored too, or the
 * markdown could not be written back.
 *
 * What it is made of and how it is drawn, the one declaration the node read and
 * the node written are both built from (cf `record-mention.js`).
 */
export const MENTION = {
    name: 'mention',

    addAttributes() {
        return {
            model: { default: null, parseHTML: (element) => element.getAttribute('data-model') },
            id: { default: null, parseHTML: (element) => asId(element.getAttribute('data-id')) },
            label: { default: '', parseHTML: (element) => element.getAttribute('data-label') ?? '' },
        };
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            {
                ...HTMLAttributes,
                'data-mention': '',
                'data-model': node.attrs.model,
                'data-id': node.attrs.id,
                'data-label': node.attrs.label,
            },
            node.attrs.label ?? '',
        ];
    },

    renderText({ node }) {
        return node.attrs.label ?? '';
    },
};

/**
 * A mention as a document holds one, and nothing to write one with.
 *
 * The node tiptap's mention declares, with none of its suggestions: those are
 * the editor's, and a reader that never writes loads none of them. The mention
 * feature's editing brings tiptap's own in its place.
 */
export const MentionNode = Node.create({
    group: 'inline',
    inline: true,
    selectable: false,
    atom: true,

    parseHTML() {
        return [{ tag: `span[data-type="${this.name}"]` }];
    },

    ...MENTION,
});

function asId(value) {
    const id = Number(value);

    return Number.isFinite(id) ? id : value;
}
