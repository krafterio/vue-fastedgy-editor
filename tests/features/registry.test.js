import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';

const feature = (name, extra = {}) => ({ name, ...extra });

describe('createFeatures', () => {
    it('sorts menu entries by group, then by the order they were declared in', () => {
        const set = createFeatures([
            feature('mention', { menuGroup: 1, menuItems: ['mention'] }),
            feature('table', { menuItems: ['table'] }),
            feature('image', { menuItems: ['image'] }),
        ]);

        expect(set.menuItems).toEqual(['table', 'image', 'mention']);
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

    it('holds Enter as soon as a single feature holds it', () => {
        const set = createFeatures([feature('a'), feature('b', { holdsEnter: () => true })]);

        expect(set.holdsEnter({})).toBe(true);
        expect(createFeatures([feature('a')]).holdsEnter({})).toBe(false);
    });
});
