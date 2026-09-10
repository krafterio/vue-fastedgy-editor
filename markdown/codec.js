import { createFeatures } from '../features/registry.js';
import { createParser, decodeChunk, decodeDocument } from './decode.js';
import { encodeDocument } from './encode.js';

/**
 * How a document is stored and read back, the two directions always together, so
 * a format can never be taught to write something it cannot read.
 *
 * What a codec can carry is what the caller listed. There is no default set, and
 * deliberately: a different one in each application would mean a different round
 * trip, and a mention or an image would come back as nothing with no error
 * anywhere. Pass `createFeatures([])` for the plain markdown the codec knows on
 * its own.
 *
 * @param {ReturnType<typeof createFeatures>} [features]
 * @returns {{ encode: (doc: object) => string, decode: (source: string|null) => object }}
 */
export function createMarkdownCodec(features = createFeatures([])) {
    const parser = createParser({ inlineRules: features.inlineRules });
    const chunk = (markdown) => decodeChunk(markdown, { parser, features });

    return {
        encode: (doc) => encodeDocument(doc, { features, decodeChunk: chunk }),
        decode: (source) => decodeDocument(source, { parser, features }),
    };
}
