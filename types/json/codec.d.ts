/**
 * The other way a field holds a document: the node tree as it stands.
 *
 * Markdown is what a field stores when it has to stay readable and editable
 * elsewhere, by a server, an agent, or another client. JSON is what one stores
 * when it only has to come back exactly as it went: nothing has to be taught to
 * it, so it carries any block, any attribute and any feature without knowing
 * what they are.
 *
 * The two invariants are the markdown codec's, and for the same reasons: a
 * cleared field writes `''` rather than a blank block, and reading never answers
 * a document with no block, which renders as a dead zone with nothing to click
 * and nothing to type into.
 *
 * @returns {{ encode: (doc: object) => string, decode: (source: string|null) => object }}
 */
export function createJsonCodec(): {
    encode: (doc: object) => string;
    decode: (source: string | null) => object;
};
//# sourceMappingURL=codec.d.ts.map