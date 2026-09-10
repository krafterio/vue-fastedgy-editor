import Mention from '@tiptap/extension-mention';

/**
 * A mention, as the chip it is edited as.
 *
 * It carries what the address is made of rather than the address itself: a
 * record moved elsewhere is the same record, and the paths belong to the
 * application (cf `features/mention.js`). The label is stored too, or the
 * markdown could not be written back.
 */
export const RecordMention = Mention.extend({
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
});

function asId(value) {
    const id = Number(value);

    return Number.isFinite(id) ? id : value;
}
