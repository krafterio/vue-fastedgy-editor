import { inject, provide } from 'vue';

/**
 * The glyphs a document asks for, named by what they mean and never by what they
 * draw. A name outlives the drawing: an application changes its icon set without
 * anything here knowing.
 */
export const richTextIconNames = Object.freeze([
    'check',
    'copy',
    'copied',
    'cut',
    'paste',
    'selectAll',
    'title',
    'link',
    'openExternal',
    'unlink',
    'add',
    'insertLeft',
    'insertRight',
    'insertAbove',
    'insertBelow',
    'duplicate',
    'clear',
    'delete',
    'gripRow',
    'gripColumn',
    'image',
    'imageMissing',
    'close',
    'download',
    'resetZoom',
    'previous',
    'next',
    'slash',
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'code',
    'table',
    'quote',
    'bulletedList',
    'numberedList',
    'todoList',
    'rule',
    'undo',
    'redo',
]);

const ICONS = Symbol('fe-rich-text-icons');

/**
 * Lends the glyphs drawn from here down, by name.
 *
 * A **partial** table: naming two glyphs does not oblige anyone to name
 * thirty-nine. What is not named simply has no glyph, and what would have drawn
 * it says its label instead.
 *
 * It **adds to** what is already lent rather than replacing it, so a third-party
 * package can name the glyphs of what it brings and an application name the rest,
 * neither of them having to know about the other. The nearer one wins a name they
 * both use.
 *
 * @param {Record<string, unknown>} [icons]
 */
export function provideRichTextIcons(icons = {}) {
    provide(ICONS, { ...inject(ICONS, {}), ...icons });
}

/**
 * @returns {{ icon: (name: string) => unknown }} The glyph of a name, or `null`
 *   where the application named none.
 */
export function useRichTextIcons() {
    const icons = inject(ICONS, {});

    return { icon: (name) => icons[name] ?? null };
}
