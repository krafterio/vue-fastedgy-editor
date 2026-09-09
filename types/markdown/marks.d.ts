/**
 * Takes the blanks out of what is marked, and puts them back around it.
 *
 * Markdown opens a mark on the character that follows it, and `** x**` opens
 * nothing at all: the parser wants a non-blank on the inside. Bold a run a
 * writer selected with the space before it, which is what a double click gives,
 * and the markers land against that space, so the text comes back with its
 * stars in it and no bold anywhere. It reads as a broken editor, and it is the
 * round trip that is broken.
 *
 * `**` around ` x ` becomes ` **x** `: the same words, the same emphasis, and
 * markdown able to say it.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object}
 */
export function spaceOutsideMarks(doc: object): object;
//# sourceMappingURL=marks.d.ts.map