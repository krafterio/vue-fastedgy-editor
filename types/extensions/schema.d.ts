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
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function coreExtensions(options?: {
    history?: boolean;
}): any[];
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
 * The core's nodes, less those a feature brings in their place, and each node a
 * feature draws with a component drawn by it. A feature says each of these once,
 * in the registry, and they reach the editor and the viewer alike.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @param {{ history?: boolean }} [options]
 * @returns {any[]}
 */
export function richTextExtensions(features: ReturnType<typeof import("../index.js").createFeatures>, options?: {
    history?: boolean;
}): any[];
//# sourceMappingURL=schema.d.ts.map