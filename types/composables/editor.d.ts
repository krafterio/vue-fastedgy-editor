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
        readonly surfaces: ((editor: any, labels: object) => any)[];
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
/**
 * The title above a document spills into it.
 *
 * At the end of a title, `Enter` and `↓` put the caret in the first block rather
 * than doing nothing — a detail, and what lets a page be typed in one go. The
 * mobile side does it too, so a note typed on either reads the same way.
 *
 * `↓` only from the end of the line: pressed anywhere else it is moving through
 * what is already written, and taking the caret away would be taking it from
 * somebody in the middle of a word.
 *
 * @param {() => any} editor - The editor the title sits above, as `@ready` hands
 *   it over
 * @returns {(event: KeyboardEvent) => void} - A `keydown` handler for the field
 *
 * @example
 * <input @keydown.enter.prevent="spills" @keydown.down="spills" />
 */
export function spillsInto(editor: () => any): (event: KeyboardEvent) => void;
/**
 * Writes [content] into [editor], replacing only the blocks that differ.
 *
 * A document handed over whole is a document rebuilt whole: the caret goes back
 * to the top of it, and whoever was writing has to find their place again. What
 * really differs, after a save answered or a change made elsewhere, is almost
 * always one block — so one block is what is replaced, and the caret is carried
 * through it the way any other edit carries it.
 *
 * Kept out of the undo history: undoing a change nobody here made would put back
 * a picture the server has already stored under another name.
 *
 * @param {any} editor
 * @param {object} content - A document, in the shape the codec decodes to
 * @returns {boolean} - Whether anything was written
 */
export function writeInto(editor: any, content: object): boolean;
//# sourceMappingURL=editor.d.ts.map