/**
 * Whether [uri] may be followed, as tiptap's link decides it.
 *
 * @param {string|null|undefined} uri
 * @returns {boolean}
 */
export function isAllowedUri(uri: string | null | undefined): boolean;
/**
 * A link as a document holds one, and nothing to write one with.
 *
 * The very mark tiptap's link declares, as the core configures it: the same
 * attributes, the same addresses refused, drawn the same. What it leaves out is
 * what only writing needs, the commands, pasting an address onto words, and
 * the library that finds addresses in text: a reader that never writes loads
 * none of it. The link feature brings tiptap's own in its place.
 */
export const LinkMark: Mark<{
    HTMLAttributes: {
        target: string;
        rel: string;
        class: null;
    };
}, any>;
import { Mark } from '@tiptap/core';
//# sourceMappingURL=link.d.ts.map