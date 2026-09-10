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
//# sourceMappingURL=merge.d.ts.map