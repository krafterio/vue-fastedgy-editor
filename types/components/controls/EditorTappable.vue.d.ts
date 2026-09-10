declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
type __VLS_WithSlots<T, S> = T & (new () => {
    $slots: S;
});
declare const __VLS_base: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    onTap: {
        type: FunctionConstructor;
        default: null;
    };
    active: {
        type: BooleanConstructor;
        default: boolean;
    };
    radius: {
        type: NumberConstructor;
        default: null;
    };
    tooltip: {
        type: StringConstructor;
        default: string;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    onTap: {
        type: FunctionConstructor;
        default: null;
    };
    active: {
        type: BooleanConstructor;
        default: boolean;
    };
    radius: {
        type: NumberConstructor;
        default: null;
    };
    tooltip: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    onTap: Function;
    radius: number;
    active: boolean;
    tooltip: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    default?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=EditorTappable.vue.d.ts.map