declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** What the document is made of, the same set the editor was given. */
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly views: {
                [k: string]: any;
            };
            readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            ready(): Promise<void>;
            editing(): Promise<RichTextEditingSet>;
        };
    };
    /** How to read [value] when it is markdown, the features' own by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** The editor's three modes, so a field switched from one to the other keeps its size. */
    maxWidth: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    minHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    maxHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    fill: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Words the features say, over the package's, as the editor takes them. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** What the document is made of, the same set the editor was given. */
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly views: {
                [k: string]: any;
            };
            readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            ready(): Promise<void>;
            editing(): Promise<RichTextEditingSet>;
        };
    };
    /** How to read [value] when it is markdown, the features' own by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** The editor's three modes, so a field switched from one to the other keeps its size. */
    maxWidth: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    minHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    maxHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    fill: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Words the features say, over the package's, as the editor takes them. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{}>, {
    fill: boolean;
    value: string | Record<string, any>;
    labels: Record<string, any>;
    features: Record<string, any>;
    codec: Record<string, any>;
    maxWidth: string | number;
    minHeight: string | number;
    maxHeight: string | number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=RichTextViewer.vue.d.ts.map