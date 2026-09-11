import { markRaw } from 'vue';

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
 * @property {Record<string, any>} [views] - By node type, the component drawing it, written or read
 * @property {number} [menuGroup] - Where its "/" entries sit, lowest first
 * @property {string[]} [replacesMenuItems] - Entries of the core menu it stands in for
 * @property {object[]} [menuItems]
 * @property {object[]} [actions]
 * @property {(kinds: string[]) => boolean} [takes] - Whether files of these kinds, dropped, are its
 * @property {Array<(text: () => Element|null, labels: object) => any>} [readingSurfaces] - What floats over the
 *   text, written or read
 * @property {() => Record<string, { copied?: Function, pasted?: Function }>} [clipboard] - What its nodes become
 *   on the clipboard, asked for while an editor is set up
 * @property {Array<(editor: any, labels: object) => any>} [surfaces] - What floats above the editor, each handed the
 *   editor it belongs to and the words that editor was given
 * @property {(state: any) => boolean} [holdsEnter] - Enter belongs to it right now
 * @property {MarkdownContract} [markdown]
 */

/**
 * One entry of the "/" menu.
 *
 * Data, never a widget: what is offered is declared here, and the drawing is the
 * application's, on its own buttons and its own glyphs. `name` is the key it
 * says the entry with, the package shipping no words of its own.
 *
 * @typedef {object} SlashMenuItem
 * @property {string} name
 * @property {string} [glyph]
 * @property {string[]} [keywords]
 * @property {(editor: any) => void} run
 */

/**
 * One thing a formatting strip can do, said without drawing anything.
 *
 * @typedef {object} ToolbarAction
 * @property {string} name
 * @property {string} [glyph]
 * @property {number} [group] - Actions of one group stand together
 * @property {(editor: any) => boolean} [isActive] - Already done to the text under the caret
 * @property {(editor: any) => boolean} [isEnabled] - Usable at all right now
 * @property {(editor: any) => void} run
 */

/**
 * @typedef {object} MarkdownContract
 * @property {Record<string, (node: object, context: object) => string>} [encoders] - By node type
 * @property {Record<string, (token: object, tokens: object[], at: number) => object[]|null>} [decoders] - By token type, `null` handing the token back to the core
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

        /** The same, given the names in one list. */
        withoutAll(names) {
            return createFeatures(features.filter((feature) => !names.includes(feature.name)));
        },

        /** The same set plus [added], which win any node type they share with it. */
        and(added) {
            return createFeatures([...features, ...added]);
        },

        get extensions() {
            return features.flatMap((feature) => feature.extensions ?? []);
        },

        /**
         * By node type, the component that draws it.
         *
         * The same one in the editor, where it is mounted as a node view, and in
         * the viewer, where it is mounted with nothing to edit: a picture or a
         * checkbox reads the same written or displayed because it is one
         * component, not two kept alike. The last feature declared wins.
         */
        get views() {
            const views = Object.assign({}, ...features.map((feature) => feature.views ?? {}));

            // A component, not state: read through a reactive set of features, it
            // stays the component it is.
            return Object.fromEntries(Object.entries(views).map(([name, view]) => [name, markRaw(view)]));
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

        /**
         * By node type, what a node becomes on its way to the clipboard and
         * back, `{ copied(node), pasted(node) }`, each answering a promise of the
         * node or null where it travels as it is.
         *
         * Asked for while an editor is being set up: what carries a file along
         * may need what the application provides, the storage client first.
         */
        clipboard() {
            return Object.assign({}, ...features.map((feature) => feature.clipboard?.() ?? {}));
        },

        /** Whether a feature takes files of these kinds, dropped on the text. */
        takes(kinds) {
            return kinds.length > 0 && features.some((feature) => feature.takes?.(kinds) === true);
        },

        get actions() {
            return features.flatMap((feature) => feature.actions ?? []);
        },

        /**
         * What floats above an editor, mounted by that editor and by nobody
         * else.
         *
         * Each one is handed the editor it belongs to: a popover of a document
         * where two are open would otherwise answer for the wrong one, and the
         * one that has the focus is rarely the one that was asked.
         */
        get surfaces() {
            return features.flatMap((feature) => feature.surfaces ?? []);
        },

        /**
         * What floats over the text whether it is written or read, mounted by
         * the editor and by the viewer alike.
         *
         * Each one is handed the element the text is drawn in, as a getter, and
         * the words: a card a mention opens is the same card in both.
         */
        get readingSurfaces() {
            return features.flatMap((feature) => feature.readingSurfaces ?? []);
        },

        get encoders() {
            return merge('encoders');
        },

        /**
         * By token type, the last feature declared offered first.
         *
         * Two features can want the same token and only one of them at a time:
         * an image and a widths marker are both a paragraph holding nothing
         * else. Each is offered the token in turn, and `null` moves on to the
         * next, the core reading what none of them took.
         */
        get decoders() {
            const byType = {};

            for (const feature of features) {
                for (const [type, decode] of Object.entries(feature.markdown?.decoders ?? {})) {
                    const previous = byType[type];

                    byType[type] = previous
                        ? (token, tokens, at) => decode(token, tokens, at) ?? previous(token, tokens, at)
                        : decode;
                }
            }

            return byType;
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
