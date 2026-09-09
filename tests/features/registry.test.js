/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';

const feature = (name, extra = {}) => ({ name, ...extra });

describe('createFeatures', () => {
    it('classe les entrées de menu par groupe, puis par ordre de déclaration', () => {
        const set = createFeatures([
            feature('mention', { menuGroup: 1, menuItems: ['mention'] }),
            feature('table', { menuItems: ['table'] }),
            feature('image', { menuItems: ['image'] }),
        ]);

        expect(set.menuItems).toEqual(['table', 'image', 'mention']);
    });

    it('laisse la dernière feature déclarée gagner un type de noeud', () => {
        const set = createFeatures([
            feature('link', { markdown: { encoders: { text: () => 'lien' } } }),
            feature('mention', { markdown: { encoders: { text: () => 'mention' } } }),
        ]);

        expect(set.encoders.text()).toBe('mention');
    });

    it('rejoue les passes de lecture dans l ordre inverse de celles d écriture', () => {
        const trace = [];
        const set = createFeatures([
            feature('a', { markdown: { before: (d) => (trace.push('a>'), d), after: (d) => (trace.push('a<'), d) } }),
            feature('b', { markdown: { before: (d) => (trace.push('b>'), d), after: (d) => (trace.push('b<'), d) } }),
        ]);

        set.before({});
        set.after([]);

        expect(trace).toEqual(['a>', 'b>', 'b<', 'a<']);
    });

    it('retire ce qu on nomme, des deux sens à la fois', () => {
        const set = createFeatures([
            feature('image', { markdown: { encoders: { image: () => '' } } }),
            feature('link'),
        ]);

        expect(Object.keys(set.without('image').encoders)).toEqual([]);
        expect(set.without('image').features.map((one) => one.name)).toEqual(['link']);
    });

    it('tient Entrée dès qu une seule feature la tient', () => {
        const set = createFeatures([feature('a'), feature('b', { holdsEnter: () => true })]);

        expect(set.holdsEnter({})).toBe(true);
        expect(createFeatures([feature('a')]).holdsEnter({})).toBe(false);
    });
});
