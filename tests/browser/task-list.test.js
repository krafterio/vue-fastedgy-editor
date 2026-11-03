import '../../styles/editor.css';

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createFetcher } from 'vue-fastedgy';
import { afterEach, describe, expect, it } from 'vitest';

import RichTextEditor from '../../components/RichTextEditor.vue';
import RichTextViewer from '../../components/RichTextViewer.vue';
import { createFeatures } from '../../features/registry.js';
import { todoListFeature } from '../../features/todo-list.js';

const mounted = [];

afterEach(() => {
    while (mounted.length > 0) {
        mounted.pop().unmount();
    }

    document.body.innerHTML = '';
});

const features = createFeatures([todoListFeature()]);

/** A task whose words are longer than the field is wide. */
const LONG = '- [x] dans `app/android/app/src/main/AndroidManifest.xml` et `docker/nginx/conf.d/default.conf.template`';

const RENDERINGS = {
    written: [RichTextEditor, { features, modelValue: LONG, editable: true }],
    read: [RichTextViewer, { features, value: LONG }],
};

describe('a task', () => {
    for (const [name, [component, props]] of Object.entries(RENDERINGS)) {
        it(`keeps its box square however long its words, ${name}`, async () => {
            const holder = document.createElement('div');

            holder.style.cssText = 'position:absolute;left:0;top:0;width:240px';
            document.body.append(holder);
            mounted.push(
                mount(component, { props, attachTo: holder, global: { plugins: [createPinia(), createFetcher()] } })
            );

            await expect.poll(() => holder.querySelector('[data-slot="editor-task-check"]')).not.toBeNull();

            const box = holder.querySelector('[data-slot="editor-task-check"]').getBoundingClientRect();

            expect(Math.round(box.width)).toBe(Math.round(box.height));
            expect(holder.scrollWidth).toBe(holder.clientWidth);
        });
    }
});
