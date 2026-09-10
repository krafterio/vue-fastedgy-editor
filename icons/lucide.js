import {
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowUpToLine,
    Bold,
    Check,
    ChevronLeft,
    ChevronRight,
    Clipboard,
    Code,
    Copy,
    CopyCheck,
    Eraser,
    ExternalLink,
    GripHorizontal,
    GripVertical,
    Heading1,
    Heading2,
    Heading3,
    Image,
    ImageOff,
    Italic,
    Link,
    List,
    ListChecks,
    ListOrdered,
    Minus,
    Pilcrow,
    Plus,
    Quote,
    Redo2,
    RotateCcw,
    Scissors,
    Slash,
    Strikethrough,
    Table,
    TextSelect,
    Trash2,
    Type,
    Underline,
    Undo2,
    Unlink,
    X,
} from '@lucide/vue';

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
export const lucideRichTextIcons = Object.freeze({
    check: Check,
    copy: Copy,
    copied: CopyCheck,
    cut: Scissors,
    paste: Clipboard,
    selectAll: TextSelect,
    title: Type,
    link: Link,
    openExternal: ExternalLink,
    unlink: Unlink,
    add: Plus,
    insertLeft: ArrowLeftToLine,
    insertRight: ArrowRightToLine,
    insertAbove: ArrowUpToLine,
    insertBelow: ArrowDownToLine,
    duplicate: Copy,
    clear: Eraser,
    delete: Trash2,
    gripRow: GripHorizontal,
    gripColumn: GripVertical,
    image: Image,
    imageMissing: ImageOff,
    close: X,
    download: ArrowDownToLine,
    resetZoom: RotateCcw,
    previous: ChevronLeft,
    next: ChevronRight,
    slash: Slash,
    paragraph: Pilcrow,
    heading1: Heading1,
    heading2: Heading2,
    heading3: Heading3,
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strikethrough: Strikethrough,
    code: Code,
    table: Table,
    quote: Quote,
    bulletedList: List,
    numberedList: ListOrdered,
    todoList: ListChecks,
    rule: Minus,
    undo: Undo2,
    redo: Redo2,
});
