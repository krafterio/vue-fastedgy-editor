/**
 * What a document is made of, declared name by name.
 *
 * No starter kit, and deliberately: it decides the schema in our place, carries
 * what we do not want, and leaves the inventory of node types unreadable. The
 * schema is the contract of the codec, so what is not listed here must not be
 * able to exist in a document.
 *
 * A list container is deliberately kept while nesting is an attribute: it is
 * what markdown has no word for, rebuilt on the way in from the items that sit
 * at the same depth.
 *
 * What only writing needs is not here but in `editingExtensions`: a reader reads
 * a document with these, and nothing else.
 *
 * @returns {any[]}
 */
export function coreExtensions(): any[];
/**
 * A node that can be read and not written: no rule turning what is typed into
 * one, no shortcut, nothing pasted becoming one, a code editor's clipboard
 * included. What draws it stays, its colours among them.
 *
 * @param {any} extension
 * @returns {any}
 */
export function withoutAuthoring(extension: any): any;
/**
 * What a rich text of [features] is made of, the one list the editor and the
 * viewer are both built from, a page's included.
 *
 * The core's nodes, less those a feature brings in their place. A feature says
 * each of these once, in the registry, and they reach the editor and the viewer
 * alike: the editor adds to them what only writing needs, the components the
 * features draw with mounted as node views among it (`richTextEditorExtensions`).
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {any[]}
 */
export function richTextExtensions(features: ReturnType<typeof import("../index.js").createFeatures>): any[];
//# sourceMappingURL=schema.d.ts.map