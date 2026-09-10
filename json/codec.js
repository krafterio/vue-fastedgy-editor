import { blankDocument } from '../markdown/decode.js';
import { isCleared } from '../markdown/encode.js';

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
export function createJsonCodec() {
    return {
        encode: (doc) => (isCleared(doc) ? '' : JSON.stringify(doc)),

        decode(source) {
            if (typeof source !== 'string' || source.trim().length === 0) {
                return blankDocument();
            }

            try {
                const document = JSON.parse(source);

                return (document?.content ?? []).length === 0 ? blankDocument() : document;
            } catch {
                // What cannot be read is what somebody else wrote, or what was
                // cut in half on its way here. A blank document keeps the field
                // usable; throwing here would leave a screen with no editor.
                return blankDocument();
            }
        },
    };
}
