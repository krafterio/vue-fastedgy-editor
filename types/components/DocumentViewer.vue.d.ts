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
    /** What the document is made of, the same set the editor was given. */
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
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** The page's three modes, the editor's word for word. */
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
    /** The stored path of the cover. */
    cover: {
        type: StringConstructor;
        default: string;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    value: {
        type: (ObjectConstructor | StringConstructor)[];
        default: string;
    };
    /** What the document is made of, the same set the editor was given. */
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
    codec: {
        type: ObjectConstructor;
        default: null;
    };
    /** The page's three modes, the editor's word for word. */
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
    /** The stored path of the cover. */
    cover: {
        type: StringConstructor;
        default: string;
    };
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{}>, {
    fill: boolean;
    value: string | Record<string, any>;
    labels: Record<string, any>;
    cover: string;
    features: Record<string, any>;
    codec: Record<string, any>;
    minHeight: string | number;
    maxHeight: string | number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
type __VLS_Slots = {
    cover?: ((props: {}) => any) | undefined;
} & {
    header?: ((props: {}) => any) | undefined;
} & {
    footer?: ((props: {}) => any) | undefined;
};
//# sourceMappingURL=DocumentViewer.vue.d.ts.map