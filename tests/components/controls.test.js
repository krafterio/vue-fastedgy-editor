import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import EditorButton from '../../components/controls/EditorButton.vue';
import EditorField from '../../components/controls/EditorField.vue';
import EditorMenu from '../../components/controls/EditorMenu.vue';
import EditorPlaceholder from '../../components/controls/EditorPlaceholder.vue';
import EditorTappable from '../../components/controls/EditorTappable.vue';
import { defaultRichTextControls, provideRichTextControls, useRichTextControls } from '../../composables/controls.js';
import { provideRichTextIcons, useRichTextIcons } from '../../composables/icons.js';

describe('the default bricks', () => {
    it('renders a tappable that says what it does and what it is', async () => {
        const onTap = vi.fn();
        const mounted = mount(EditorTappable, {
            props: { onTap, active: true, tooltip: 'Copier' },
            slots: { default: 'x' },
        });

        const tappable = mounted.find('button');

        // What reka's Toggle writes for a screen reader and for a stylesheet.
        expect(tappable.attributes('aria-pressed')).toBe('true');
        expect(tappable.attributes('data-state')).toBe('on');
        expect(tappable.attributes('aria-label')).toBe('Copier');

        await tappable.trigger('click');

        expect(onTap).toHaveBeenCalledOnce();
    });

    it('says what a button is for, never what it looks like', () => {
        const button = mount(EditorButton, { props: { label: 'Ouvrir', kind: 'primary' } });

        expect(button.attributes('data-kind')).toBe('primary');
        expect(button.attributes('class')).toBeUndefined();
        expect(button.text()).toBe('Ouvrir');
    });

    it('gives every field an identifier of its own', () => {
        // Two of them side by side, which is the only way the collision this
        // guards against ever happens.
        const both = mount(
            defineComponent({
                setup: () => () => h('div', [h(EditorField, { label: 'Adresse' }), h(EditorField, { label: 'Titre' })]),
            })
        );
        const [first, second] = both.findAll('label');

        expect(first.attributes('for')).not.toBe(second.attributes('for'));
        expect(both.findAll('input')[0].attributes('id')).toBe(first.attributes('for'));
    });

    it('writes into the field what is typed in it', async () => {
        const field = mount(EditorField, { props: { modelValue: '' } });

        await field.find('input').setValue('https://melimelo.app');

        expect(field.emitted('update:modelValue')?.at(-1)).toEqual(['https://melimelo.app']);
    });

    it('gives the skeleton the size it announced', () => {
        const placeholder = mount(EditorPlaceholder, { props: { width: 120, height: 12, radius: 6 } });

        expect(placeholder.attributes('style')).toContain('width: 120px');
        expect(placeholder.attributes('style')).toContain('height: 12px');
        expect(placeholder.attributes('aria-hidden')).toBe('true');
    });

    it('hangs the menu on whatever it is given', () => {
        const menu = mount(EditorMenu, {
            props: { actions: [{ label: 'Supprimer', destructive: true }], label: 'Actions' },
            slots: { default: '<span>⋮</span>' },
        });

        expect(menu.find('[data-slot="editor-menu"]').attributes('aria-label')).toBe('Actions');
        expect(menu.text()).toContain('⋮');
    });
});

describe('useRichTextControls', () => {
    const reading = defineComponent({
        setup() {
            const controls = useRichTextControls();

            return () => h('i', { 'data-names': Object.keys(controls).join(',') });
        },
    });

    it('answers the package set where an application lent nothing', () => {
        const mounted = mount(reading);

        expect(mounted.attributes('data-names').split(',').sort()).toEqual(Object.keys(defaultRichTextControls).sort());
    });

    it('replaces the brick it is given and keeps the other five', () => {
        const Own = defineComponent({ setup: () => () => h('b') });
        const lending = defineComponent({
            setup(_, { slots }) {
                provideRichTextControls({ button: Own });

                return () => slots.default?.();
            },
        });

        const seen = defineComponent({
            setup() {
                const controls = useRichTextControls();

                return () => h('i', { 'data-own': controls.button === Own, 'data-kept': controls.menu !== undefined });
            },
        });

        const mounted = mount(lending, { slots: { default: h(seen) } });

        expect(mounted.find('i').attributes('data-own')).toBe('true');
        expect(mounted.find('i').attributes('data-kept')).toBe('true');
    });
});

describe('what is lent stacks up', () => {
    const Own = defineComponent({ setup: () => () => h('b') });
    const Other = defineComponent({ setup: () => () => h('u') });

    const lending = (controls, icons) =>
        defineComponent({
            setup(_, { slots }) {
                provideRichTextControls(controls);
                provideRichTextIcons(icons);

                return () => slots.default?.();
            },
        });

    it('keeps what a level above already lent', () => {
        const seen = defineComponent({
            setup() {
                const controls = useRichTextControls();
                const { icon } = useRichTextIcons();

                return () =>
                    h('i', {
                        'data-button': controls.button === Own,
                        'data-field': controls.field === Other,
                        'data-copy': icon('copy') === Own,
                        'data-link': icon('link') === Other,
                    });
            },
        });

        const mounted = mount(lending({ button: Own }, { copy: Own }), {
            slots: { default: h(lending({ field: Other }, { link: Other }), null, { default: () => h(seen) }) },
        });

        const attributes = mounted.find('i').attributes();

        expect([attributes['data-button'], attributes['data-field']]).toEqual(['true', 'true']);
        expect([attributes['data-copy'], attributes['data-link']]).toEqual(['true', 'true']);
    });
});
