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
export function highlightedCode(lowlight: any): (text: string, language: string | null) => any;
//# sourceMappingURL=highlight.d.ts.map