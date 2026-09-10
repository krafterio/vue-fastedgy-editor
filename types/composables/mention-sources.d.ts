/**
 * A mention over a model, said as what it shows rather than as how it is read.
 *
 * Every model-backed source is the same two requests — list what matches what is
 * being typed, read one row back for the card — and the same handful of
 * decisions: which fields, what a row is called, what is written under it. Said
 * once here, a source is the four lines that are really its own.
 *
 * @param {object} options
 * @param {{ list: Function, get: Function }} options.apiModel - `useApiModel('note')`
 * @param {string} options.model - The metadata name, as an address carries it
 * @param {string} options.trigger - What arms it, `@` or `$`
 * @param {string[]} options.fields - What both requests read, `id` included
 * @param {(record: object) => string} options.label - What a row is called
 * @param {(record: object) => string|null} [options.subtitle] - Written under it
 * @param {(record: object) => any} [options.leading] - A **component**, never a
 *   built node
 * @param {(record: object) => Array<[string, string]>} [options.facts] - What the
 *   card says of the record, label and value
 * @param {(query: string) => any[]} [options.filter] - The rules a search sends;
 *   a fuzzy search on what is typed, and nothing at all on an empty query
 * @param {string} [options.orderBy]
 * @param {number} [options.limit]
 * @param {string} [options.glyph]
 * @param {number} [options.priority] - Which trigger wins where two could
 * @param {boolean} [options.openable] - Whether the card carries the way there
 * @returns {object} - A source, as `mentionFeature` takes them
 */
export function modelMentionSource(options: {
    apiModel: {
        list: Function;
        get: Function;
    };
    model: string;
    trigger: string;
    fields: string[];
    label: (record: object) => string;
    subtitle?: ((record: object) => string | null) | undefined;
    leading?: ((record: object) => any) | undefined;
    facts?: ((record: object) => Array<[string, string]>) | undefined;
    filter?: ((query: string) => any[]) | undefined;
    orderBy?: string | undefined;
    limit?: number | undefined;
    glyph?: string | undefined;
    priority?: number | undefined;
    openable?: boolean | undefined;
}): object;
//# sourceMappingURL=mention-sources.d.ts.map