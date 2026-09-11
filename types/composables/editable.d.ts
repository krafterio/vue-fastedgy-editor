/**
 * Whether [editor] can be written, followed as it changes.
 *
 * A node view is drawn again when its node changes, not when its editor is
 * locked or unlocked: read once, a tool for writing would stay on a document
 * nobody can write in. Locking an editor announces an update, as every change
 * does, and that is what is listened to. A reader has nothing to follow.
 *
 * @param {{ isEditable: boolean, on?: Function, off?: Function }} editor
 * @returns {import('vue').Ref<boolean>}
 */
export function useEditable(editor: {
    isEditable: boolean;
    on?: Function;
    off?: Function;
}): import("vue").Ref<boolean>;
//# sourceMappingURL=editable.d.ts.map