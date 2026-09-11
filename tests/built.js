import { nextTick } from 'vue';
import { vi } from 'vitest';

import { richTextEditorExtensions } from '../extensions/editing.js';

/**
 * Until the editor [wrapper] mounts is built.
 *
 * An editor waits for what only writing needs, which its features load on
 * demand, and draws the document read in the meantime: a test that writes has
 * to wait for the page it can write in.
 *
 * @param {import('@vue/test-utils').VueWrapper} wrapper
 */
export async function built(wrapper) {
    await vi.waitFor(
        () => {
            if (!wrapper.find('.ProseMirror[contenteditable]').exists()) {
                throw new Error('The editor is still being built');
            }
        },
        { interval: 1 }
    );

    await nextTick();
}

/**
 * What an editor of [features] is built from, once what only writing needs is
 * loaded: for a test that builds its editor itself.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {Promise<any[]>}
 */
export async function editorExtensionsOf(features) {
    return richTextEditorExtensions(features, await features.editing());
}
