/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

/**
 * What a backslash is allowed in front of in markdown, which is ASCII
 * punctuation and nothing else. Before anything else it is just a backslash,
 * and `\1` escapes no more than the `1` did.
 *
 * A rule of the format, not a list of what opens a block: what opens a block is
 * never written down anywhere, see {@link escapeOffsets}.
 */
const PUNCTUATION = /[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/;

/** A backslash that stands for the character behind it, rather than for itself. */
const ESCAPE = /\\([\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e])/g;

const BLANK = /\s/;
const NON_BLANK = /\S/;

/**
 * [text] as markdown will hand it back: the characters an escape stands for, and
 * the backslashes that stand for nothing left where they are.
 *
 * @param {string} text
 * @returns {string}
 */
export function unescaped(text) {
    return text.replace(ESCAPE, (_, character) => character);
}

/**
 * Where the backslashes could go, cheapest first: the first character markdown
 * would read something into, then every one of them in the opening word.
 *
 * Two rounds and no more. One backslash is what `#`, `-`, `>` and `1.` take;
 * all of them is what a rule or a fence takes, being the same character three
 * times over. Anything still ambiguous after that is ambiguous.
 *
 * @param {string} text
 * @returns {number[][]}
 */
export function escapeOffsets(text) {
    const start = text.search(NON_BLANK);

    if (start < 0) {
        return [];
    }

    const rest = text.slice(start).search(BLANK);
    const word = rest < 0 ? text.length : start + rest;
    const offsets = [];

    for (let at = start; at < word; at++) {
        if (PUNCTUATION.test(text[at])) {
            offsets.push(at);
        }
    }

    if (offsets.length === 0) {
        return [];
    }

    return offsets.length > 1 ? [[offsets[0]], offsets] : [[offsets[0]]];
}

/**
 * [block] with a backslash written in at each of [offsets].
 *
 * Null where they fall outside the first run of the text: what opens a line is
 * what the first run holds, and rewriting further than that would take the
 * marks off the words it was carrying.
 *
 * @param {object} block - Block node, ProseMirror JSON
 * @param {number[]} offsets
 * @returns {object|null}
 */
export function escapedAt(block, offsets) {
    const content = block.content ?? [];
    const first = content[0];

    if (first?.type !== 'text' || offsets.at(-1) >= first.text.length) {
        return null;
    }

    let text = '';

    for (let at = 0; at < first.text.length; at++) {
        if (offsets.includes(at)) {
            text += '\\';
        }

        text += first.text[at];
    }

    return { ...block, content: [{ ...first, text }, ...content.slice(1)] };
}
