declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** What the document is made of. */
    features: {
        type: ObjectConstructor;
        required: true;
    };
    /** How to read [value] when it is markdown, the features' own by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** What an editor that has just opened it says on its empty line, `({ node, empty }) => words`. */
    placeholder: {
        type: FunctionConstructor;
        default: null;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** What the document is made of. */
    features: {
        type: ObjectConstructor;
        required: true;
    };
    /** How to read [value] when it is markdown, the features' own by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** What an editor that has just opened it says on its empty line, `({ node, empty }) => words`. */
    placeholder: {
        type: FunctionConstructor;
        default: null;
    };
}>> & Readonly<{}>, {
    value: string | Record<string, any>;
    placeholder: Function;
    codec: Record<string, any>;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=RichTextBlocks.vue.d.ts.map