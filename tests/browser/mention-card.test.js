import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { expect, it } from 'vitest';

import MentionCard from '../../components/surfaces/MentionCard.vue';

const Mark = defineComponent({ setup: () => () => h('svg', { width: 16, height: 16, 'data-mark': '' }) });

/** The middle of the letters on a line: a box an x-height tall, sat on the baseline. */
function inkCentreOf(element) {
    const probe = document.createElement('span');

    probe.style.cssText = 'display:inline-block;width:1px;height:1ex;vertical-align:baseline';
    element.prepend(probe);

    const { bottom, height } = probe.getBoundingClientRect();

    probe.remove();

    return bottom - height / 2;
}

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
    const lines = Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight));

    expect(lines).toBeGreaterThan(1);
    // Level with the letters of the first line, not with the box holding them.
    expect(Math.abs(mark.top + mark.height / 2 - inkCentreOf(title))).toBeLessThan(0.6);

    card.unmount();
});

it('floats at the layer of a dialog, so one written from inside a dialog stands above it', async () => {
    const card = mount(MentionCard, {
        attachTo: document.body,
        props: {
            shown: true,
            rect: { top: 10, left: 10, bottom: 30, right: 60, width: 50, height: 20, x: 10, y: 10 },
            preview: { title: 'KASC-5' },
        },
    });

    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // reka lifts the fixed wrapper it portals to the layer of what it wraps.
    expect(getComputedStyle(document.querySelector('[data-reka-popper-content-wrapper]')).zIndex).toBe('50');

    card.unmount();
});
