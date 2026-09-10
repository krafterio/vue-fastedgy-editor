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
export function mergeMarkdown(base, theirs, ours) {
    if (theirs === base || theirs === ours) {
        return ours;
    }

    if (ours === base) {
        return theirs;
    }

    const written = base.split('\n');
    const yours = changed(written, theirs.split('\n'));
    const mine = changed(written, ours.split('\n'));

    if (yours.from < mine.to && mine.from < yours.to) {
        return ours;
    }

    const [last, first] = yours.from < mine.from ? [mine, yours] : [yours, mine];

    // The later one first: putting it in does not move where the earlier one is.
    written.splice(last.from, last.to - last.from, ...last.lines);
    written.splice(first.from, first.to - first.from, ...first.lines);

    return written.join('\n');
}

/**
 * The one run of lines [other] rewrote of [base], its untouched edges pared away.
 *
 * @param {string[]} base
 * @param {string[]} other
 * @returns {{ from: number, to: number, lines: string[] }} - `to` excluded
 */
function changed(base, other) {
    const most = Math.min(base.length, other.length);
    let from = 0;

    while (from < most && base[from] === other[from]) {
        from++;
    }

    let kept = 0;

    while (kept < most - from && base[base.length - 1 - kept] === other[other.length - 1 - kept]) {
        kept++;
    }

    return { from, to: base.length - kept, lines: other.slice(from, other.length - kept) };
}
