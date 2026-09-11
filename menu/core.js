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
        item('paragraph', 'paragraph', ['paragraph', 'text', 'plain'], (editor) =>
            editor.chain().focus().setParagraph().run()
        ),
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
 * What a strip offers on its own, in the groups the mobile side declares: the
 * two ways back, the marks a run wears, the lists, the kind a line becomes, and
 * what is dropped in. A feature adds its own after, in the group it names.
 *
 * Everything is offered whether it can run or not, and says which: a strip whose
 * buttons come and go is a strip nobody learns the shape of.
 */
export function coreActions() {
    return [
        action('undo', 'undo', 0, {
            isEnabled: (editor) => editor.can().undo(),
            run: (editor) => editor.chain().focus().undo().run(),
        }),
        action('redo', 'redo', 0, {
            isEnabled: (editor) => editor.can().redo(),
            run: (editor) => editor.chain().focus().redo().run(),
        }),

        mark('bold', 'bold', (editor) => editor.chain().focus().toggleBold().run()),
        mark('italic', 'italic', (editor) => editor.chain().focus().toggleItalic().run()),
        mark('underline', 'underline', (editor) => editor.chain().focus().toggleUnderline().run()),
        mark('strikethrough', 'strikethrough', (editor) => editor.chain().focus().toggleStrike().run()),
        mark('code', 'code', (editor) => editor.chain().focus().toggleCode().run()),

        block('bulletedList', 'bulletedList', 2, 'bulletList', (editor) =>
            editor.chain().focus().toggleBulletList().run()
        ),
        block('numberedList', 'numberedList', 2, 'orderedList', (editor) =>
            editor.chain().focus().toggleOrderedList().run()
        ),

        heading(1),
        heading(2),
        heading(3),
        block('quote', 'quote', 3, 'blockquote', (editor) => editor.chain().focus().toggleBlockquote().run()),

        action('rule', 'rule', 4, { run: (editor) => editor.chain().focus().setHorizontalRule().run() }),
    ];
}

function item(name, glyph, keywords, run) {
    return { name, glyph, keywords, run };
}

/**
 * One thing a strip can do, said as data: what it is, what draws it, which
 * group it stands in, whether it is already done and whether it can be done.
 */
function action(name, glyph, group, { isActive, isEnabled, run }) {
    return {
        name,
        glyph,
        group,
        isActive: isActive ?? (() => false),
        isEnabled: (editor) => editor.isEditable && (isEnabled ? isEnabled(editor) : true),
        run,
    };
}

/** A mark the text itself wears, lit while the selection wears it. */
function mark(name, glyph, run) {
    const type = name === 'strikethrough' ? 'strike' : name;

    return action(name, glyph, 1, { isActive: (editor) => editor.isActive(type), run });
}

/** The kind a line becomes, and stops being when pressed again. */
function block(name, glyph, group, type, run) {
    return action(name, glyph, group, { isActive: (editor) => editor.isActive(type), run });
}

function heading(level) {
    return action(`heading${level}`, `heading${level}`, 3, {
        isActive: (editor) => editor.isActive('heading', { level }),
        run: (editor) => editor.chain().focus().toggleHeading({ level }).run(),
    });
}

/**
 * The entries a set offers, its own first and the features' after, minus what a
 * feature said it stands in for.
 *
 * @param {import('../features/registry.js').RichTextEditingSet|null} editing
 *   What the features bring to an editor, the core's alone until it is loaded
 * @returns {object[]}
 */
export function menuItemsOf(editing) {
    const replaced = editing?.replacedMenuItems ?? new Set();

    return [...coreMenuItems().filter((entry) => !replaced.has(entry.name)), ...(editing?.menuItems ?? [])];
}

/**
 * The actions a set offers, sorted by group and then by the order they were
 * declared in, minus what a feature said it stands in for.
 *
 * @param {import('../features/registry.js').RichTextEditingSet|null} editing
 *   What the features bring to an editor, the core's alone until it is loaded
 * @returns {object[]}
 */
export function actionsOf(editing) {
    const replaced = editing?.replacedActions ?? new Set();

    return [...coreActions().filter((entry) => !replaced.has(entry.name)), ...(editing?.actions ?? [])].sort(
        (a, b) => (a.group ?? 0) - (b.group ?? 0)
    );
}
