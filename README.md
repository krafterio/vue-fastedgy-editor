# vue-fastedgy-editor

Rich text and document editor for FastEdgy applications, built on [Tiptap 3](https://tiptap.dev).

Documents are stored as markdown, in one exact form, so the same content can be written and read by
several clients of the same API without losing anything on the way.

## Install

```bash
npm install vue-fastedgy-editor
```

Tiptap and its extensions come with the package. Only `vue` is a peer dependency: the application
owns the framework, and there has to be a single instance of it.

## Development

```bash
npm install
npm test              # the corpus and the unit tests
npm run test:watch
npm run fcl           # fix, format, lint
npm run build         # the .d.ts, through vue-tsc
```

TypeScript is pinned to 6: it is the last line `vue-tsc` can run on. It stops at development, what
is published are the emitted types.

### Inside an application

```bash
cd <this package> && npm link
cd <the application> && npm link vue-fastedgy-editor
```

Then in the application's `vite.config.js`:

```js
optimizeDeps: { exclude: ['vue-fastedgy-editor'] },
resolve: { dedupe: ['vue', '@tiptap/core', '@tiptap/pm', '@tiptap/vue-3'] },
server: { fs: { allow: ['..', '<path to this package>'] } },
```

`dedupe` is what keeps a single Vue and a single ProseMirror around: a linked package otherwise
resolves its own copies, and neither `provide` / `inject` nor a Tiptap transaction survives that.

Run `npm unlink vue-fastedgy-editor` then `npm install` when you are done.

## License

MIT. `lowlight` pulls `highlight.js`, which is BSD-3-Clause.
