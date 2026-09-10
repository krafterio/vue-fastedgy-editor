/**
 * A tiptap editor built from a set of features, and nothing drawn.
 *
 * What `RichTextEditor` mounts, on its own: the schema, what the features add,
 * the placeholders and the clipboard. It is here rather than inside the
 * component for whoever wants the engine without our surfaces, a preview being
 * rendered into a canvas or a screen laying its own chrome around the text.
 *
 * @param {object} [options]
 * @param {ReturnType<typeof createFeatures>} [options.features]
 * @param {{ encode: (doc: object) => string, decode: (source: string) => object }} [options.codec]
 * @param {string} [options.content] - What the field holds, in the codec's shape
 * @param {boolean} [options.editable]
 * @param {string} [options.emptyPlaceholder] - Said where the document is empty
 * @param {string} [options.hintPlaceholder] - Said on an empty paragraph
 * @param {(markdown: string, editor: any) => void} [options.onUpdate]
 * @param {(editor: any) => void} [options.onCreate]
 * @returns {import('vue').ShallowRef<any>}
 */
export function useRichTextEditor(options?: {
    features?: {
        features: import("../index.js").RichTextFeature[];
        without(...names: any[]): /*elided*/ any;
        withoutAll(names: any): /*elided*/ any;
        and(added: any): /*elided*/ any;
        readonly extensions: any[];
        readonly menuItems: any[];
        readonly replacedMenuItems: Set<string>;
        readonly actions: any[];
        readonly surfaces: ((editor: any) => any)[];
        readonly encoders: any;
        readonly decoders: {};
        readonly inlineRules: ((md: any) => void)[];
        before(doc: any): any;
        after(blocks: any): any;
        holdsEnter(state: any): boolean;
    } | undefined;
    codec?: {
        encode: (doc: object) => string;
        decode: (source: string) => object;
    } | undefined;
    content?: string | undefined;
    editable?: boolean | undefined;
    emptyPlaceholder?: string | undefined;
    hintPlaceholder?: string | undefined;
    onUpdate?: ((markdown: string, editor: any) => void) | undefined;
    onCreate?: ((editor: any) => void) | undefined;
}): import("vue").ShallowRef<any>;
//# sourceMappingURL=editor.d.ts.map