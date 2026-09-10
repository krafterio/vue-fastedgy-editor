/**
 * A mention, as the chip it is edited as.
 *
 * It carries what the address is made of rather than the address itself: a
 * record moved elsewhere is the same record, and the paths belong to the
 * application (cf `features/mention.js`). The label is stored too, or the
 * markdown could not be written back.
 */
export const RecordMention: import("@tiptap/core").Node<import("@tiptap/extension-mention").MentionOptions<any, import("@tiptap/extension-mention").MentionNodeAttrs>, any>;
//# sourceMappingURL=mention.d.ts.map