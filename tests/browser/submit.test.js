import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createFetcher } from 'vue-fastedgy';
import { defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import RichTextEditor from '../../components/RichTextEditor.vue';
import { createFeatures } from '../../features/registry.js';

const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }
});

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A field that sends on Enter the way a thread does: locked while the server
 * answers, emptied once it has, unlocked for the next message.
 */
function thread() {
    const sent = [];
    const draft = ref('');
    const sending = ref(false);

    async function send(markdown) {
        sent.push(markdown);
        sending.value = true;
        await pause(50);
        draft.value = '';
        sending.value = false;
    }

    const Thread = defineComponent({
        setup: () => () =>
            h(RichTextEditor, {
                modelValue: draft.value,
                'onUpdate:modelValue': (value) => (draft.value = value),
                features: createFeatures([]),
                editable: !sending.value,
                resetWhenEmpty: true,
                onSubmit: send,
            }),
    });

    mounted.push(mount(Thread, { attachTo: document.body, global: { plugins: [createPinia(), createFetcher()] } }));

    return { sent, draft };
}

describe('a field sent with Enter, in a browser', () => {
    it('sends what was written, without the line Enter would have opened', async () => {
        const { sent } = thread();

        await pause(200);
        await userEvent.click(document.querySelector('.ProseMirror'));
        await userEvent.keyboard('Test 18{Enter}');

        expect(sent).toEqual(['Test 18']);
    });

    it('stays empty once the answer unlocks it', async () => {
        const { draft } = thread();

        await pause(200);
        await userEvent.click(document.querySelector('.ProseMirror'));
        await userEvent.keyboard('Test 18{Enter}');
        await pause(200);
        await nextTick();

        expect(draft.value).toBe('');
        expect(document.querySelector('.ProseMirror').textContent).toBe('');
    });
});
