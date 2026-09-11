declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** Whether the card is up. */
    shown: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Where the mention it is about is drawn. */
    rect: {
        type: ObjectConstructor;
        default: null;
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    preview: {
        type: ObjectConstructor;
        default: null;
    };
    /** Whether the card offers the way to what the mention points at. */
    action: {
        type: BooleanConstructor;
        default: boolean;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: (...args: any[]) => void;
    follow: (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** Whether the card is up. */
    shown: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Where the mention it is about is drawn. */
    rect: {
        type: ObjectConstructor;
        default: null;
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    preview: {
        type: ObjectConstructor;
        default: null;
    };
    /** Whether the card offers the way to what the mention points at. */
    action: {
        type: BooleanConstructor;
        default: boolean;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{
    onClose?: ((...args: any[]) => any) | undefined;
    onFollow?: ((...args: any[]) => any) | undefined;
}>, {
    shown: boolean;
    labels: Record<string, any>;
    rect: Record<string, any>;
    loading: boolean;
    preview: Record<string, any>;
    action: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=MentionCard.vue.d.ts.map