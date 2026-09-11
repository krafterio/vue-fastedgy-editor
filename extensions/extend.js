/**
 * [extension] extended by [config], each field it leaves alone left to the
 * extension it came from.
 *
 * tiptap 3 copies what an extension declares onto the one made of it, and binds
 * each copy with the original as its parent: a field that adds to its parent's
 * adds its share once more at every level. A code block extended by its feature
 * and again by the component that draws it laid its colours three times, three
 * highlighters running at every keystroke. Handed back to the parent, a field
 * the extension did not write runs once, as it did before tiptap 3.
 *
 * @param {any} extension
 * @param {Record<string, any>} config
 * @returns {any}
 */
export function extendedOnce(extension, config) {
    const extended = extension.extend(config);

    for (const [field, value] of Object.entries(extended.config)) {
        if (typeof value === 'function' && !(field in config) && value === extension.config[field]) {
            delete extended.config[field];
        }
    }

    return extended;
}
