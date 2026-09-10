import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { imageFeature } from '../../features/image.js';
import { linkFeature } from '../../features/link.js';
import { mentionFeature, pathAddressing } from '../../features/mention.js';
import { plusUnderlineFeature } from '../../features/plus-underline.js';
import { tableFeature } from '../../features/table.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { outlineOf } from '../outline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/markdown');
// The paths melimelo routes, which the corpus describes mentions with: without
// an addressing a mention is only a link, on either side.
const addressing = pathAddressing({ note: '/notes/{id}', user: '/household/members/{id}' });

const codec = createMarkdownCodec(
    createFeatures([
        tableFeature(),
        imageFeature(),
        linkFeature(),
        mentionFeature({ addressing }),
        plusUnderlineFeature(),
    ])
);

const fixturesIn = (folder) =>
    readdirSync(folder)
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.slice(0, -3))
        .sort();

const read = (folder, name) => ({
    markdown: readFileSync(`${folder}/${name}.md`, 'utf8'),
    outline: JSON.parse(readFileSync(`${folder}/${name}.outline.json`, 'utf8')),
});

// The shared corpus, maintained alongside the format and copied here verbatim.
// It is the only proof of parity: what is asserted below is asserted by every
// other implementation too, on the very same files.
describe('canonical corpus', () => {
    for (const name of fixturesIn(root)) {
        const { markdown, outline } = read(root, name);

        it(`${name}: reading gives the expected document`, () => {
            expect(outlineOf(codec.decode(markdown))).toEqual(outline);
        });

        it(`${name}: writing gives the source back`, () => {
            expect(codec.encode(codec.decode(markdown))).toBe(markdown);
        });

        it(`${name}: a second round moves nothing`, () => {
            const once = codec.encode(codec.decode(markdown));

            expect(codec.encode(codec.decode(once))).toBe(once);
        });
    }
});

// What an older editor stored, or what somebody typed by hand: only ever read,
// never expected to come back as it went.
describe('lenient corpus', () => {
    for (const name of fixturesIn(`${root}/lenient`)) {
        const { markdown, outline } = read(`${root}/lenient`, name);

        it(`${name}: reading gives the expected document`, () => {
            expect(outlineOf(codec.decode(markdown))).toEqual(outline);
        });

        it(`${name}: what is rewritten from it is stable`, () => {
            const once = codec.encode(codec.decode(markdown));

            expect(codec.encode(codec.decode(once))).toBe(once);
        });
    }
});
