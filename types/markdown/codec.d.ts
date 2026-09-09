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
export function createMarkdownCodec(features?: ReturnType<typeof createFeatures>): {
    encode: (doc: object) => string;
    decode: (source: string | null) => object;
};
import { createFeatures } from '../features/registry.js';
//# sourceMappingURL=codec.d.ts.map