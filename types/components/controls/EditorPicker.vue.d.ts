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
    /** What the closed picker says, where it says more than the option chosen. */
    shown: {
        type: StringConstructor;
        default: string;
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
    /** What the closed picker says, where it says more than the option chosen. */
    shown: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    label: string;
    options: unknown[];
    selected: string | number | null;
    onSelect: Function;
    shown: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=EditorPicker.vue.d.ts.map