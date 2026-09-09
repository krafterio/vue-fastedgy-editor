/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

/**
 * One content feature: everything a kind of block needs, declared in one place.
 * How it renders, how it is typed and inserted, and how it is written to and
 * read back from markdown.
 *
 * Adding a feature is writing one of these and listing it in a registry; nothing
 * in the editor has to be touched.
 *
 * A markdown encoder without its decoder is half a round trip, and what a
 * feature saves comes back as nothing. A feature owns both ends or is not
 * declared.
 *
 * @typedef {object} RichTextFeature
 * @property {string} name
 * @property {any[]} [extensions] - What it adds to the schema
 * @property {number} [menuGroup] - Where its "/" entries sit, lowest first
 * @property {string[]} [replacesMenuItems] - Entries of the core menu it stands in for
 * @property {object[]} [menuItems]
 * @property {object[]} [actions]
 * @property {(state: any) => boolean} [holdsEnter] - Enter belongs to it right now
 * @property {MarkdownContract} [markdown]
 */

/**
 * @typedef {object} MarkdownContract
 * @property {Record<string, (node: object, context: object) => string>} [encoders] - By node type
 * @property {Record<string, (token: object, tokens: object[], at: number) => object[]>} [decoders] - By token type
 * @property {Array<(md: any) => void>} [inlineRules] - Offered before the parser's own
 * @property {(doc: object) => object} [before] - A last pass before writing
 * @property {(blocks: object[]) => object[]} [after] - Its mirror, over what was just read
 */

/**
 * The content features a document offers, in one list.
 *
 * Order matters where two features collide: the last one listed wins a node
 * type, and the passes are undone in reverse so a document goes back through
 * them the way it came out.
 *
 * @param {RichTextFeature[]} features
 */
export function createFeatures(features = []) {
    const merge = (key) => Object.assign({}, ...features.map((feature) => feature.markdown?.[key] ?? {}));

    return {
        features,

        /** The same set less the features of these names. */
        without(...names) {
            return createFeatures(features.filter((feature) => !names.includes(feature.name)));
        },

        /** The same set plus [added], which win any node type they share with it. */
        and(added) {
            return createFeatures([...features, ...added]);
        },

        get extensions() {
            return features.flatMap((feature) => feature.extensions ?? []);
        },

        /** By group, and within one by the order they were declared in. */
        get menuItems() {
            return features
                .map((feature, at) => ({ feature, at }))
                .sort((a, b) => (a.feature.menuGroup ?? 0) - (b.feature.menuGroup ?? 0) || a.at - b.at)
                .flatMap(({ feature }) => feature.menuItems ?? []);
        },

        get replacedMenuItems() {
            return new Set(features.flatMap((feature) => feature.replacesMenuItems ?? []));
        },

        get actions() {
            return features.flatMap((feature) => feature.actions ?? []);
        },

        get encoders() {
            return merge('encoders');
        },

        get decoders() {
            return merge('decoders');
        },

        get inlineRules() {
            return features.flatMap((feature) => feature.markdown?.inlineRules ?? []);
        },

        before(doc) {
            return features.reduce((shaped, feature) => feature.markdown?.before?.(shaped) ?? shaped, doc);
        },

        /** Undone in reverse, so a document goes back through the passes the way it came out. */
        after(blocks) {
            return [...features]
                .reverse()
                .reduce((shaped, feature) => feature.markdown?.after?.(shaped) ?? shaped, blocks);
        },

        /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
        holdsEnter(state) {
            return features.some((feature) => feature.holdsEnter?.(state) === true);
        },
    };
}
