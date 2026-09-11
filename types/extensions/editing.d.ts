/**
 * What only writing needs: where a dragged block would land, the caret beside a
 * block that holds no text, and the undo history.
 *
 * Kept apart from what a document is made of, so a reader that never writes
 * never loads them: an application that only reads bundles none of this.
 *
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function editingExtensions(options?: {
    history?: boolean;
}): any[];
/**
 * What an editor of [features] is made of: the rich text the viewer reads, what
 * the features bring to write it with, each node a feature draws with a
 * component drawn by it as a node view, and what only writing needs.
 *
 * What a feature brings under the name of one of the document's own takes its
 * place, where it stood: a code block that can be typed is the one that could
 * only be read, and more.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @param {import('../features/registry.js').RichTextEditingSet} editing
 *   What the features bring to an editor, as `features.editing()` answers it
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function richTextEditorExtensions(features: ReturnType<typeof import("../index.js").createFeatures>, editing: import("../features/registry.js").RichTextEditingSet, options?: {
    history?: boolean;
}): any[];
//# sourceMappingURL=editing.d.ts.map