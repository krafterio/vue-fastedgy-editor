declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    /** The editor it acts on, as `@ready` hands it over. */
    editor: {
        type: ObjectConstructor;
        default: null;
    };
    /** The same set the editor was given, so the strip offers what it can do. */
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly menuItems: any[];
            readonly replacedMenuItems: Set<string>;
            readonly actions: any[];
            readonly surfaces: ((editor: any, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            holdsEnter(state: any): boolean;
        };
    };
    /** Words the strip says, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    /** The editor it acts on, as `@ready` hands it over. */
    editor: {
        type: ObjectConstructor;
        default: null;
    };
    /** The same set the editor was given, so the strip offers what it can do. */
    features: {
        type: ObjectConstructor;
        default: () => {
            features: import("../index.js").RichTextFeature[];
            without(...names: any[]): /*elided*/ any;
            withoutAll(names: any): /*elided*/ any;
            and(added: any): /*elided*/ any;
            readonly extensions: any[];
            readonly menuItems: any[];
            readonly replacedMenuItems: Set<string>;
            readonly actions: any[];
            readonly surfaces: ((editor: any, labels: object) => any)[];
            readonly encoders: any;
            readonly decoders: {};
            readonly inlineRules: ((md: any) => void)[];
            before(doc: any): any;
            after(blocks: any): any;
            holdsEnter(state: any): boolean;
        };
    };
    /** Words the strip says, by name. Nothing is shipped. */
    labels: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{}>, {
    labels: Record<string, any>;
    editor: Record<string, any>;
    features: Record<string, any>;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=RichTextActionBar.vue.d.ts.map