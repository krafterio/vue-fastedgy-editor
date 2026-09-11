export namespace MENTION {
    let name: string;
    function addAttributes(): {
        model: {
            default: null;
            parseHTML: (element: any) => any;
        };
        id: {
            default: null;
            parseHTML: (element: any) => any;
        };
        label: {
            default: string;
            parseHTML: (element: any) => any;
        };
    };
    function renderHTML({ node, HTMLAttributes }: {
        node: any;
        HTMLAttributes: any;
    }): any[];
    function renderText({ node }: {
        node: any;
    }): any;
}
/**
 * A mention as a document holds one, and nothing to write one with.
 *
 * The node tiptap's mention declares, with none of its suggestions: those are
 * the editor's, and a reader that never writes loads none of them. The mention
 * feature's editing brings tiptap's own in its place.
 */
export const MentionNode: Node<any, any>;
import { Node } from '@tiptap/core';
//# sourceMappingURL=mention.d.ts.map