declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The stored path the record holds, never a URL built here. */
    path: {
        type: StringConstructor;
        default: string;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** What a chosen file becomes: the path it was stored at. */
    store: {
        type: FunctionConstructor;
        default: null;
    };
    pickFile: {
        type: FunctionConstructor;
        default: null;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:path": (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The stored path the record holds, never a URL built here. */
    path: {
        type: StringConstructor;
        default: string;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** What a chosen file becomes: the path it was stored at. */
    store: {
        type: FunctionConstructor;
        default: null;
    };
    pickFile: {
        type: FunctionConstructor;
        default: null;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{
    "onUpdate:path"?: ((...args: any[]) => any) | undefined;
}>, {
    path: string;
    editable: boolean;
    store: Function;
    pickFile: Function;
    labels: Record<string, any>;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=DocumentCover.vue.d.ts.map