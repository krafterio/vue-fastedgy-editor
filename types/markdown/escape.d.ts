/**
 * [text] as markdown will hand it back: the characters an escape stands for, and
 * the backslashes that stand for nothing left where they are.
 *
 * @param {string} text
 * @returns {string}
 */
export function unescaped(text: string): string;
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
export function escapeOffsets(text: string): number[][];
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
export function escapedAt(block: object, offsets: number[]): object | null;
//# sourceMappingURL=escape.d.ts.map