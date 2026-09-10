import { describe, expect, it, vi } from 'vitest';

import { spillsInto } from '../../composables/editor.js';

const pressed = (key, { at = 0, text = 'un titre' } = {}) => ({
    key,
    target: { selectionStart: at, value: text },
    preventDefault: vi.fn(),
});

describe('a title spilling into the document below it', () => {
    it('takes the caret into the first block on enter, wherever the caret was', () => {
        const focus = vi.fn();
        const event = pressed('Enter', { at: 3 });

        spillsInto(() => ({ commands: { focus } }))(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(focus).toHaveBeenCalledWith('start');
    });

    it('takes it on the down arrow only from the end of the line', () => {
        const focus = vi.fn();
        const spills = spillsInto(() => ({ commands: { focus } }));

        // In the middle of a word, the arrow is moving through what is written.
        const inside = pressed('ArrowDown', { at: 3 });

        spills(inside);

        expect(inside.preventDefault).not.toHaveBeenCalled();
        expect(focus).not.toHaveBeenCalled();

        spills(pressed('ArrowDown', { at: 8 }));

        expect(focus).toHaveBeenCalledWith('start');
    });

    it('says nothing where there is no editor to spill into yet', () => {
        expect(() => spillsInto(() => null)(pressed('Enter'))).not.toThrow();
    });
});
