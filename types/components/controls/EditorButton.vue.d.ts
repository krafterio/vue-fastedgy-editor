declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
type __VLS_WithSlots<T, S> = T & (new () => {
    $slots: S;
});
declare const __VLS_base: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    label: {
        type: StringConstructor;
        default: string;
    };
    onTap: {
        type: FunctionConstructor;
        default: null;
    };
    kind: {
        type: StringConstructor;
        default: string;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    label: {
        type: StringConstructor;
        default: string;
    };
    onTap: {
        type: FunctionConstructor;
        default: null;
    };
    kind: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    label: string;
    onTap: Function;
    kind: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    default?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=EditorButton.vue.d.ts.map