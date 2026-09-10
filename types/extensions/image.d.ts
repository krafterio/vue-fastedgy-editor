/**
 * A picture that remembers how big it was drawn.
 *
 * Markdown says nothing of size, so it rides in the address, which is ours (cf
 * `features/image.js`). The node has to carry it for the round trip to be able
 * to write it back, and `extension-image` alone carries `src` and `alt`.
 */
export const SizedImage: import("@tiptap/core").Node<import("@tiptap/extension-image").ImageOptions, any>;
//# sourceMappingURL=image.d.ts.map