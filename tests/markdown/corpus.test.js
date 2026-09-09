/*
 * Copyright Krafter SAS <developer@krafter.io>
 * MIT License (see LICENSE file).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createFeatures } from '../../features/registry.js';
import { linkFeature } from '../../features/link.js';
import { plusUnderlineFeature } from '../../features/plus-underline.js';
import { createMarkdownCodec } from '../../markdown/codec.js';
import { outlineOf } from '../outline.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/markdown');
const codec = createMarkdownCodec(createFeatures([linkFeature(), plusUnderlineFeature()]));

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
describe('corpus canonique', () => {
    for (const name of fixturesIn(root)) {
        const { markdown, outline } = read(root, name);

        it(`${name} : la lecture donne le document attendu`, () => {
            expect(outlineOf(codec.decode(markdown))).toEqual(outline);
        });

        it(`${name} : l'écriture redonne la source`, () => {
            expect(codec.encode(codec.decode(markdown))).toBe(markdown);
        });

        it(`${name} : un second tour ne bouge plus`, () => {
            const once = codec.encode(codec.decode(markdown));

            expect(codec.encode(codec.decode(once))).toBe(once);
        });
    }
});

// What an older editor stored, or what somebody typed by hand: only ever read,
// never expected to come back as it went.
describe('corpus toléré', () => {
    for (const name of fixturesIn(`${root}/lenient`)) {
        const { markdown, outline } = read(`${root}/lenient`, name);

        it(`${name} : la lecture donne le document attendu`, () => {
            expect(outlineOf(codec.decode(markdown))).toEqual(outline);
        });

        it(`${name} : ce qui en est réécrit est stable`, () => {
            const once = codec.encode(codec.decode(markdown));

            expect(codec.encode(codec.decode(once))).toBe(once);
        });
    }
});
