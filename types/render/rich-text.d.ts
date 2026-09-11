/**
 * A document drawn by what draws it in the editor, and by nothing else.
 *
 * ProseMirror's model, not its view: the schema is built from the extensions
 * the editor is built from, the document is read into it, and each node and
 * each mark is drawn by the schema's own `toDOM`, the function the editor's view
 * calls. What no view means is no selection, no input, no plugin: an editor is
 * the view, and none is mounted.
 *
 * What the features draw otherwise, they say, and it is applied here without
 * this file knowing a single node by its name:
 *
 * - `views`, the components drawing a node, mounted here with nothing to edit.
 *
 * And what an extension draws itself is asked of it here as the editor's view
 * asks: the node view it builds, a task item or a table, and the decorations its
 * plugins lay, a code block's colours.

 *
 * What ProseMirror adds of its own is added too: the break that holds an empty
 * line open.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {{ schema: any, codec: ReturnType<typeof createMarkdownCodec>, draw: (doc: object) => any[] }}
 */
export function createRichTextReader(features: ReturnType<typeof import("../index.js").createFeatures>): {
    schema: any;
    codec: ReturnType<typeof createMarkdownCodec>;
    draw: (doc: object) => any[];
};
import { createMarkdownCodec } from '../markdown/codec.js';
//# sourceMappingURL=rich-text.d.ts.map