declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The element the text is drawn in, read once it is drawn. */
    text: {
        type: FunctionConstructor;
        required: true;
    };
    /** The sources the mentions were written from, by model. */
    sources: {
        type: ArrayConstructor;
        default: () => never[];
    };
    /** What opens what a mention points at, a route on the web. */
    open: {
        type: FunctionConstructor;
        default: null;
    };
    /** Words the card says, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The element the text is drawn in, read once it is drawn. */
    text: {
        type: FunctionConstructor;
        required: true;
    };
    /** The sources the mentions were written from, by model. */
    sources: {
        type: ArrayConstructor;
        default: () => never[];
    };
    /** What opens what a mention points at, a route on the web. */
    open: {
        type: FunctionConstructor;
        default: null;
    };
    /** Words the card says, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{}>, {
    labels: Record<string, any>;
    open: Function;
    sources: unknown[];
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=MentionPreview.vue.d.ts.map