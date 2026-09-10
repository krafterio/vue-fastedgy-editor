/**
 * What a document offers on its own, before a single feature is listed.
 *
 * Data, never widgets, for the same reason as everywhere else: what is offered
 * is declared here, and the drawing belongs to the application. `name` is the
 * key a label is said with, the package shipping no words.
 */

/** The blocks a "/" menu turns the current line into. */
export function coreMenuItems() {
    return [
        item('heading1', 'title', ['heading', 'title', 'h1', '#'], (editor) =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
        ),
        item('heading2', 'title', ['heading', 'title', 'h2', '##'], (editor) =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
        ),
        item('heading3', 'title', ['heading', 'title', 'h3', '###'], (editor) =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
        ),
        item('bulletedList', 'bulletedList', ['list', 'bullet', '*'], (editor) =>
            editor.chain().focus().toggleBulletList().run()
        ),
        item('numberedList', 'numberedList', ['list', 'number', '1.'], (editor) =>
            editor.chain().focus().toggleOrderedList().run()
        ),
        item('quote', 'quote', ['quote', '>'], (editor) => editor.chain().focus().toggleBlockquote().run()),
        item('rule', 'rule', ['rule', 'divider', '---'], (editor) => editor.chain().focus().setHorizontalRule().run()),
    ];
}

/**
 * What a bubble over a selection offers on its own: the marks a run can wear.
 *
 * The features add what they add, each in its own group, and the bubble draws
 * them in that order.
 */
export function coreActions() {
    return [
        mark('bold', 'bold', (editor) => editor.chain().focus().toggleBold().run()),
        mark('italic', 'italic', (editor) => editor.chain().focus().toggleItalic().run()),
        mark('underline', 'underline', (editor) => editor.chain().focus().toggleUnderline().run()),
        mark('strikethrough', 'strikethrough', (editor) => editor.chain().focus().toggleStrike().run()),
        mark('code', 'code', (editor) => editor.chain().focus().toggleCode().run()),
    ];
}

function item(name, glyph, keywords, run) {
    return { name, glyph, keywords, run };
}

function mark(name, glyph, run) {
    return {
        name,
        glyph,
        group: 0,
        isActive: (editor) => editor.isActive(name === 'strikethrough' ? 'strike' : name),
        isEnabled: (editor) => editor.isEditable,
        run,
    };
}

/**
 * The entries a set offers, its own first and the features' after, minus what a
 * feature said it stands in for.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {object[]}
 */
export function menuItemsOf(features) {
    const replaced = features.replacedMenuItems;

    return [...coreMenuItems().filter((entry) => !replaced.has(entry.name)), ...features.menuItems];
}

/**
 * The actions a set offers, sorted by group and then by the order they were
 * declared in.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {object[]}
 */
export function actionsOf(features) {
    return [...coreActions(), ...features.actions].sort((a, b) => (a.group ?? 0) - (b.group ?? 0));
}
