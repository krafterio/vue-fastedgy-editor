/**
 * Stores a document's pictures as attachments of the record it belongs to,
 * marked as part of [field]'s text.
 *
 * Generic on purpose: an attachment points at its record through a generic
 * reference, so nothing here knows what a note is. Anything holding rich text
 * gives its own model and field and gets the same behaviour.
 *
 * [recordId] is read **on every call** rather than captured: a screen builds its
 * features once, while the record it shows may still be loading. Answering
 * `null` leaves the picture as a `data:` URI in the text, and the server stores
 * it at the next save — which is how a record that has no id yet can hold one.
 *
 * @param {{ model: string, recordId: () => number|string|null, field: string }} options
 * @returns {(file: File) => Promise<number|null>} - What `imageFeature` takes as
 *   its `store`
 */
export function useInlineImageStore({ model, recordId, field }: {
    model: string;
    recordId: () => number | string | null;
    field: string;
}): (file: File) => Promise<number | null>;
//# sourceMappingURL=inline-images.d.ts.map