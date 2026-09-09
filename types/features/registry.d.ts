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
export function createFeatures(features?: RichTextFeature[]): {
    features: RichTextFeature[];
    /** The same set less the features of these names. */
    without(...names: any[]): {
        features: RichTextFeature[];
        without(...names: any[]): /*elided*/ any;
        /** The same set plus [added], which win any node type they share with it. */
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        /** By group, and within one by the order they were declared in. */
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        readonly encoders: any;
        readonly decoders: any;
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
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        /** By group, and within one by the order they were declared in. */
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        readonly encoders: any;
        readonly decoders: any;
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
    readonly encoders: any;
    readonly decoders: any;
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
     * - Enter belongs to it right now
     */
    holdsEnter?: ((state: any) => boolean) | undefined;
    markdown?: MarkdownContract | undefined;
};
export type MarkdownContract = {
    /**
     * - By node type
     */
    encoders?: Record<string, (node: object, context: object) => string> | undefined;
    /**
     * - By token type
     */
    decoders?: Record<string, (token: object, tokens: object[], at: number) => object[]> | undefined;
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