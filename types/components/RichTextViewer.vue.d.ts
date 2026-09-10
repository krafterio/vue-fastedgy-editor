declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** How to read [value] when it is markdown. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /**
     * What colours a code block, `highlightedCode` from the package unless the
     * application brings its own. Left out, code is drawn plain.
     */
    highlight: {
        type: FunctionConstructor;
        default: null;
    };
    /** Same three modes as the editor, `auto` being the only one worth using here. */
    maxWidth: {
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
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    mention: (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The document to draw, markdown or a decoded document. */
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** How to read [value] when it is markdown. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /**
     * What colours a code block, `highlightedCode` from the package unless the
     * application brings its own. Left out, code is drawn plain.
     */
    highlight: {
        type: FunctionConstructor;
        default: null;
    };
    /** Same three modes as the editor, `auto` being the only one worth using here. */
    maxWidth: {
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
}>> & Readonly<{
    onMention?: ((...args: any[]) => any) | undefined;
}>, {
    fill: boolean;
    value: string | Record<string, any>;
    codec: Record<string, any>;
    maxWidth: string | number;
    maxHeight: string | number;
    highlight: Function;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=RichTextViewer.vue.d.ts.map