declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
type __VLS_WithSlots<T, S> = T & (new () => {
    $slots: S;
});
declare const __VLS_base: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** Where it hangs, as a rectangle read from the document. */
    rect: {
        type: ObjectConstructor;
        default: null;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
    side: {
        type: StringConstructor;
        default: string;
    };
    align: {
        type: StringConstructor;
        default: string;
    };
    /** Whether the caret goes on writing while this is up. */
    keepsFocus: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** Where it hangs, as a rectangle read from the document. */
    rect: {
        type: ObjectConstructor;
        default: null;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
    side: {
        type: StringConstructor;
        default: string;
    };
    align: {
        type: StringConstructor;
        default: string;
    };
    /** Whether the caret goes on writing while this is up. */
    keepsFocus: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{
    onClose?: ((...args: any[]) => any) | undefined;
}>, {
    open: boolean;
    rect: Record<string, any>;
    side: string;
    align: string;
    keepsFocus: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    default?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=AnchoredSurface.vue.d.ts.map