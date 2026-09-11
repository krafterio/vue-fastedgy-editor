import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { actionsOf, menuItemsOf } from '../../menu/core.js';

const feature = (name, extra = {}) => ({ name, ...extra });

/** A feature whose writing is [part], loaded as a feature's is, later. */
const writing = (name, part) => feature(name, { editing: async () => part });

describe('createFeatures', () => {
    it('leaves out of the menu and the strip what a feature stands in for', async () => {
        const headings = ['heading1', 'heading2', 'heading3'];
        const editing = await createFeatures([
            { name: 'plain', editing: () => ({ replacesMenuItems: headings, replacesActions: headings }) },
        ]).editing();

        expect(menuItemsOf(editing).map((entry) => entry.name)).not.toContain('heading1');
        expect(actionsOf(editing).map((entry) => entry.name)).not.toContain('heading2');
        expect(actionsOf(editing).map((entry) => entry.name)).toContain('bold');
    });

    it('sorts menu entries by group, then by the order they were declared in', async () => {
        const set = createFeatures([
            writing('mention', { menuGroup: 1, menuItems: ['mention'] }),
            writing('table', { menuItems: ['table'] }),
            writing('image', { menuItems: ['image'] }),
        ]);

        expect((await set.editing()).menuItems).toEqual(['table', 'image', 'mention']);
    });

    it('loads what writing needs once for a set, and only when it is asked for', async () => {
        let loaded = 0;
        const set = createFeatures([feature('a', { editing: async () => (loaded++, {}) })]);

        expect(loaded).toBe(0);

        await Promise.all([set.editing(), set.editing()]);

        expect(loaded).toBe(1);
    });

    it('lets the last feature declared win a node type', () => {
        const set = createFeatures([
            feature('link', { markdown: { encoders: { text: () => 'lien' } } }),
            feature('mention', { markdown: { encoders: { text: () => 'mention' } } }),
        ]);

        expect(set.encoders.text()).toBe('mention');
    });

    it('replays the reading passes in the reverse order of the writing ones', () => {
        const trace = [];
        const set = createFeatures([
            feature('a', { markdown: { before: (d) => (trace.push('a>'), d), after: (d) => (trace.push('a<'), d) } }),
            feature('b', { markdown: { before: (d) => (trace.push('b>'), d), after: (d) => (trace.push('b<'), d) } }),
        ]);

        set.before({});
        set.after([]);

        expect(trace).toEqual(['a>', 'b>', 'b<', 'a<']);
    });

    it('drops what it is asked to, both directions at once', () => {
        const set = createFeatures([
            feature('image', { markdown: { encoders: { image: () => '' } } }),
            feature('link'),
        ]);

        expect(Object.keys(set.without('image').encoders)).toEqual([]);
        expect(set.without('image').features.map((one) => one.name)).toEqual(['link']);
    });

    it('holds Enter as soon as a single feature holds it', async () => {
        const set = createFeatures([feature('a'), writing('b', { holdsEnter: () => true })]);

        expect((await set.editing()).holdsEnter({})).toBe(true);
        expect((await createFeatures([feature('a')]).editing()).holdsEnter({})).toBe(false);
    });
});
