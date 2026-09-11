import { addLocaleMessages, t } from 'vue-fastedgy';

import { fr } from './locales/fr.js';

// Handed over at import time, and merged the moment an application names its
// i18n: a key the application already translates keeps its own wording.
addLocaleMessages({ fr });

/**
 * What each name the editor says means, English being the key.
 *
 * A name is what a document calls something; the words are what a reader sees,
 * and they are translated like anything else an application says. Nothing here
 * is imposed: whatever is passed as `labels` wins, name by name, so an
 * application renames one entry without writing the other fifty.
 */
export const richTextWords = Object.freeze({
    paragraph: 'Text',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    code: 'Code',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bulletedList: 'Bulleted list',
    numberedList: 'Numbered list',
    todoList: 'To-do list',
    quote: 'Quote',
    rule: 'Divider',
    undo: 'Undo',
    redo: 'Redo',
    table: 'Table',
    image: 'Image',
    link: 'Link',
    codeBlock: 'Code block',

    actions: 'Formatting',
    add: 'Add a block',
    block: 'Block',
    duplicate: 'Duplicate',
    delete: 'Delete',
    replace: 'Replace',
    clear: 'Remove',

    address: 'Address',
    title: 'Title',
    value: 'Value',
    apply: 'Apply',
    open: 'Open',
    unlink: 'Unlink',
    language: 'Language',
    auto: 'Auto',
    copy: 'Copy',
    copied: 'Copied',
    sending: 'Sending',

    close: 'Close',
    download: 'Save the image',
    resetZoom: 'Actual size',
    previous: 'Previous',
    next: 'Next',

    column: 'Column',
    row: 'Row',
    addColumn: 'Add a column',
    addRow: 'Add a row',
    insertLeft: 'Insert left',
    insertRight: 'Insert right',
    insertAbove: 'Insert above',
    insertBelow: 'Insert below',
    duplicateColumn: 'Duplicate the column',
    duplicateRow: 'Duplicate the row',
    deleteColumn: 'Delete the column',
    deleteRow: 'Delete the row',
});

/**
 * The words in force: what the application said, over what the package says.
 *
 * Read at each call rather than built once, so a locale changed while a document
 * is open changes what it says without remounting it.
 *
 * @param {Record<string, string>} [labels] - What the application renames
 * @returns {Record<string, string>}
 */
export function richTextLabels(labels = {}) {
    const said = {};

    for (const [name, word] of Object.entries(richTextWords)) {
        said[name] = t(word);
    }

    return { ...said, ...labels };
}
