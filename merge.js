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
export function useMergedDocument(content) {
    let held = '';

    return {
        /** What the server holds, taken as it is: a document opened, or opened again. */
        hold(markdown) {
            held = markdown ?? '';
            content.value = held;
        },

        /** What the server holds, as last known. */
        held: () => held,

        /** Whether what is on screen is not what the server holds: what a save carries. */
        changed: () => content.value !== held,

        /**
         * Somebody else's version, written into what is on screen: what changed
         * between what the server held and what it holds now, and nothing else.
         */
        absorb(theirs) {
            const stored = theirs ?? '';

            content.value = mergeMarkdown(held, stored, content.value);
            held = stored;
        },

        /**
         * A save answered: what the server stored of what was [sent], written into
         * what has been typed since. A picture sent inline comes back stored and
         * named, and read back or the next save sends it again.
         */
        answered(sent, stored) {
            const kept = stored ?? sent;

            if (kept !== sent) {
                content.value = mergeMarkdown(sent, kept, content.value);
            }

            held = kept;
        },
    };
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
