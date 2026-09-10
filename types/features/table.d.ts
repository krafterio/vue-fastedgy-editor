/**
 * Tables, written one line per row.
 *
 * Everything a cell holds stays on its line: a line break is `<br>`, a pipe is
 * escaped, and a cell holding nothing is written as nothing, the pipes around it
 * holding it open.
 *
 * How wide a column is drawn is not something markdown says, so it rides in a
 * comment under the table, written only where a column was actually dragged. Any
 * other reader passes over it and sees the plain table it is.
 *
 * The handles that insert and delete a row or a column float above the editor
 * rather than inside the table: what draws a table is `prosemirror-tables`, down
 * to the column widths somebody drags, and a node view of our own around it
 * would take that away.
 *
 * @param {{ defaultColumnWidth?: number, labels?: Record<string, string> }} [options]
 * @returns {import('./registry.js').RichTextFeature}
 */
export function tableFeature(options?: {
    defaultColumnWidth?: number;
    labels?: Record<string, string>;
}): import("./registry.js").RichTextFeature;
/**
 * @param {object} node - Table node, ProseMirror JSON
 * @param {number} byDefault - The width of a column nobody dragged
 * @returns {string}
 */
export function encodeTable(node: object, byDefault?: number): string;
/**
 * A table read back with the line breaks its cells were written with.
 *
 * The structure is the parser's; what it cannot know is that a `<br>` in a cell
 * is a line break we wrote and not the four characters somebody typed.
 */
export function readTable(token: any, tokens: any, at: any): any[] | null;
/**
 * The widths marker, read as a block of its own for {@link foldWidths} to fold
 * into the table above it.
 *
 * Any other paragraph is handed back to the core, which is what `null` says.
 */
export function readWidths(token: any, tokens: any, at: any): {
    type: string;
    attrs: {
        widths: number[];
    };
}[] | null;
/**
 * Gives each table the widths written under it and drops the markers.
 *
 * The pass a block parser cannot do: what a marker says belongs to the block
 * before it, and a parser only ever sees its own.
 *
 * @param {object[]} blocks
 * @returns {object[]}
 */
export function foldWidths(blocks: object[]): object[];
//# sourceMappingURL=table.d.ts.map