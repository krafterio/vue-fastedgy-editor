import { h } from 'vue';

import { codeBlockLanguages } from '../features/code-block.js';

/**
 * Code, coloured the way the editor colours it.
 *
 * The same grammars and the same class names as `codeBlockLowlight`, so a block
 * read looks like the block written. Highlighting is asked for rather than done
 * on its own: a viewer that showed a hundred previews would otherwise parse a
 * hundred snippets nobody is reading.
 *
 * @param {any} lowlight - A registry, built and registered by the caller
 * @returns {(text: string, language: string|null) => any}
 */
export function highlightedCode(lowlight) {
    return (text, language) => {
        const known = language && codeBlockLanguages.includes(language) ? language : null;

        try {
            const tree = known
                ? lowlight.highlight(known === 'vue' ? 'xml' : known, text)
                : lowlight.highlightAuto(text);

            return tree.children.map(nodeOf);
        } catch {
            // A grammar that will not load says nothing about the code it was
            // given: drawn plain is drawn, and drawn is what matters.
            return text;
        }
    };
}

function nodeOf(node) {
    if (node.type === 'text') {
        return node.value;
    }

    return h(
        node.tagName ?? 'span',
        { class: node.properties?.className?.join(' ') },
        (node.children ?? []).map(nodeOf)
    );
}
