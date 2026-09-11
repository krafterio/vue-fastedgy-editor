/**
 * Checkable items, `- [ ] ` and `- [x] `.
 *
 * Both directions of markdown already live in the core codec, task items being
 * one of the eleven blocks it writes and reads, and the core holds the nodes to
 * read them with. What this adds is the box they are drawn with, and the ways to
 * write one.
 *
 * Nesting is off on purpose: a document is flat here, and depth is the `indent`
 * attribute the whole schema shares. A task item that could hold a sublist would
 * be a second way of saying the same thing, and the one markdown cannot express.
 *
 * The box is drawn from the theme rather than by the browser, as it is on the
 * mobile side: a document draws its own furniture.
 *
 * @returns {import('./registry.js').RichTextFeature}
 */
export function todoListFeature(): import("./registry.js").RichTextFeature;
//# sourceMappingURL=todo-list.d.ts.map