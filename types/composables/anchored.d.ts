/**
 * Where a floating surface sits, read from what it hangs on.
 *
 * Against the viewport rather than against the block it points at: an editor
 * that scrolls, one that is capped and scrolls inside itself, and one that grows
 * with its content are three different parents, and a surface that measured
 * against any of them would be right in one case out of three.
 *
 * The surface belongs to the editor that opened it, which is why the listeners
 * are posted on mounting and taken back on unmounting, and why nothing here is
 * shared: two editors on a page each hold their own.
 *
 * A surface also **hides when what it hangs on leaves the visible part of the
 * editor**: an editor capped in height scrolls for itself, and a bubble left
 * floating over a line that scrolled away points at nothing.
 *
 * @param {() => DOMRect|null} measure - The rectangle to hang on, or `null` to hide
 * @param {{ within?: () => Element|null }} [options] - What the anchor has to stay inside
 * @returns {{ rect: import('vue').Ref<DOMRect|null>, follow: () => void }}
 */
export function useAnchoredRect(measure: () => DOMRect | null, options?: {
    within?: () => Element | null;
}): {
    rect: import("vue").Ref<DOMRect | null>;
    follow: () => void;
};
/**
 * The style a surface sits at, above or below what it hangs on.
 *
 * @param {DOMRect|null} rect
 * @param {{ gap?: number, place?: 'above'|'below' }} [options]
 * @returns {Record<string, string>}
 */
export function anchoredStyle(rect: DOMRect | null, options?: {
    gap?: number;
    place?: "above" | "below";
}): Record<string, string>;
/**
 * A list keeps what it points at in sight.
 *
 * Arrow keys walk the entries while the caret goes on writing, so nothing here
 * ever takes the focus and nothing scrolls on its own: a list longer than the
 * room it has would carry its selection below the fold, and the one thing a
 * keyboard needs is to see where it is.
 *
 * @param {import('vue').Ref<HTMLElement|null>} holder - The list itself
 * @param {import('vue').Ref<unknown>} selected - What moves when the choice does
 */
export function useSelectionInSight(holder: import("vue").Ref<HTMLElement | null>, selected: import("vue").Ref<unknown>): void;
//# sourceMappingURL=anchored.d.ts.map