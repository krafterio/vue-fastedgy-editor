/** A word character, before which `++` is the two characters it looks like. */
const WORD = /[\p{L}\p{N}]/u;

/**
 * Reads `++text++` as underline, the spelling Quill and Fleather write.
 *
 * One way on purpose, where a codec insists both directions travel together: the
 * package writes underline as `<u>` and goes on writing it that way. What this
 * adds is a second spelling accepted on the way in, so a field filled by another
 * editor reads as what it says instead of showing its markers, and comes back
 * written the one way the moment it is saved.
 *
 * Only worth listing where such a field exists. An application that has always
 * written its markdown with this package has nothing to read that it did not
 * write itself.
 *
 * @returns {import('./registry.js').RichTextFeature}
 */
export function plusUnderlineFeature() {
    return {
        name: 'plusUnderline',
        markdown: {
            inlineRules: [(md) => md.inline.ruler.before('emphasis', 'underline_plus', underlinePlus)],
        },
    };
}

function underlinePlus(state, silent) {
    const { src, pos } = state;

    // Markers glued to a word are the characters they look like: `C++ and C++`
    // is a sentence about a language, not an underlined `and`.
    if (!src.startsWith('++', pos) || (pos > 0 && WORD.test(src[pos - 1]))) {
        return false;
    }

    const end = src.indexOf('++', pos + 2);
    const inner = end < 0 ? '' : src.slice(pos + 2, end);

    if (inner.length === 0 || inner.includes('\n')) {
        return false;
    }

    if (!silent) {
        state.push('u_open', 'u', 1);
        state.md.inline.parse(inner, state.md, state.env, state.tokens);
        state.push('u_close', 'u', -1);
    }

    state.pos = end + 2;

    return true;
}
