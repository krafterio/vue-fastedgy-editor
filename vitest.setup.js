/**
 * jsdom does no layout, and ProseMirror measures.
 *
 * Scrolling a selection into view asks a text node or a range where it is, and
 * jsdom has no answer to give. An empty list is what "nothing is laid out" means
 * and it is what a browser answers for a node nobody drew, so measuring reads as
 * nothing rather than throwing under every test that moves the caret.
 */
const nothing = Object.assign([], { item: () => null });
const empty = () => nothing;
const zero = () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 });

for (const holder of [globalThis.Range, globalThis.Node]) {
    if (holder && !holder.prototype.getClientRects) {
        holder.prototype.getClientRects = empty;
    }

    if (holder && !holder.prototype.getBoundingClientRect) {
        holder.prototype.getBoundingClientRect = zero;
    }
}
