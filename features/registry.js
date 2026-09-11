import { markRaw } from 'vue';

/**
 * One content feature: everything a kind of block needs, declared in one place.
 * How it is drawn and read back from markdown, and how it is written.
 *
 * Adding a feature is writing one of these and listing it in a registry; nothing
 * in the editor or the viewer has to be touched.
 *
 * What it declares here is what reading needs, the viewer's as much as the
 * editor's: the schema, the components that draw, the markdown. What only
 * writing needs is behind `editing`, loaded by the first editor built with the
 * feature and by nothing that only reads, so a page that shows documents and
 * never writes one bundles none of it.
 *
 * A markdown encoder without its decoder is half a round trip, and what a
 * feature saves comes back as nothing. A feature owns both ends or is not
 * declared.
 *
 * @typedef {object} RichTextFeature
 * @property {string} name
 * @property {any[]} [extensions] - What a document of it is made of, read or written
 * @property {Record<string, any>} [views] - By node type, the component drawing it, written or read
 * @property {Array<(text: () => Element|null, labels: object) => any>} [readingSurfaces] - What floats over the
 *   text, written or read
 * @property {MarkdownContract} [markdown]
 * @property {() => Promise<void>} [ready] - Settled once what it loads to draw as it does is there, a code
 *   block's colours for instance; asked for by whatever has to wait for it
 * @property {() => RichTextEditing | Promise<RichTextEditing>} [editing] - What only writing needs, asked for
 *   once an editor is built, `import()` being how it stays out of what only reads
 */

/**
 * What a feature brings to an editor, and to nothing that reads.
 *
 * @typedef {object} RichTextEditing
 * @property {any[]} [extensions] - Added to the editor's; one named as one of the feature's own takes its place
 * @property {number} [menuGroup] - Where its "/" entries sit, lowest first
 * @property {string[]} [replacesMenuItems] - Entries of the core menu it stands in for
 * @property {object[]} [menuItems]
 * @property {object[]} [actions]
 * @property {(kinds: string[]) => boolean} [takes] - Whether files of these kinds, dropped, are its
 * @property {() => Record<string, { copied?: Function, pasted?: Function }>} [clipboard] - What its nodes become
 *   on the clipboard, asked for while an editor is set up
 * @property {Array<(editor: any, labels: object) => any>} [surfaces] - What floats above the editor, each handed the
 *   editor it belongs to and the words that editor was given
 * @property {(state: any) => boolean} [holdsEnter] - Enter belongs to it right now
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

    // Asked for by the first editor built with this set, and shared by the rest.
    let editing = null;

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

        /**
         * Settled once every feature has what it loads to draw as it does: a
         * code block's colours arrive after the block itself, and what compares
         * or prints a document waits for them here.
         *
         * @returns {Promise<void>}
         */
        async ready() {
            await Promise.all(features.map((feature) => Promise.resolve(feature.ready?.())));
        },

        /**
         * What the features bring to an editor, loaded once for the set.
         *
         * Each feature's is asked for, which is where its `import()` runs: an
         * application that only reads never calls this, and never loads them.
         *
         * @returns {Promise<RichTextEditingSet>}
         */
        editing() {
            editing ??= Promise.all(features.map(async (feature) => (await feature.editing?.()) ?? {})).then(editingOf);

            return editing;
        },
    };
}

/**
 * What the features of a set bring to an editor, once loaded.
 *
 * @typedef {ReturnType<typeof editingOf>} RichTextEditingSet
 */

/**
 * What the features bring to an editor, [parts] in the order they were declared.
 *
 * @param {RichTextEditing[]} parts
 */
function editingOf(parts) {
    return {
        get extensions() {
            return parts.flatMap((part) => part.extensions ?? []);
        },

        /** By group, and within one by the order they were declared in. */
        get menuItems() {
            return parts
                .map((part, at) => ({ part, at }))
                .sort((a, b) => (a.part.menuGroup ?? 0) - (b.part.menuGroup ?? 0) || a.at - b.at)
                .flatMap(({ part }) => part.menuItems ?? []);
        },

        get replacedMenuItems() {
            return new Set(parts.flatMap((part) => part.replacesMenuItems ?? []));
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
            return Object.assign({}, ...parts.map((part) => part.clipboard?.() ?? {}));
        },

        /** Whether a feature takes files of these kinds, dropped on the text. */
        takes(kinds) {
            return kinds.length > 0 && parts.some((part) => part.takes?.(kinds) === true);
        },

        get actions() {
            return parts.flatMap((part) => part.actions ?? []);
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
            return parts.flatMap((part) => part.surfaces ?? []);
        },

        /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
        holdsEnter(state) {
            return parts.some((part) => part.holdsEnter?.(state) === true);
        },
    };
}
