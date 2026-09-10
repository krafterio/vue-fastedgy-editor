import Image from '@tiptap/extension-image';

/**
 * A picture that remembers how big it was drawn.
 *
 * Markdown says nothing of size, so it rides in the address, which is ours (cf
 * `features/image.js`). The node has to carry it for the round trip to be able
 * to write it back, and `extension-image` alone carries `src` and `alt`.
 */
export const SizedImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),

            width: {
                default: null,
                parseHTML: (element) => size(element.getAttribute('width')),
                renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
            },

            height: {
                default: null,
                parseHTML: (element) => size(element.getAttribute('height')),
                renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
            },
        };
    },
});

function size(value) {
    const number = Math.round(Number(value));

    return Number.isFinite(number) && number > 0 ? number : null;
}
