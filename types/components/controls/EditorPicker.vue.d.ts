declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    label: {
        type: StringConstructor;
        default: string;
    };
    /** `{ value, label }`, in the order they should be offered. */
    options: {
        type: ArrayConstructor;
        default: () => never[];
    };
    selected: {
        type: (NumberConstructor | StringConstructor | null)[];
        default: null;
    };
    onSelect: {
        type: FunctionConstructor;
        default: null;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    label: {
        type: StringConstructor;
        default: string;
    };
    /** `{ value, label }`, in the order they should be offered. */
    options: {
        type: ArrayConstructor;
        default: () => never[];
    };
    selected: {
        type: (NumberConstructor | StringConstructor | null)[];
        default: null;
    };
    onSelect: {
        type: FunctionConstructor;
        default: null;
    };
}>> & Readonly<{}>, {
    selected: string | number | null;
    label: string;
    options: unknown[];
    onSelect: Function;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=EditorPicker.vue.d.ts.map