import { defineAsyncComponent, inject, markRaw, provide } from 'vue';

import EditorButton from '../components/controls/EditorButton.vue';
import EditorField from '../components/controls/EditorField.vue';
import EditorPlaceholder from '../components/controls/EditorPlaceholder.vue';
import EditorTappable from '../components/controls/EditorTappable.vue';

/**
 * The two bricks only writing draws, loaded the first time one is: what floats
 * and what it floats with stay out of a page that only reads.
 */
const EditorMenu = markRaw(defineAsyncComponent(() => import('../components/controls/EditorMenu.vue')));
const EditorPicker = markRaw(defineAsyncComponent(() => import('../components/controls/EditorPicker.vue')));

const CONTROLS = Symbol('fe-rich-text-controls');

/**
 * The six bricks a document draws its own furniture with.
 *
 * Each one is an intention, never an appearance: `kind` says what a button is
 * for, `tooltip` what a tappable means, and neither says how it looks. What
 * ships here carries the behaviour and none of the looks, so an application
 * dresses the brick it cares about and leaves the other five alone.
 */
export const defaultRichTextControls = Object.freeze({
    tappable: EditorTappable,
    picker: EditorPicker,
    button: EditorButton,
    field: EditorField,
    menu: EditorMenu,
    placeholder: EditorPlaceholder,
});

/**
 * Lends [controls] to everything mounted under here, brick by brick.
 *
 * It **adds to** what is already lent rather than replacing it: a package that
 * dresses two bricks and an application that dresses a third stack up, and the
 * nearer one wins a brick they both dress.
 *
 * @param {Partial<typeof defaultRichTextControls>} [controls]
 */
export function provideRichTextControls(controls = {}) {
    provide(CONTROLS, { ...inject(CONTROLS, defaultRichTextControls), ...controls });
}

/**
 * The bricks in force, whether an application lent any or not.
 *
 * Stateless on purpose: what has state is the editor, and an editor hands its
 * own to its own subtree. Two editors on a page share these and share nothing
 * else.
 *
 * @returns {typeof defaultRichTextControls}
 */
export function useRichTextControls() {
    return inject(CONTROLS, defaultRichTextControls);
}
