/**
 * Links, and the one thing markdown needs told about them.
 *
 * The mark itself belongs to the core schema, being one of the seven a run can
 * carry, and the core reads it. What the feature owns is the round trip, a link
 * whose address is its own text written bare, and the ways to write one: the
 * card that edits one, floating above the editor, where an address is filtered
 * on the way in, a document being a place people paste into and the schemes
 * that could run refused there as they are on the way out.
 *
 * @param {{ labels?: { address?: string, title?: string, apply?: string, open?: string, unlink?: string } }} [options]
 * @returns {import('./registry.js').RichTextFeature}
 */
export function linkFeature(options = {}) {
    return {
        name: 'link',
        markdown: { before: withoutSelfLinks, after: withWrittenSelfLinks },
        editing: () => import('./editing/link.js').then((module) => module.linkEditing(options)),
    };
}

/**
 * Drops the href of a run that links to its own text, so it is written bare.
 *
 * `[https://example.com](https://example.com)` and `https://example.com` are
 * read back as the very same document, markdown autolinking a plain URL, so the
 * long form carries nothing but noise into a field people and agents read.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @returns {object}
 */
export function withoutSelfLinks(doc) {
    return strip(doc);
}

/**
 * Gives an autolinked run back the address it was written with.
 *
 * A bare URL is turned into a link by the parser, which escapes the address on
 * the way: `https://a.fr/décoration` comes back with an href of
 * `https://a.fr/d%C3%A9coration`, and the document then holds an address nobody
 * wrote. The mirror of {@link withoutSelfLinks}, and what keeps a note the same
 * note on both sides.
 *
 * @param {object[]} blocks
 * @returns {object[]}
 */
export function withWrittenSelfLinks(blocks) {
    return blocks.map((block) => written(block));
}

function written(node) {
    if (!node || !Array.isArray(node.content)) {
        return node;
    }

    return {
        ...node,
        content: node.content.map((child) => (child.type === 'text' ? asWritten(child) : written(child))),
    };
}

function asWritten(run) {
    const marks = run.marks ?? [];
    const link = marks.find((mark) => mark.type === 'link');

    if (!link || link.attrs?.href === run.text || !sameAddress(run.text, link.attrs?.href ?? '')) {
        return run;
    }

    return {
        ...run,
        marks: marks.map((mark) => (mark === link ? { ...mark, attrs: { ...mark.attrs, href: run.text } } : mark)),
    };
}

function strip(node) {
    if (!node || !Array.isArray(node.content)) {
        return node;
    }

    return {
        ...node,
        content: node.content.map((child) => (child.type === 'text' ? bare(child) : strip(child))),
    };
}

/**
 * The same address, whichever way its letters were spelt.
 *
 * A URL is stored as it was typed and linked as the browser reads it, so
 * `https://a.fr/décoration` carries an href of `https://a.fr/d%C3%A9coration`
 * and the two are one address. Compared letter for letter, the link is not seen
 * as one on its own address, and the note is rewritten `[text](href)` on every
 * save.
 *
 * Decoded until it stops changing, because the two sides are not always encoded
 * the same number of times.
 */
function sameAddress(text, href) {
    return text === href || plain(text) === plain(href);
}

function plain(address) {
    let seen = address;

    // Bounded: a string of percent signs decodes for as long as it is fed.
    for (let pass = 0; pass < 4; pass++) {
        let decoded;

        try {
            decoded = decodeURI(seen);
        } catch {
            return seen;
        }

        if (decoded === seen) {
            return seen;
        }

        seen = decoded;
    }

    return seen;
}

function bare(run) {
    const marks = run.marks ?? [];

    if (!marks.some((mark) => mark.type === 'link' && sameAddress(run.text, mark.attrs?.href ?? ''))) {
        return run;
    }

    const kept = marks.filter((mark) => mark.type !== 'link');

    return { type: 'text', text: run.text, ...(kept.length > 0 ? { marks: kept } : {}) };
}
