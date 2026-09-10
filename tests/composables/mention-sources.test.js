import { describe, expect, it, vi } from 'vitest';

import { modelMentionSource } from '../../composables/mention-sources.js';

const rows = [
    { id: 7, title: 'Courses', list: { name: 'Général' }, updated_at: '2026-09-10' },
    { id: 9, title: '', list: null, updated_at: null },
];

function sourceOf(over = {}) {
    const list = vi.fn(async () => ({ data: { items: rows } }));
    const get = vi.fn(async (id) => ({ data: rows.find((row) => row.id === id) ?? null }));

    const source = modelMentionSource({
        apiModel: { list, get },
        model: 'note',
        trigger: '$',
        fields: ['id', 'title', 'list.name'],
        label: (note) => note.title || 'Sans titre',
        subtitle: (note) => note.list?.name ?? null,
        ...over,
    });

    return { source, list, get };
}

describe('a mention over a model', () => {
    it('offers what the model answers, said the way it was asked to be', async () => {
        const { source, list } = sourceOf();

        expect(await source.search('cour')).toEqual([
            { id: 7, label: 'Courses', subtitle: 'Général' },
            { id: 9, label: 'Sans titre', subtitle: null },
        ]);

        expect(list).toHaveBeenCalledWith({
            fields: ['id', 'title', 'list.name'],
            filter: [['search_value', 'search_fuzzy', 'cour']],
            orderBy: undefined,
            size: 20,
        });
    });

    it('asks for no rule at all on an empty query, which is the whole list', async () => {
        const { source, list } = sourceOf();

        await source.search('   ');

        expect(list.mock.calls.at(-1)?.[0].filter).toEqual([]);
    });

    it('takes the rules a caller writes over its own', async () => {
        const { source, list } = sourceOf({ filter: (query) => [['title', 'ilike', `%${query}%`]] });

        await source.search('cour');

        expect(list.mock.calls.at(-1)?.[0].filter).toEqual([['title', 'ilike', '%cour%']]);
    });

    it('reads one row back for the card, with what it was told to say of it', async () => {
        const { source } = sourceOf({ facts: (note) => [['Modifiée', note.updated_at ?? '']] });

        expect(await source.preview(7)).toEqual({
            title: 'Courses',
            subtitle: 'Général',
            facts: [['Modifiée', '2026-09-10']],
        });
    });

    it('says nothing of a record that is gone', async () => {
        const { source } = sourceOf();

        expect(await source.preview(404)).toBeNull();
    });
});
