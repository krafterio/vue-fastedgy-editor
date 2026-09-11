declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
type __VLS_WithSlots<T, S> = T & (new () => {
    $slots: S;
});
declare const __VLS_base: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly views: {
                [k: string]: any;
            };
            readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            ready(): Promise<void>;
            editing(): Promise<RichTextEditingSet>;
        };
    };
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /**
     * The three modes of [00 §3.1], carried by the page rather than by the
     * field: what scrolls on a page is the page, and a field that scrolled
     * inside a scrolling page would give two bars for one document.
     */
    minHeight: {
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
    /**
     * Set into a column of the application's: the page keeps no margin of its
     * own, its blocks line up with what stands above and below it, and the
     * gutter hangs outside, in the margin the application leaves.
     */
    flush: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** The stored path of the cover, and how a new one is chosen and kept. */
    cover: {
        type: StringConstructor;
        default: string;
    };
    pickFile: {
        type: FunctionConstructor;
        default: null;
    };
    storeCover: {
        type: FunctionConstructor;
        default: null;
    };
    slashMenu: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** `false` where the application docks a `RichTextActionBar` of its own. */
    formatBubble: {
        type: BooleanConstructor;
        default: boolean;
    };
    emptyPlaceholder: {
        type: StringConstructor;
        default: string;
    };
    hintPlaceholder: {
        type: StringConstructor;
        default: string;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
    modelValue: {
        type: import("vue").PropType<string>;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:modelValue": (value: string) => any;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly views: {
                [k: string]: any;
            };
            readonly readingSurfaces: ((text: () => Element | null, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            ready(): Promise<void>;
            editing(): Promise<RichTextEditingSet>;
        };
    };
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /**
     * The three modes of [00 §3.1], carried by the page rather than by the
     * field: what scrolls on a page is the page, and a field that scrolled
     * inside a scrolling page would give two bars for one document.
     */
    minHeight: {
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
    /**
     * Set into a column of the application's: the page keeps no margin of its
     * own, its blocks line up with what stands above and below it, and the
     * gutter hangs outside, in the margin the application leaves.
     */
    flush: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** The stored path of the cover, and how a new one is chosen and kept. */
    cover: {
        type: StringConstructor;
        default: string;
    };
    pickFile: {
        type: FunctionConstructor;
        default: null;
    };
    storeCover: {
        type: FunctionConstructor;
        default: null;
    };
    slashMenu: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** `false` where the application docks a `RichTextActionBar` of its own. */
    formatBubble: {
        type: BooleanConstructor;
        default: boolean;
    };
    emptyPlaceholder: {
        type: StringConstructor;
        default: string;
    };
    hintPlaceholder: {
        type: StringConstructor;
        default: string;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
    modelValue: {
        type: import("vue").PropType<string>;
    };
}>> & Readonly<{
    "onUpdate:modelValue"?: ((value: string) => any) | undefined;
}>, {
    fill: boolean;
    editable: boolean;
    pickFile: Function;
    labels: Record<string, any>;
    cover: string;
    features: Record<string, any>;
    codec: Record<string, any>;
    minHeight: string | number;
    maxHeight: string | number;
    emptyPlaceholder: string;
    hintPlaceholder: string;
    slashMenu: boolean;
    formatBubble: boolean;
    flush: boolean;
    storeCover: Function;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    cover?: ((props: {}) => any) | undefined;
} & {
    header?: ((props: {}) => any) | undefined;
} & {
    footer?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=DocumentEditor.vue.d.ts.map