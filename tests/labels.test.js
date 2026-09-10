import { describe, expect, it, afterEach } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createI18nExtra, setI18n } from 'vue-fastedgy';

import { richTextLabels, richTextWords } from '../labels.js';

const application = (messages = {}) =>
    createI18n({
        legacy: false,
        locale: 'fr',
        fallbackLocale: 'fr',
        fallbackFormat: true,
        missingWarn: false,
        fallbackWarn: false,
        messages: { fr: messages },
    });

afterEach(() => setI18n(null));

describe('the words the editor says', () => {
    it('says the English itself where the application installed no i18n', () => {
        setI18n(null);

        expect(richTextLabels().bold).toBe('Bold');
    });

    it('speaks the language of the application without it writing a word', () => {
        createI18nExtra(application());

        const said = richTextLabels();

        expect(said.bold).toBe('Gras');
        expect(said.deleteColumn).toBe('Supprimer la colonne');
    });

    it('leaves the wording the application already has', () => {
        createI18nExtra(application({ Quote: 'Bloc de citation' }));

        expect(richTextLabels().quote).toBe('Bloc de citation');
    });

    it('is renamed name by name, the other names staying', () => {
        createI18nExtra(application());

        const said = richTextLabels({ open: 'Ouvrir la note' });

        expect(said.open).toBe('Ouvrir la note');
        expect(said.close).toBe('Fermer');
    });

    it('has a word for every name a surface asks for', () => {
        const asked = ['bold', 'heading1', 'todoList', 'open', 'close', 'addColumn', 'duplicateRow', 'language'];

        for (const name of asked) {
            expect(richTextWords[name]).toBeTypeOf('string');
        }
    });
});
