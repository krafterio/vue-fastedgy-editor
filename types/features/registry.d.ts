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
export function createFeatures(features?: RichTextFeature[]): {
    features: RichTextFeature[];
    /** The same set less the features of these names. */
    without(...names: any[]): {
        features: RichTextFeature[];
        without(...names: any[]): /*elided*/ any;
        /** The same, given the names in one list. */
        withoutAll(names: any): /*elided*/ any;
        /** The same set plus [added], which win any node type they share with it. */
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        /**
         * By node type, the component that draws it.
         *
         * The same one in the editor, where it is mounted as a node view, and in
         * the viewer, where it is mounted with nothing to edit: a picture or a
         * checkbox reads the same written or displayed because it is one
         * component, not two kept alike. The last feature declared wins.
         */
        readonly views: {
            [k: string]: any;
        };
        /**
         * What floats over the text whether it is written or read, mounted by
         * the editor and by the viewer alike.
         *
         * Each one is handed the element the text is drawn in, as a getter, and
         * the words: a card a mention opens is the same card in both.
         */
        readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
        readonly encoders: any;
        /**
         * By token type, the last feature declared offered first.
         *
         * Two features can want the same token and only one of them at a time:
         * an image and a widths marker are both a paragraph holding nothing
         * else. Each is offered the token in turn, and `null` moves on to the
         * next, the core reading what none of them took.
         */
        readonly decoders: {};
        readonly inlineRules: ((md: any) => void)[];
        before(doc: any): any;
        /** Undone in reverse, so a document goes back through the passes the way it came out. */
        after(blocks: any): any;
        /**
         * Settled once every feature has what it loads to draw as it does: a
         * code block's colours arrive after the block itself, and what compares
         * or prints a document waits for them here.
         *
         * @returns {Promise<void>}
         */
        ready(): Promise<void>;
        /**
         * What the features bring to an editor, loaded once for the set.
         *
         * Each feature's is asked for, which is where its `import()` runs: an
         * application that only reads never calls this, and never loads them.
         *
         * @returns {Promise<RichTextEditingSet>}
         */
        editing(): Promise<RichTextEditingSet>;
    };
    /** The same, given the names in one list. */
    withoutAll(names: any): {
        features: RichTextFeature[];
        /** The same set less the features of these names. */
        without(...names: any[]): /*elided*/ any;
        withoutAll(names: any): /*elided*/ any;
        /** The same set plus [added], which win any node type they share with it. */
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        /**
         * By node type, the component that draws it.
         *
         * The same one in the editor, where it is mounted as a node view, and in
         * the viewer, where it is mounted with nothing to edit: a picture or a
         * checkbox reads the same written or displayed because it is one
         * component, not two kept alike. The last feature declared wins.
         */
        readonly views: {
            [k: string]: any;
        };
        /**
         * What floats over the text whether it is written or read, mounted by
         * the editor and by the viewer alike.
         *
         * Each one is handed the element the text is drawn in, as a getter, and
         * the words: a card a mention opens is the same card in both.
         */
        readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
        readonly encoders: any;
        /**
         * By token type, the last feature declared offered first.
         *
         * Two features can want the same token and only one of them at a time:
         * an image and a widths marker are both a paragraph holding nothing
         * else. Each is offered the token in turn, and `null` moves on to the
         * next, the core reading what none of them took.
         */
        readonly decoders: {};
        readonly inlineRules: ((md: any) => void)[];
        before(doc: any): any;
        /** Undone in reverse, so a document goes back through the passes the way it came out. */
        after(blocks: any): any;
        /**
         * Settled once every feature has what it loads to draw as it does: a
         * code block's colours arrive after the block itself, and what compares
         * or prints a document waits for them here.
         *
         * @returns {Promise<void>}
         */
        ready(): Promise<void>;
        /**
         * What the features bring to an editor, loaded once for the set.
         *
         * Each feature's is asked for, which is where its `import()` runs: an
         * application that only reads never calls this, and never loads them.
         *
         * @returns {Promise<RichTextEditingSet>}
         */
        editing(): Promise<RichTextEditingSet>;
    };
    /** The same set plus [added], which win any node type they share with it. */
    and(added: any): {
        features: RichTextFeature[];
        /** The same set less the features of these names. */
        without(...names: any[]): /*elided*/ any;
        /** The same, given the names in one list. */
        withoutAll(names: any): /*elided*/ any;
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        /**
         * By node type, the component that draws it.
         *
         * The same one in the editor, where it is mounted as a node view, and in
         * the viewer, where it is mounted with nothing to edit: a picture or a
         * checkbox reads the same written or displayed because it is one
         * component, not two kept alike. The last feature declared wins.
         */
        readonly views: {
            [k: string]: any;
        };
        /**
         * What floats over the text whether it is written or read, mounted by
         * the editor and by the viewer alike.
         *
         * Each one is handed the element the text is drawn in, as a getter, and
         * the words: a card a mention opens is the same card in both.
         */
        readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
        readonly encoders: any;
        /**
         * By token type, the last feature declared offered first.
         *
         * Two features can want the same token and only one of them at a time:
         * an image and a widths marker are both a paragraph holding nothing
         * else. Each is offered the token in turn, and `null` moves on to the
         * next, the core reading what none of them took.
         */
        readonly decoders: {};
        readonly inlineRules: ((md: any) => void)[];
        before(doc: any): any;
        /** Undone in reverse, so a document goes back through the passes the way it came out. */
        after(blocks: any): any;
        /**
         * Settled once every feature has what it loads to draw as it does: a
         * code block's colours arrive after the block itself, and what compares
         * or prints a document waits for them here.
         *
         * @returns {Promise<void>}
         */
        ready(): Promise<void>;
        /**
         * What the features bring to an editor, loaded once for the set.
         *
         * Each feature's is asked for, which is where its `import()` runs: an
         * application that only reads never calls this, and never loads them.
         *
         * @returns {Promise<RichTextEditingSet>}
         */
        editing(): Promise<RichTextEditingSet>;
    };
    readonly extensions: any[];
    /**
     * By node type, the component that draws it.
     *
     * The same one in the editor, where it is mounted as a node view, and in
     * the viewer, where it is mounted with nothing to edit: a picture or a
     * checkbox reads the same written or displayed because it is one
     * component, not two kept alike. The last feature declared wins.
     */
    readonly views: {
        [k: string]: any;
    };
    /**
     * What floats over the text whether it is written or read, mounted by
     * the editor and by the viewer alike.
     *
     * Each one is handed the element the text is drawn in, as a getter, and
     * the words: a card a mention opens is the same card in both.
     */
    readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
    readonly encoders: any;
    /**
     * By token type, the last feature declared offered first.
     *
     * Two features can want the same token and only one of them at a time:
     * an image and a widths marker are both a paragraph holding nothing
     * else. Each is offered the token in turn, and `null` moves on to the
     * next, the core reading what none of them took.
     */
    readonly decoders: {};
    readonly inlineRules: ((md: any) => void)[];
    before(doc: any): any;
    /** Undone in reverse, so a document goes back through the passes the way it came out. */
    after(blocks: any): any;
    /**
     * Settled once every feature has what it loads to draw as it does: a
     * code block's colours arrive after the block itself, and what compares
     * or prints a document waits for them here.
     *
     * @returns {Promise<void>}
     */
    ready(): Promise<void>;
    /**
     * What the features bring to an editor, loaded once for the set.
     *
     * Each feature's is asked for, which is where its `import()` runs: an
     * application that only reads never calls this, and never loads them.
     *
     * @returns {Promise<RichTextEditingSet>}
     */
    editing(): Promise<RichTextEditingSet>;
};
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
 */
export type RichTextFeature = {
    name: string;
    /**
     * - What a document of it is made of, read or written
     */
    extensions?: any[] | undefined;
    /**
     * - By node type, the component drawing it, written or read
     */
    views?: Record<string, any> | undefined;
    /**
     * - What floats over the
     * text, written or read
     */
    readingSurfaces?: ((text: () => Element | null, labels: object) => any)[] | undefined;
    markdown?: MarkdownContract | undefined;
    /**
     * - Settled once what it loads to draw as it does is there, a code
     * block's colours for instance; asked for by whatever has to wait for it
     */
    ready?: (() => Promise<void>) | undefined;
    /**
     * - What only writing needs, asked for
     * once an editor is built, `import()` being how it stays out of what only reads
     */
    editing?: (() => RichTextEditing | Promise<RichTextEditing>) | undefined;
};
/**
 * What a feature brings to an editor, and to nothing that reads.
 */
export type RichTextEditing = {
    /**
     * - Added to the editor's; one named as one of the feature's own takes its place
     */
    extensions?: any[] | undefined;
    /**
     * - Where its "/" entries sit, lowest first
     */
    menuGroup?: number | undefined;
    /**
     * - Entries of the core menu it stands in for
     */
    replacesMenuItems?: string[] | undefined;
    menuItems?: any[] | undefined;
    actions?: any[] | undefined;
    /**
     * - Whether files of these kinds, dropped, are its
     */
    takes?: ((kinds: string[]) => boolean) | undefined;
    /**
     * - What its nodes become
     * on the clipboard, asked for while an editor is set up
     */
    clipboard?: (() => Record<string, {
        copied?: Function;
        pasted?: Function;
    }>) | undefined;
    /**
     * - What floats above the editor, each handed the
     * editor it belongs to and the words that editor was given
     */
    surfaces?: ((editor: any, labels: object) => any)[] | undefined;
    /**
     * - Enter belongs to it right now
     */
    holdsEnter?: ((state: any) => boolean) | undefined;
};
/**
 * One entry of the "/" menu.
 *
 * Data, never a widget: what is offered is declared here, and the drawing is the
 * application's, on its own buttons and its own glyphs. `name` is the key it
 * says the entry with, the package shipping no words of its own.
 */
export type SlashMenuItem = {
    name: string;
    glyph?: string | undefined;
    keywords?: string[] | undefined;
    run: (editor: any) => void;
};
/**
 * One thing a formatting strip can do, said without drawing anything.
 */
export type ToolbarAction = {
    name: string;
    glyph?: string | undefined;
    /**
     * - Actions of one group stand together
     */
    group?: number | undefined;
    /**
     * - Already done to the text under the caret
     */
    isActive?: ((editor: any) => boolean) | undefined;
    /**
     * - Usable at all right now
     */
    isEnabled?: ((editor: any) => boolean) | undefined;
    run: (editor: any) => void;
};
export type MarkdownContract = {
    /**
     * - By node type
     */
    encoders?: Record<string, (node: object, context: object) => string> | undefined;
    /**
     * - By token type, `null` handing the token back to the core
     */
    decoders?: Record<string, (token: object, tokens: object[], at: number) => object[] | null> | undefined;
    /**
     * - Offered before the parser's own
     */
    inlineRules?: ((md: any) => void)[] | undefined;
    /**
     * - A last pass before writing
     */
    before?: ((doc: object) => object) | undefined;
    /**
     * - Its mirror, over what was just read
     */
    after?: ((blocks: object[]) => object[]) | undefined;
};
/**
 * What the features of a set bring to an editor, once loaded.
 */
export type RichTextEditingSet = ReturnType<typeof editingOf>;
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
declare function editingOf(parts: RichTextEditing[]): {
    readonly extensions: any[];
    /** By group, and within one by the order they were declared in. */
    readonly menuItems: any[];
    readonly replacedMenuItems: Set<string>;
    /**
     * By node type, what a node becomes on its way to the clipboard and
     * back, `{ copied(node), pasted(node) }`, each answering a promise of the
     * node or null where it travels as it is.
     *
     * Asked for while an editor is being set up: what carries a file along
     * may need what the application provides, the storage client first.
     */
    clipboard(): any;
    /** Whether a feature takes files of these kinds, dropped on the text. */
    takes(kinds: any): boolean;
    readonly actions: any[];
    /**
     * What floats above an editor, mounted by that editor and by nobody
     * else.
     *
     * Each one is handed the editor it belongs to: a popover of a document
     * where two are open would otherwise answer for the wrong one, and the
     * one that has the focus is rarely the one that was asked.
     */
    readonly surfaces: ((editor: any, labels: object) => any)[];
    /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
    holdsEnter(state: any): boolean;
};
export {};
//# sourceMappingURL=registry.d.ts.map