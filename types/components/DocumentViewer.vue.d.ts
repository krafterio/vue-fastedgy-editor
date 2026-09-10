declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
type __VLS_WithSlots<T, S> = T & (new () => {
    $slots: S;
});
declare const __VLS_base: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    highlight: {
        type: FunctionConstructor;
        default: null;
    };
    cover: {
        type: StringConstructor;
        default: string;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    mention: (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    highlight: {
        type: FunctionConstructor;
        default: null;
    };
    cover: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{
    onMention?: ((...args: any[]) => any) | undefined;
}>, {
    value: string | Record<string, any>;
    codec: Record<string, any>;
    cover: string;
    highlight: Function;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    cover?: ((props: {}) => any) | undefined;
} & {
    header?: ((props: {}) => any) | undefined;
} & {
    footer?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=DocumentViewer.vue.d.ts.map