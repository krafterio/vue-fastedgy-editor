/**
 * What a document offers on its own, before a single feature is listed.
 *
 * Data, never widgets, for the same reason as everywhere else: what is offered
 * is declared here, and the drawing belongs to the application. `name` is the
 * key a label is said with, the package shipping no words.
 */
/** The blocks a "/" menu turns the current line into. */
export function coreMenuItems(): {
    name: any;
    glyph: any;
    keywords: any;
    run: any;
}[];
/**
 * What a bubble over a selection offers on its own: the marks a run can wear.
 *
 * The features add what they add, each in its own group, and the bubble draws
 * them in that order.
 */
export function coreActions(): {
    name: any;
    glyph: any;
    group: number;
    isActive: (editor: any) => any;
    isEnabled: (editor: any) => any;
    run: any;
}[];
/**
 * The entries a set offers, its own first and the features' after, minus what a
 * feature said it stands in for.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {object[]}
 */
export function menuItemsOf(features: ReturnType<typeof import("../index.js").createFeatures>): object[];
/**
 * The actions a set offers, sorted by group and then by the order they were
 * declared in.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {object[]}
 */
export function actionsOf(features: ReturnType<typeof import("../index.js").createFeatures>): object[];
//# sourceMappingURL=core.d.ts.map