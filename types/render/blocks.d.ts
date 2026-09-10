/**
 * The blocks of [doc], as VNodes.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {{ onMention?: (record: { model: string, id: number }) => void, image?: (block: object) => any, code?: (text: string, language: string|null) => any }} [options]
 * @returns {any[]}
 */
export function renderBlocks(doc: object, options?: {
    onMention?: (record: {
        model: string;
        id: number;
    }) => void;
    image?: (block: object) => any;
    code?: (text: string, language: string | null) => any;
}): any[];
//# sourceMappingURL=blocks.d.ts.map