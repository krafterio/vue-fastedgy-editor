import Mention from '@tiptap/extension-mention';

import { extendedOnce } from './extend.js';
import { MENTION } from './mention.js';

/**
 * A mention as it is written: tiptap's own, its suggestions included, drawn and
 * stored as the node a document reads (cf `mention.js`).
 */
export const RecordMention = extendedOnce(Mention, MENTION);
