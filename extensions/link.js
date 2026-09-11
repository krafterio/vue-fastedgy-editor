import { Mark, mergeAttributes } from '@tiptap/core';

/** What an address may not hide its scheme behind, as tiptap's link reads it. */
const WHITE_SPACE = /[\0- \xA0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

/** Where tiptap's link lets an address lead, when no scheme was added to it. */
const SCHEMES = ['http', 'https', 'ftp', 'ftps', 'mailto', 'tel', 'callto', 'sms', 'cid', 'xmpp'];

const ALLOWED = new RegExp(`^(?:(?:${SCHEMES.join('|')}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`, 'i');

/**
 * Whether [uri] may be followed, as tiptap's link decides it.
 *
 * @param {string|null|undefined} uri
 * @returns {boolean}
 */
export function isAllowedUri(uri) {
    return !uri || ALLOWED.test(uri.replace(WHITE_SPACE, ''));
}

/**
 * A link as a document holds one, and nothing to write one with.
 *
 * The very mark tiptap's link declares, as the core configures it: the same
 * attributes, the same addresses refused, drawn the same. What it leaves out is
 * what only writing needs, the commands, pasting an address onto words, and
 * the library that finds addresses in text: a reader that never writes loads
 * none of it. The link feature brings tiptap's own in its place.
 */
export const LinkMark = Mark.create({
    name: 'link',
    priority: 1000,
    keepOnSplit: false,
    exitable: true,
    inclusive: () => false,

    addOptions() {
        return {
            HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow', class: null },
        };
    },

    addAttributes() {
        return {
            href: { default: null, parseHTML: (element) => element.getAttribute('href') },
            target: { default: this.options.HTMLAttributes.target ?? null },
            rel: { default: this.options.HTMLAttributes.rel ?? null },
            class: { default: this.options.HTMLAttributes.class ?? null },
            title: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'a[href]',
                getAttrs: (dom) => {
                    const href = dom.getAttribute('href');

                    return href && isAllowedUri(href) ? null : false;
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const attributes = isAllowedUri(HTMLAttributes.href) ? HTMLAttributes : { ...HTMLAttributes, href: '' };

        return ['a', mergeAttributes(this.options.HTMLAttributes, attributes), 0];
    },
});
