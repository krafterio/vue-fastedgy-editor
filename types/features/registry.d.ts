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
 * @property {Array<(editor: any) => any>} [surfaces] - What floats above the editor, each handed the editor it belongs to
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
        /** By group, and within one by the order they were declared in. */
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        /**
         * What floats above an editor, mounted by that editor and by nobody
         * else.
         *
         * Each one is handed the editor it belongs to: a popover of a document
         * where two are open would otherwise answer for the wrong one, and the
         * one that has the focus is rarely the one that was asked.
         */
        readonly surfaces: ((editor: any) => any)[];
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
        /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
        holdsEnter(state: any): boolean;
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
        /** By group, and within one by the order they were declared in. */
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        /**
         * What floats above an editor, mounted by that editor and by nobody
         * else.
         *
         * Each one is handed the editor it belongs to: a popover of a document
         * where two are open would otherwise answer for the wrong one, and the
         * one that has the focus is rarely the one that was asked.
         */
        readonly surfaces: ((editor: any) => any)[];
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
        /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
        holdsEnter(state: any): boolean;
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
        /** By group, and within one by the order they were declared in. */
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        /**
         * What floats above an editor, mounted by that editor and by nobody
         * else.
         *
         * Each one is handed the editor it belongs to: a popover of a document
         * where two are open would otherwise answer for the wrong one, and the
         * one that has the focus is rarely the one that was asked.
         */
        readonly surfaces: ((editor: any) => any)[];
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
        /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
        holdsEnter(state: any): boolean;
    };
    readonly extensions: any[];
    /** By group, and within one by the order they were declared in. */
    readonly menuItems: any[];
    readonly replacedMenuItems: Set<string>;
    readonly actions: any[];
    /**
     * What floats above an editor, mounted by that editor and by nobody
     * else.
     *
     * Each one is handed the editor it belongs to: a popover of a document
     * where two are open would otherwise answer for the wrong one, and the
     * one that has the focus is rarely the one that was asked.
     */
    readonly surfaces: ((editor: any) => any)[];
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
    /** Whether any feature is holding Enter; one is enough for the key to stay where it usually goes. */
    holdsEnter(state: any): boolean;
};
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
 */
export type RichTextFeature = {
    name: string;
    /**
     * - What it adds to the schema
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
     * - What floats above the editor, each handed the editor it belongs to
     */
    surfaces?: ((editor: any) => any)[] | undefined;
    /**
     * - Enter belongs to it right now
     */
    holdsEnter?: ((state: any) => boolean) | undefined;
    markdown?: MarkdownContract | undefined;
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
//# sourceMappingURL=registry.d.ts.map