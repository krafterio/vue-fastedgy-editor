import Image from '@tiptap/extension-image';

/**
 * A picture that remembers how big it was drawn.
 *
 * Markdown says nothing of size, so it rides in the address, which is ours (cf
 * `features/image.js`). The node has to carry it for the round trip to be able
 * to write it back, and `extension-image` alone carries `src` and `alt`.
 */
export const SizedImage = Image.extend({
    addOptions() {
        return {
            ...this.parent?.(),

            /**
             * What opens a picture at full size, where the application shows
             * one its own way. Called with the address as it is stored,
             * `attachment:15` and all.
             *
             * @type {((picture: { src: string, alt: string }) => void) | null}
             */
            open: null,

            /**
             * The component a picture is shown at full size in, mounted by the
             * picture itself when it is clicked, written or read: `picture`
             * (`{ src, alt }`) and `labels` in, `close` out.
             *
             * @type {any}
             */
            viewer: null,

            /** The words the viewer says, over the package's. */
            labels: {},
        };
    },

    /**
     * Read from `data-src` as readily as from `src`, cf {@link addressed}.
     */
    parseHTML() {
        return [{ tag: 'img[src]' }, { tag: 'img[data-src]' }];
    },

    addAttributes() {
        return {
            ...this.parent?.(),

            src: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-src') || element.getAttribute('src'),
                renderHTML: (attributes) => addressed(attributes.src),
            },

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

/**
 * An address the browser can fetch goes on `src`; ours goes beside it.
 *
 * `attachment:15` is read by the storage client and by nothing else. Written on
 * `src`, it is still an address as far as the browser is concerned: every time
 * ProseMirror builds the DOM of a node — the clipboard, the image dragged under
 * the pointer, `getHTML()` — the browser sets out to fetch a scheme it does not
 * know, and answers `ERR_UNKNOWN_URL_SCHEME` for a picture that is on screen and
 * perfectly fine. Detached or not: setting `src` is what starts the request.
 *
 * What is copied out of the document is not this anyway: the clipboard inlines
 * the picture it carries, cf `extensions/clipboard.js`.
 */
function addressed(src) {
    const address = src ?? '';

    if (!address) {
        return {};
    }

    return /^(https?|data|blob):/i.test(address) ? { src: address } : { 'data-src': address };
}

function size(value) {
    const number = Math.round(Number(value));

    return Number.isFinite(number) && number > 0 ? number : null;
}
