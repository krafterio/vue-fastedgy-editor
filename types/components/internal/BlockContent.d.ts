/**
 * What a document reader hands a component for the blocks it holds.
 *
 * Provided by the viewer to each block it draws with a component, and by
 * nobody in an editor, where ProseMirror fills the content itself.
 *
 * @type {import('vue').InjectionKey<() => any[]>}
 */
export const HELD_CONTENT: import("vue").InjectionKey<() => any[]>;
/**
 * Where a block component puts what it holds: the text of a code block, the
 * paragraph of a task.
 *
 * In an editor this is `NodeViewContent`, an element ProseMirror fills. Read,
 * there is no ProseMirror, so the same element is drawn with the content in it:
 * the same tag, the same style and the same attribute, so the one CSS lays both
 * out alike.
 */
export const BlockContent: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    as: {
        type: StringConstructor;
        default: string;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    as: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    as: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=BlockContent.d.ts.map