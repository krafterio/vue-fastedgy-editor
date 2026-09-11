import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import EditorPicker from '../../components/controls/EditorPicker.vue';

const options = [
    { value: 'dart', label: 'Dart' },
    { value: 'python', label: 'Python' },
];

/** The options a picker has built, wherever reka keeps them while it is closed. */
async function builtOptions(props) {
    let built = 0;
    const picker = mount(EditorPicker, {
        props: { options, selected: 'dart', ...props },
        attachTo: document.body,
        global: { stubs: { SelectItemText: { setup: () => (built++, () => null) } } },
    });

    await nextTick();
    await nextTick();
    picker.unmount();

    return built;
}

describe('EditorPicker', () => {
    it('builds its options closed when it has only them to say what is chosen', async () => {
        expect(await builtOptions({})).toBe(options.length);
    });

    it('builds none of them closed when it is told what it shows', async () => {
        expect(await builtOptions({ shown: 'Dart' })).toBe(0);
    });

    it('offers every option once opened, told what it shows or not', async () => {
        const picker = mount(EditorPicker, {
            props: { options, selected: 'dart', shown: 'Dart' },
            attachTo: document.body,
        });

        await picker.get('[data-slot="editor-picker"]').trigger('keydown', { key: 'Enter' });
        await nextTick();
        await nextTick();

        expect([...document.body.querySelectorAll('[role="option"]')].map((option) => option.textContent)).toEqual([
            'Dart',
            'Python',
        ]);

        picker.unmount();
    });
});
