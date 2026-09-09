/**
 * Reads `++text++` as underline, the spelling Quill and Fleather write.
 *
 * One way on purpose, where a codec insists both directions travel together: the
 * package writes underline as `<u>` and goes on writing it that way. What this
 * adds is a second spelling accepted on the way in, so a field filled by another
 * editor reads as what it says instead of showing its markers, and comes back
 * written the one way the moment it is saved.
 *
 * Only worth listing where such a field exists. An application that has always
 * written its markdown with this package has nothing to read that it did not
 * write itself.
 *
 * @returns {import('./registry.js').RichTextFeature}
 */
export function plusUnderlineFeature(): import("./registry.js").RichTextFeature;
//# sourceMappingURL=plus-underline.d.ts.map