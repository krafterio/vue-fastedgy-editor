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
//# sourceMappingURL=schema.d.ts.map