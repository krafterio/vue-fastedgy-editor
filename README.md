# vue-fastedgy-editor

Rich text and document editor for FastEdgy applications, built on [Tiptap 3](https://tiptap.dev).

Documents are stored as markdown, in one exact form, so the same content can be written and read by
several clients of the same API without losing anything on the way. What is written in an editor
reads the same, pixel for pixel, in a viewer that mounts no editor at all.

## Install

```bash
npm install vue-fastedgy-editor
```

Tiptap, ProseMirror, the markdown parser and the highlighter come with the package. The application
owns what has to exist once:

| Peer | Why |
|---|---|
| `vue` ≥ 3.5 | the framework |
| `reka-ui` | the controls the package ships behind its injectable bricks |
| `vue-fastedgy` | the fetcher, storage and i18n the pictures, mentions and words go through |
| `@lucide/vue` | optional, for the glyph set in `vue-fastedgy-editor/icons/lucide` |

Load the stylesheet once:

```js
import 'vue-fastedgy-editor/styles.css';
```

## Editors and viewers

| Component | What it is |
|---|---|
| `DocumentEditor` | a page: blocks with a gutter to drag them by, an optional cover, the "/" menu |
| `RichTextEditor` | a field: the same text, no gutter, `submit` on Enter |
| `DocumentViewer` | a page read, no editor mounted |
| `RichTextViewer` | a field read, no editor mounted |
| `RichTextActionBar` | the formatting strip, docked where the application wants it |

```vue
<script setup>
import { createFeatures, DocumentEditor, linkFeature, RichTextViewer, todoListFeature } from 'vue-fastedgy-editor';

// Once, at module level: every editor and viewer of the application shares it.
const features = createFeatures([todoListFeature(), linkFeature()]);
</script>

<template>
    <DocumentEditor v-model="note.content" :features="features" @ready="(editor) => (body = editor)" />

    <RichTextViewer :value="message.content" :features="features" />
</template>
```

The editors take `v-model` (markdown), `features`, `editable`, `labels`, `emptyPlaceholder` and
`hintPlaceholder`, and three sizing modes: `minHeight` / `maxHeight`, or `fill` to take a bounded
container's height. `DocumentEditor` takes `flush` to sit in a column of the application's: no margin of
its own, the blocks aligned on the column and the gutter hanging outside it. `RichTextEditor` adds `maxWidth`, `resetWhenEmpty` and the `submit` event, held
back while a mention is being picked or the caret is in a code block. `DocumentEditor` adds the
cover: `v-model:cover` (a stored path), `pickFile` and `storeCover(file, onProgress)`. Both emit
`ready` with the Tiptap editor, and take `slashMenu: false` or `formatBubble: false` to go without
either.

The viewers take `value` (markdown or a decoded document) and the same `features`, `labels` and sizing
props, so a screen switched from one to the other keeps its size. `DocumentViewer` takes `cover`.

An editor is built once what its features need to write is loaded (see below). Until then it draws the
document read, the very same page, placeholder included: a heavy document shows at once, and the
editor takes its place without anything moving.

## Features

A feature is everything a kind of block needs, declared once and read by the editors and the viewers
alike. `createFeatures([])` is plain markdown: paragraphs, headings, lists, tasks, quotes, rules,
code blocks, links and the seven inline marks, all of them read and drawn. The core writes
paragraphs, headings, lists, quotes, rules and marks; tasks, code blocks and links are written with
their feature.

| Feature | What it adds | Options |
|---|---|---|
| `todoListFeature()` | the checkbox drawn by the theme, the ways to write a list | |
| `codeBlockFeature()` | colours, a copy button, a language picker while writing | `languages`, `guess`, `offered`, `labels` |
| `tableFeature()` | column widths, handles to add and remove rows and columns | `defaultColumnWidth`, `labels` |
| `imageFeature()` | sized pictures, pasted, dropped or picked, shown at full size on a click | `pickFile`, `store`, `open`, `viewer`, `labels` |
| `linkFeature()` | the card that edits a link, `Mod-k`, a link to its own text written bare | `labels` |
| `mentionFeature()` | chips written as plain links, a list per trigger, a card on a click | `addressing`, `sources`, `open`, `labels` |
| `plusUnderlineFeature()` | reads `++text++` as underline, on top of `<u>` | |

Leave a feature out and nothing of it is loaded: a document holding a code block still reads, drawn
plain, when `codeBlockFeature` is not there.

What a feature needs only to write (commands, input rules, menus, popovers, the clipboard) is loaded
by the first editor built with it, and never by a page that only reads. Pictures shown at full size and
mention cards load on the first click.

**Code blocks** are coloured in a dozen common languages by default, loaded the first time a block is
drawn, once for the application. `languages` takes grammars instead, and only those are bundled:

```js
import javascript from 'highlight.js/lib/languages/javascript';
import { all } from 'lowlight';

codeBlockFeature({ languages: { javascript } }); // one
codeBlockFeature({ languages: all }); // every one there is
codeBlockFeature({ offered: false }); // read, never created
```

`features.ready()` settles once what the features load to draw is there, for whatever has to compare
or print a document with its colours.

**Mentions** read the application's routes through `addressing` (`pathAddressing({ note:
'/notes/{id}' })`) and search through `sources`, one per trigger. `modelMentionSource()` builds one
from a FastEdgy api model:

```js
mentionFeature({
    addressing: pathAddressing({ note: '/notes/{id}', user: '/members/{id}' }),
    sources: [modelMentionSource({ apiModel: useApiModel('note'), model: 'note', trigger: '$', fields: ['id', 'title'], label: (note) => note.title })],
    open: (record) => router.push({ name: 'Note', params: { id: record.id } }),
});
```

**Pictures** are stored beside the record: `useInlineImageStore({ model, recordId, field })` answers
the `store` an image feature takes. A picture written before the record exists travels inline and is
stored at the next save.

## Reading many documents

A viewer mounts no editor, and draws a message in about a millisecond. For a thread of them:

- pass every viewer the **same** `features` object, so the schema and the codec are built once;
- virtualise the list past a few hundred messages, with heights measured rather than assumed: a
  picture written without its size (`![](…?w=420&h=280)`) takes its height when it loads.

## Written here and elsewhere

A document saved while it is being typed, and changed by somebody else meanwhile, keeps what everybody
wrote. `useMergedDocument` holds what the server holds and writes back what comes from it as a
difference, the caret staying where it is:

```js
const body = useMergedDocument(toRef(form, 'content'));

body.hold(record.content); // opened

if (body.changed()) {
    const sent = form.content;
    const stored = (await api.save(id, { content: sent })).content;

    body.answered(sent, stored); // what the server rewrote of what was sent, written into what was typed since
}

body.absorb(fresh.content); // another version, merged three ways into what is on screen
```

Hearing that another version exists is the application's: with FastEdgy's realtime, a
`useResourceChanged` listener that skips its own saves by `originId` and reads the record again.
`mergeMarkdown(base, theirs, ours)` is the merge underneath, for whoever needs it alone.

## Look and words

Everything is drawn from CSS variables that fall back on the shadcn tokens of the same meaning
(`--foreground`, `--muted-foreground`, `--card`, `--muted`, `--border`, `--primary`, `--accent`,
`--destructive`): an application with its own tokens gets an editor in its colours, and its dark mode
along with them. A `--fe-editor-*` variable set where the stylesheet declares it, on `.fe-editor` and
on the floating surfaces reka teleports to the body, dresses editors and viewers together, in one
rule.

The six bricks the package draws with, and its glyphs, can be lent by the application:

```js
import { provideRichTextControls, provideRichTextIcons } from 'vue-fastedgy-editor';
import { lucideRichTextIcons } from 'vue-fastedgy-editor/icons/lucide';

provideRichTextControls({ tappable: MyButton, picker: MySelect }); // any of tappable, picker, button, field, menu, placeholder
provideRichTextIcons(lucideRichTextIcons);
```

Words are English keys translated through the application's i18n, French shipped. `labels` renames
any of them, name by name.

## Markdown

```js
import { createFeatures, createMarkdownCodec, linkFeature } from 'vue-fastedgy-editor';

const codec = createMarkdownCodec(createFeatures([linkFeature()]));

const doc = codec.decode(record.content); // markdown -> document
const markdown = codec.encode(doc); // document -> markdown
```

A codec carries what its features carry. The editors and viewers build theirs from `features`; pass
`codec` to either to store something else.

## Development

```bash
npm install
npx playwright install chromium   # once, for the browser tests
npm test                          # the unit tests, then the browser tests
npm run test:unit                 # the corpus and the unit tests, in jsdom
npm run test:browser              # pixel parity of editors and viewers, in Chromium
npm run fcl                       # fix, format, lint
npm run build                     # the .d.ts, through vue-tsc
```

The browser tests draw every kind of block written, locked and read, in the light and dark themes and
under every kind of decoration, and compare them element by element and pixel by pixel.

TypeScript is pinned to 6: it is the last line `vue-tsc` can run on. It stops at development, what
is published are the emitted types.

### Inside an application

The package ships its `.vue` source, which the dependency optimizer cannot pre-bundle. The
application's `vite.config.js` excludes it, and pre-bundles in its place each module it imports, as
it imports it (`highlight.js/lib/core`, not `highlight.js`), or those are served raw:

```js
optimizeDeps: {
    exclude: ['vue-fastedgy-editor'],
    include: [/* the bare specifiers the package's source imports */],
},
resolve: { dedupe: ['vue', 'reka-ui', 'vue-fastedgy'] },
```

Read the list from the package's source rather than keeping it by hand: melimelo's `web/vite.config.js`
derives it, and the rest, from its `package.json`.

To work on the package from an application:

```bash
cd <this package> && npm link
cd <the application> && npm link vue-fastedgy-editor
```

`dedupe` is what keeps a single Vue and a single reka around: a linked package otherwise resolves its
own copies, and `provide` / `inject` no longer crosses between them. Run `npm unlink
vue-fastedgy-editor` then `npm install` when you are done.

### The corpus

`tests/fixtures/markdown/` is the specification of the stored format, copied in verbatim from where
that format is defined. **Do not edit it here**, and do not let a formatter touch it: every case is
read, written back and compared byte for byte, by this package and by every other implementation, on
the very same files.

A difference found against another implementation becomes a fixture first and a fix second.

## License

MIT. `lowlight` pulls `highlight.js`, which is BSD-3-Clause.
