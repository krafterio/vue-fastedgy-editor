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
 * What a strip offers on its own, in the groups the mobile side declares: the
 * two ways back, the marks a run wears, the lists, the kind a line becomes, and
 * what is dropped in. A feature adds its own after, in the group it names.
 *
 * Everything is offered whether it can run or not, and says which: a strip whose
 * buttons come and go is a strip nobody learns the shape of.
 */
export function coreActions(): {
    name: any;
    glyph: any;
    group: any;
    isActive: any;
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