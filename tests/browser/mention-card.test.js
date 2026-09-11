import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { expect, it } from 'vitest';

import MentionCard from '../../components/surfaces/MentionCard.vue';

const Mark = defineComponent({ setup: () => () => h('svg', { width: 16, height: 16, 'data-mark': '' }) });

it('keeps the mark beside the first line of the title, however many follow', async () => {
    const card = mount(MentionCard, {
        attachTo: document.body,
        props: {
            shown: true,
            rect: { top: 10, left: 10, bottom: 30, right: 60, width: 50, height: 20, x: 10, y: 10 },
            preview: {
                title: 'KASC-5 un titre assez long pour tenir sur plusieurs lignes dans la carte',
                subtitle: 'Améliorer le rendu du flow',
                leading: Mark,
            },
        },
    });

    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const title = document.querySelector('[data-slot="editor-mention-preview-title"]');
    const mark = document.querySelector('[data-mark]').getBoundingClientRect();
    const [firstLine] = [...title.getClientRects()];
    const lines = Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight));

    expect(lines).toBeGreaterThan(1);
    expect(
        Math.abs(mark.top + mark.height / 2 - (firstLine.top + parseFloat(getComputedStyle(title).lineHeight) / 2))
    ).toBeLessThan(1.5);

    card.unmount();
});
