/**
 * A picture in a document being read.
 *
 * A component of its own, and not a VNode built beside the others, because a
 * directive is applied **while a component renders**: attached to a node built
 * in a computed, `v-fetcher-src` never runs, the picture asks for the file with
 * no token, and an attachment comes back a 401.
 */
export const ViewerPicture: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    src: {
        type: StringConstructor;
        default: string;
    };
    alt: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        default: null;
    };
    height: {
        type: NumberConstructor;
        default: null;
    };
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    src: {
        type: StringConstructor;
        default: string;
    };
    alt: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        default: null;
    };
    height: {
        type: NumberConstructor;
        default: null;
    };
}>> & Readonly<{}>, {
    width: number;
    height: number;
    src: string;
    alt: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
//# sourceMappingURL=ViewerPicture.d.ts.map