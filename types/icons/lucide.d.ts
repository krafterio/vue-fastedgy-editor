/**
 * The forty-five glyphs, drawn by Lucide.
 *
 * Not a fallback: what is not named still has no glyph, and the package still
 * draws nothing of itself. This is one icon set named once, for the many
 * applications that use it, so nobody writes the same forty-five lines again —
 * the way the mobile side ships a Material table and lets an application swap it.
 *
 * Imported from `vue-fastedgy-editor/icons/lucide`, never from the package
 * itself: `@lucide/vue` is an **optional** peer, and an application that draws
 * with something else never loads a line of this.
 *
 * @example
 * import { lucideRichTextIcons } from 'vue-fastedgy-editor/icons/lucide';
 *
 * provideRichTextIcons({ ...lucideRichTextIcons, mentionUser: AtSign });
 */
export const lucideRichTextIcons: Readonly<{
    check: FunctionalComponent<import("@lucide/vue").LucideProps>;
    copy: FunctionalComponent<import("@lucide/vue").LucideProps>;
    copied: FunctionalComponent<import("@lucide/vue").LucideProps>;
    cut: FunctionalComponent<import("@lucide/vue").LucideProps>;
    paste: FunctionalComponent<import("@lucide/vue").LucideProps>;
    selectAll: FunctionalComponent<import("@lucide/vue").LucideProps>;
    title: FunctionalComponent<import("@lucide/vue").LucideProps>;
    link: FunctionalComponent<import("@lucide/vue").LucideProps>;
    openExternal: FunctionalComponent<import("@lucide/vue").LucideProps>;
    unlink: FunctionalComponent<import("@lucide/vue").LucideProps>;
    add: FunctionalComponent<import("@lucide/vue").LucideProps>;
    insertLeft: FunctionalComponent<import("@lucide/vue").LucideProps>;
    insertRight: FunctionalComponent<import("@lucide/vue").LucideProps>;
    insertAbove: FunctionalComponent<import("@lucide/vue").LucideProps>;
    insertBelow: FunctionalComponent<import("@lucide/vue").LucideProps>;
    duplicate: FunctionalComponent<import("@lucide/vue").LucideProps>;
    clear: FunctionalComponent<import("@lucide/vue").LucideProps>;
    delete: FunctionalComponent<import("@lucide/vue").LucideProps>;
    gripRow: FunctionalComponent<import("@lucide/vue").LucideProps>;
    gripColumn: FunctionalComponent<import("@lucide/vue").LucideProps>;
    image: FunctionalComponent<import("@lucide/vue").LucideProps>;
    imageMissing: FunctionalComponent<import("@lucide/vue").LucideProps>;
    close: FunctionalComponent<import("@lucide/vue").LucideProps>;
    download: FunctionalComponent<import("@lucide/vue").LucideProps>;
    resetZoom: FunctionalComponent<import("@lucide/vue").LucideProps>;
    previous: FunctionalComponent<import("@lucide/vue").LucideProps>;
    next: FunctionalComponent<import("@lucide/vue").LucideProps>;
    slash: FunctionalComponent<import("@lucide/vue").LucideProps>;
    paragraph: FunctionalComponent<import("@lucide/vue").LucideProps>;
    heading1: FunctionalComponent<import("@lucide/vue").LucideProps>;
    heading2: FunctionalComponent<import("@lucide/vue").LucideProps>;
    heading3: FunctionalComponent<import("@lucide/vue").LucideProps>;
    bold: FunctionalComponent<import("@lucide/vue").LucideProps>;
    italic: FunctionalComponent<import("@lucide/vue").LucideProps>;
    underline: FunctionalComponent<import("@lucide/vue").LucideProps>;
    strikethrough: FunctionalComponent<import("@lucide/vue").LucideProps>;
    code: FunctionalComponent<import("@lucide/vue").LucideProps>;
    table: FunctionalComponent<import("@lucide/vue").LucideProps>;
    quote: FunctionalComponent<import("@lucide/vue").LucideProps>;
    bulletedList: FunctionalComponent<import("@lucide/vue").LucideProps>;
    numberedList: FunctionalComponent<import("@lucide/vue").LucideProps>;
    todoList: FunctionalComponent<import("@lucide/vue").LucideProps>;
    rule: FunctionalComponent<import("@lucide/vue").LucideProps>;
    undo: FunctionalComponent<import("@lucide/vue").LucideProps>;
    redo: FunctionalComponent<import("@lucide/vue").LucideProps>;
}>;
//# sourceMappingURL=lucide.d.ts.map