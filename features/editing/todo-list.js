import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

/**
 * What writes a to-do list: the nodes as tiptap writes them, in place of the
 * ones the core reads, and the entries that make one.
 *
 * @returns {import('../registry.js').RichTextEditing}
 */
export function todoListEditing() {
    return {
        extensions: [TaskList, TaskItem.configure({ nested: false })],

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
