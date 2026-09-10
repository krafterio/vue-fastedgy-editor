/**
 * Mentions, written as the plain links they are stored as.
 *
 * Markdown has no inline object, and it should not: the field is read by the
 * agent and by everything else that touches it, and a link is something they all
 * understand. The chip is how a mention is *edited*, not how it is kept.
 *
 * A label is escaped rather than stripped, so a name comes back the name it was.
 * Without it, an email in a name, which is what a member with no name is called,
 * is pulled out as a `mailto:` of its own, and a bracket closes the link early
 * and takes the record with it.
 *
 * @param {object} [options]
 * @param {{ encode: (record: { model: string, id: number }) => string|null, decode: (address: string) => { model: string, id: number }|null }} [options.addressing]
 *   Where a mention points, in the shape the application routes. Mounted without
 *   one, mentions still draw and still write their label: nothing here decides
 *   what a path looks like.
 * @param {Array<{ trigger: string, model: string, search: (query: string) => Promise<Array<{ id: number, label: string, subtitle?: string, leading?: import('vue').Component }>>, preview?: (id: number) => Promise<{ title: string, subtitle?: string, leading?: import('vue').Component, facts?: Array<[string, string]> }|null>, openable?: boolean, onMention?: (candidate: object) => void }>} [options.sources]
 *   One per kind of mention: what arms it, what record it writes, and what it
 *   offers. A trigger with no source behind it is never armed, and `openable`
 *   is what puts the way there on the card of a record that has one. A `leading`
 *   is a **component**, never a built node: what draws a candidate is rendered
 *   where it is shown, and the same node cannot be in two places at once.
 * @param {(record: { model: string, id: number }) => void} [options.open]
 *   What a chip opens, a route on the web.
 * @returns {import('./registry.js').RichTextFeature}
 */
export function mentionFeature(options?: {
    addressing?: {
        encode: (record: {
            model: string;
            id: number;
        }) => string | null;
        decode: (address: string) => {
            model: string;
            id: number;
        } | null;
    } | undefined;
    sources?: {
        trigger: string;
        model: string;
        search: (query: string) => Promise<Array<{
            id: number;
            label: string;
            subtitle?: string;
            leading?: import("vue").Component;
        }>>;
        preview?: (id: number) => Promise<{
            title: string;
            subtitle?: string;
            leading?: import("vue").Component;
            facts?: Array<[string, string]>;
        } | null>;
        openable?: boolean;
        onMention?: (candidate: object) => void;
    }[] | undefined;
    open?: ((record: {
        model: string;
        id: number;
    }) => void) | undefined;
}): import("./registry.js").RichTextFeature;
/**
 * Paths written and read the one way, from the table an application declares.
 *
 * A URI carrying a scheme is refused, an address being a route inside this
 * application and not somewhere else, and the identifier is the last segment.
 *
 * @param {Record<string, string>} paths - By model, `/notes/{id}` shaped
 * @returns {{ encode: (record: { model: string, id: number }) => string|null, decode: (address: string) => { model: string, id: number }|null }}
 */
export function pathAddressing(paths: Record<string, string>): {
    encode: (record: {
        model: string;
        id: number;
    }) => string | null;
    decode: (address: string) => {
        model: string;
        id: number;
    } | null;
};
/**
 * Every mention turned into the link it is written as.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {object|null} addressing
 * @returns {object}
 */
export function mentionsAsLinks(doc: object, addressing: object | null): object;
/**
 * Every link that points at a record turned back into the mention it was.
 *
 * The mirror of {@link mentionsAsLinks}, and the reason a mention survives a
 * round trip at all. A link to anywhere else stays a link.
 *
 * @param {object[]} blocks
 * @param {object|null} addressing
 * @returns {object[]}
 */
export function linksAsMentions(blocks: object[], addressing: object | null): object[];
//# sourceMappingURL=mention.d.ts.map