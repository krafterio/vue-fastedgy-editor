import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import TaskItemView from '../components/blocks/TaskItemView.vue';

/**
 * Checkable items, `- [ ] ` and `- [x] `.
 *
 * Both directions of markdown already live in the core codec, task items being
 * one of the eleven blocks it writes and reads. What this adds is the pair of
 * nodes a document needs to hold one, and nothing else.
 *
 * Nesting is off on purpose: a document is flat here, and depth is the `indent`
 * attribute the whole schema shares. A task item that could hold a sublist would
 * be a second way of saying the same thing, and the one markdown cannot express.
 *
 * The box is drawn from the theme rather than by the browser, as it is on the
 * mobile side: a document draws its own furniture.
 *
 * @returns {import('./registry.js').RichTextFeature}
 */
export function todoListFeature() {
    return {
        name: 'todoList',
        extensions: [
            TaskList,
            TaskItem.extend({
                addNodeView() {
                    return VueNodeViewRenderer(TaskItemView);
                },
            }).configure({ nested: false }),
        ],

        // The block is the feature's, so what offers it is too: the core menu
        // knows nothing of a list that may not be mounted.
        menuItems: [
            {
                name: 'todoList',
                glyph: 'todoList',
                keywords: ['todo', 'task', 'checkbox', 'case', '[]'],
                run: (editor) => editor.chain().focus().toggleTaskList().run(),
            },
        ],

        // Beside the two other lists, which the core offers: the three stand
        // together on a strip, and a document without this feature simply shows
        // two.
        actions: [
            {
                name: 'todoList',
                glyph: 'todoList',
                group: 2,
                isActive: (editor) => editor.isActive('taskList'),
                isEnabled: (editor) => editor.isEditable,
                run: (editor) => editor.chain().focus().toggleTaskList().run(),
            },
        ],
    };
}
