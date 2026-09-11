/**
 * What was written elsewhere, over what has been written here since.
 *
 * A document is saved a moment after the last keystroke and answered a moment
 * after that, and both moments are moments somebody goes on writing through.
 * Taking the answer whole undoes what they wrote in between; refusing it leaves
 * out what only the other side knows — a picture a server stored and named.
 *
 * So the answer is not taken, its difference is: what [theirs] changed of
 * [base], written into [ours]. Line by line, which is what this format is: a
 * block is a line, and two people writing in different blocks are two people
 * writing on different lines.
 *
 * Where both changed the same lines nothing tells them apart, and what was typed
 * is what is kept: a rewrite lost comes back at the next save, a sentence lost
 * is lost.
 *
 * @param {string} base - What was sent
 * @param {string} theirs - What came back
 * @param {string} ours - What is held now
 * @returns {string}
 */
export function mergeMarkdown(base: string, theirs: string, ours: string): string;
/**
 * A document written here while it may be written elsewhere.
 *
 * What the server holds is remembered, as last known, and everything that comes
 * back from it is written into what is on screen as a difference rather than
 * taken whole: somebody else's version announced while a sentence is being
 * typed, and the answer to a save, which comes back after the next keystroke.
 * The caret stays where it is, the editor being handed only the blocks that
 * changed.
 *
 * What says a version arrived, and what saves, is the application's: this is
 * the part of it that is the same for every document.
 *
 * @param {{ value: string }} content - What the editor writes and is given, its model
 * @returns {{
 *   hold: (markdown: string) => void,
 *   held: () => string,
 *   changed: () => boolean,
 *   absorb: (theirs: string) => void,
 *   answered: (sent: string, stored: string) => void,
 * }}
 *
 * @example
 * const body = useMergedDocument(toRef(form, 'content'));
 *
 * body.hold(record.content);                        // opened
 * if (body.changed()) {                             // a save to make
 *     const sent = form.content;
 *     const stored = (await api.save(id, { content: sent })).content;
 *     body.answered(sent, stored);                  // what the server rewrote, written in
 * }
 * body.absorb(fresh.content);                       // written elsewhere, written in
 */
export function useMergedDocument(content: {
    value: string;
}): {
    hold: (markdown: string) => void;
    held: () => string;
    changed: () => boolean;
    absorb: (theirs: string) => void;
    answered: (sent: string, stored: string) => void;
};
//# sourceMappingURL=merge.d.ts.map