import { Editor, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { describe, expect, it } from 'vitest';

import { extendedOnce } from '../../extensions/extend.js';
import { richTextEditorExtensions } from '../../extensions/editing.js';
import { codeBlockFeature } from '../../features/code-block.js';
import { createFeatures } from '../../features/registry.js';

const pluginsOf = (extensions) => {
    const editor = new Editor({ extensions });
    const keys = editor.state.plugins.map((plugin) => plugin.key);

    editor.destroy();

    return keys;
};

describe('extendedOnce', () => {
    // A field adding to its parent's, as a code block's colours are added.
    const Adding = Extension.create({
        name: 'adding',
        addProseMirrorPlugins() {
            return [...(this.parent?.() ?? []), new Plugin({ key: new PluginKey('added') })];
        },
    });

    const added = async (extension) => {
        const features = createFeatures([]);
        const extensions = richTextEditorExtensions(features, await features.editing());

        return pluginsOf([...extensions, extension]).filter((key) => key.startsWith('added'));
    };

    it('adds a field it leaves alone once, however many times it is extended', async () => {
        const twice = extendedOnce(extendedOnce(Adding, { addOptions: () => ({ a: 1 }) }), {
            addOptions: () => ({ b: 1 }),
        });

        expect(await added(twice)).toHaveLength(1);
    });

    it('lays the colours of a code block once, its feature, its editing and its component extending it', async () => {
        const features = createFeatures([codeBlockFeature()]);
        const keys = pluginsOf(richTextEditorExtensions(features, await features.editing()));

        expect(keys.filter((key) => key.startsWith('lowlight'))).toHaveLength(1);
    });
});
