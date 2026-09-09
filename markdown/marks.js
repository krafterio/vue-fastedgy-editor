/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

/** What a mark is written with in markdown, and what a space next to it kills. */
const MARK_KEYS = new Set(['bold', 'italic', 'underline', 'strike', 'code']);

const LEADING = /^\s+/;
const TRAILING = /\s+$/;

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
export function spaceOutsideMarks(doc) {
    return walk(doc);
}

function walk(node) {
    if (!node || typeof node !== 'object') {
        return node;
    }

    if (!Array.isArray(node.content)) {
        return node;
    }

    const content = node.content.flatMap((child) => (child.type === 'text' ? spaced(child) : [walk(child)]));

    return { ...node, content };
}

/**
 * One run as the blanks around its words leave it: up to three, and itself when
 * there is nothing to move.
 */
function spaced(run) {
    const marks = run.marks ?? [];

    if (typeof run.text !== 'string' || !marks.some((mark) => MARK_KEYS.has(mark.type))) {
        return [run];
    }

    const lead = LEADING.exec(run.text)?.[0] ?? '';
    const trail = run.text.length > lead.length ? (TRAILING.exec(run.text)?.[0] ?? '') : '';

    if (lead.length === 0 && trail.length === 0) {
        return [run];
    }

    const core = run.text.slice(lead.length, run.text.length - trail.length);
    // What the blanks keep: a link still covers them, a mark no longer does.
    // Marking a space says nothing and costs a pair of markers.
    const around = marks.filter((mark) => !MARK_KEYS.has(mark.type));
    const make = (text, carried) => ({
        type: 'text',
        text,
        ...(carried.length > 0 ? { marks: carried } : {}),
    });

    return [
        ...(lead.length > 0 ? [make(lead, around)] : []),
        ...(core.length > 0 ? [make(core, marks)] : []),
        ...(trail.length > 0 ? [make(trail, around)] : []),
    ];
}
