/**
 * The words in force: what the application said, over what the package says.
 *
 * Read at each call rather than built once, so a locale changed while a document
 * is open changes what it says without remounting it.
 *
 * @param {Record<string, string>} [labels] - What the application renames
 * @returns {Record<string, string>}
 */
export function richTextLabels(labels?: Record<string, string>): Record<string, string>;
/**
 * What each name the editor says means, English being the key.
 *
 * A name is what a document calls something; the words are what a reader sees,
 * and they are translated like anything else an application says. Nothing here
 * is imposed: whatever is passed as `labels` wins, name by name, so an
 * application renames one entry without writing the other fifty.
 */
export const richTextWords: Readonly<{
    paragraph: "Text";
    bold: "Bold";
    italic: "Italic";
    underline: "Underline";
    strikethrough: "Strikethrough";
    code: "Code";
    heading1: "Heading 1";
    heading2: "Heading 2";
    heading3: "Heading 3";
    bulletedList: "Bulleted list";
    numberedList: "Numbered list";
    todoList: "To-do list";
    quote: "Quote";
    rule: "Divider";
    undo: "Undo";
    redo: "Redo";
    table: "Table";
    image: "Image";
    link: "Link";
    codeBlock: "Code block";
    actions: "Formatting";
    add: "Add a block";
    block: "Block";
    duplicate: "Duplicate";
    delete: "Delete";
    replace: "Replace";
    clear: "Remove";
    address: "Address";
    title: "Title";
    value: "Value";
    apply: "Apply";
    open: "Open";
    unlink: "Unlink";
    language: "Language";
    sending: "Sending";
    close: "Close";
    download: "Save the image";
    resetZoom: "Actual size";
    previous: "Previous";
    next: "Next";
    column: "Column";
    row: "Row";
    addColumn: "Add a column";
    addRow: "Add a row";
    insertLeft: "Insert left";
    insertRight: "Insert right";
    insertAbove: "Insert above";
    insertBelow: "Insert below";
    duplicateColumn: "Duplicate the column";
    duplicateRow: "Duplicate the row";
    deleteColumn: "Delete the column";
    deleteRow: "Delete the row";
}>;
//# sourceMappingURL=labels.d.ts.map