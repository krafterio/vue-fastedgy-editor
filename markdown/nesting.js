/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

/**
 * How far one level of nesting is written in.
 *
 * Four spaces, which is what markdown itself indents with, and which nothing of
 * ours can be mistaken for: a code block is always written fenced, so an
 * indented line never means code here, it means a block belonging to the one
 * above it.
 */
export const INDENT_STEP = 4;

/**
 * Writes one block per chunk, each indented to the level it sits at.
 *
 * @param {Array<{ markdown: string, indent: number }>} chunks
 * @returns {string}
 */
export function joinChunks(chunks) {
    return chunks
        .map(({ markdown, indent }) => indented(markdown.trim(), indent))
        .filter((markdown) => markdown.length > 0)
        .join('\n\n');
}

/**
 * Reads back what {@link joinChunks} wrote.
 *
 * A blank line ends a chunk, and so does a change of depth. A fence is the
 * exception: everything up to its closing line belongs to it whatever it looks
 * like, or a blank line inside a code sample would cut it in two.
 *
 * @param {string} source
 * @returns {Array<{ markdown: string, indent: number }>}
 */
export function splitChunks(source) {
    const chunks = [];
    let lines = [];
    let indent = 0;
    let fenced = false;

    const flush = () => {
        while (lines.length > 0 && lines.at(-1).trim().length === 0) {
            lines.pop();
        }

        if (lines.length > 0) {
            chunks.push({ markdown: lines.join('\n'), indent });
        }

        lines = [];
    };

    for (const line of source.split('\n')) {
        if (fenced) {
            const body = dedented(line, indent);

            lines.push(body);
            fenced = !body.trimStart().startsWith('```');

            continue;
        }

        if (line.trim().length === 0) {
            flush();

            continue;
        }

        const at = depthOf(line);

        if (lines.length === 0) {
            indent = at;
        } else if (at !== indent) {
            flush();
            indent = at;
        }

        const body = dedented(line, indent);

        lines.push(body);
        fenced = body.trimStart().startsWith('```');
    }

    flush();

    return chunks;
}

/**
 * The nearest chunk above [indent] that something at [indent] hangs off, which
 * is how the flat file becomes a tree again wherever a caller wants one.
 *
 * @param {Map<number, any>} open - Last block seen at each depth
 * @param {number} indent
 * @returns {any} - Null where nothing above it holds it
 */
export function parentOf(open, indent) {
    for (let at = indent - 1; at >= 0; at--) {
        if (open.has(at)) {
            return open.get(at);
        }
    }

    return null;
}

function indented(markdown, indent) {
    if (indent <= 0) {
        return markdown;
    }

    const padding = ' '.repeat(INDENT_STEP * indent);

    return markdown
        .split('\n')
        .map((line) => (line.length === 0 ? line : `${padding}${line}`))
        .join('\n');
}

/**
 * How deep [line] is written in.
 *
 * A tab counts for a level of its own: it is what an earlier version of the
 * format wrote nesting with, so a document stored before that reads back as the
 * tree it was rather than as one paragraph holding its children's text. Read
 * that way only, never written.
 */
function depthOf(line) {
    const padding = ' '.repeat(INDENT_STEP);
    let depth = 0;
    let index = 0;

    while (index < line.length) {
        if (line[index] === '\t') {
            depth++;
            index++;
        } else if (line.startsWith(padding, index)) {
            depth++;
            index += INDENT_STEP;
        } else {
            break;
        }
    }

    return depth;
}

function dedented(line, indent) {
    const padding = ' '.repeat(INDENT_STEP);
    let index = 0;

    for (let level = 0; level < indent && index < line.length; level++) {
        if (line[index] === '\t') {
            index++;
        } else if (line.startsWith(padding, index)) {
            index += INDENT_STEP;
        } else {
            break;
        }
    }

    return line.slice(index);
}
