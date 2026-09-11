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
            editing(): Promise<RichTextEditingSet>;
        };
    };
    /** How the field stores what is written: markdown by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Longueurs CSS, or a number of pixels. */
    maxWidth: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    minHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    maxHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    /** Takes the height of its container, which has to be a bounded one. */
    fill: {
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
    /** A field emptied of its words goes back to a paragraph. */
    resetWhenEmpty: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Words the surfaces say, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
    /** `false` leaves the slash to be typed, and offers nothing. */
    slashMenu: {
        type: BooleanConstructor;
        default: boolean;
    };
    /**
     * `false` where the application docks a `RichTextActionBar` of its own: two
     * strips offering the same thing is one too many, and the bubble is the one
     * a thumb cannot reach.
     */
    formatBubble: {
        type: BooleanConstructor;
        default: boolean;
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
            editing(): Promise<RichTextEditingSet>;
        };
    };
    /** How the field stores what is written: markdown by default. */
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    editable: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Longueurs CSS, or a number of pixels. */
    maxWidth: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    minHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    maxHeight: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    /** Takes the height of its container, which has to be a bounded one. */
    fill: {
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
    /** A field emptied of its words goes back to a paragraph. */
    resetWhenEmpty: {
        type: BooleanConstructor;
        default: boolean;
    };
    /** Words the surfaces say, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
    /** `false` leaves the slash to be typed, and offers nothing. */
    slashMenu: {
        type: BooleanConstructor;
        default: boolean;
    };
    /**
     * `false` where the application docks a `RichTextActionBar` of its own: two
     * strips offering the same thing is one too many, and the bubble is the one
     * a thumb cannot reach.
     */
    formatBubble: {
        type: BooleanConstructor;
        default: boolean;
    };
    modelValue: {
        type: import("vue").PropType<string>;
    };
}>> & Readonly<{
    "onUpdate:modelValue"?: ((value: string) => any) | undefined;
}>, {
    fill: boolean;
    editable: boolean;
    labels: Record<string, any>;
    features: Record<string, any>;
    codec: Record<string, any>;
    maxWidth: string | number;
    minHeight: string | number;
    maxHeight: string | number;
    emptyPlaceholder: string;
    hintPlaceholder: string;
    resetWhenEmpty: boolean;
    slashMenu: boolean;
    formatBubble: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    header?: ((props: {}) => any) | undefined;
} & {
    leading?: ((props: {}) => any) | undefined;
} & {
    trailing?: ((props: {}) => any) | undefined;
} & {
    footer?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=RichTextEditor.vue.d.ts.map