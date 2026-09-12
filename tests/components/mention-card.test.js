import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import MentionCard from '../../components/surfaces/MentionCard.vue';

const nowhere = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0 };

async function cardWith(preview) {
    const card = mount(MentionCard, { attachTo: document.body, props: { shown: true, rect: nowhere, preview } });

    await nextTick();

    return card;
}

const inBody = (selector) => document.querySelector(selector);

describe('a mention card', () => {
    it('says what any record has when the application draws nothing', async () => {
        const card = await cardWith({ title: 'test 3', subtitle: 'KASC-6', facts: [['Due date', '30 Jul. 2026']] });

        expect(inBody('[data-slot="editor-mention-preview-title"]').textContent).toBe('test 3');
        expect(inBody('[data-slot="editor-mention-preview-subtitle"]').textContent).toBe('KASC-6');
        expect(inBody('[data-slot="editor-mention-preview-facts"]').textContent).toContain('30 Jul. 2026');

        card.unmount();
    });

    it('hands the card over to the application that brought one', async () => {
        const card = await cardWith({
            title: 'test 3',
            facts: [['Due date', '30 Jul. 2026']],
            card: () => h('div', { 'data-own': '' }, 'drawn here'),
        });

        expect(inBody('[data-own]').textContent).toBe('drawn here');
        expect(inBody('[data-slot="editor-mention-preview-title"]')).toBeNull();
        expect(inBody('[data-slot="editor-mention-preview-facts"]')).toBeNull();

        card.unmount();
    });

    it('keeps the way there under a card the application drew', async () => {
        const card = mount(MentionCard, {
            attachTo: document.body,
            props: {
                shown: true,
                rect: nowhere,
                action: true,
                labels: { open: 'Open' },
                preview: { card: () => h('div', 'drawn here') },
            },
        });

        await nextTick();

        expect(inBody('[data-slot="editor-mention-preview-action"]')).not.toBeNull();

        card.unmount();
    });
});
