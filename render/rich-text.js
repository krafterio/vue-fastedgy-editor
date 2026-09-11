import {
    getAttributesFromExtensions,
    getExtensionField,
    getRenderedAttributes,
    getSchemaByResolvedExtensions,
    resolveExtensions,
} from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';
import { defineComponent, h, provide, ref } from 'vue';

import { HELD_CONTENT } from '../components/internal/BlockContent.js';
import { richTextExtensions } from '../extensions/schema.js';
import { createMarkdownCodec } from '../markdown/codec.js';

/**
 * What a component drawing a node is told of the editor, where there is none.
 *
 * The block components read one thing of it while they render, whether it can
 * be edited, and everything else only once somebody acts on them — which, read,
 * nobody can.
 */
const READ_ONLY = Object.freeze({ isEditable: false });

/**
 * A document drawn by what draws it in the editor, and by nothing else.
 *
 * ProseMirror's model, not its view: the schema is built from the extensions
 * the editor is built from, the document is read into it, and each node and
 * each mark is drawn by the schema's own `toDOM`, the function the editor's view
 * calls. What no view means is no selection, no input, no plugin: an editor is
 * the view, and none is mounted.
 *
 * What the features draw otherwise, they say, and it is applied here without
 * this file knowing a single node by its name:
 *
 * - `views`, the components drawing a node, mounted here with nothing to edit.
 *
 * And what an extension draws itself is asked of it here as the editor's view
 * asks: the node view it builds, a task item or a table, and the decorations its
 * plugins lay, a code block's colours.

 *
 * What ProseMirror adds of its own is added too: the break that holds an empty
 * line open.
 *
 * @param {ReturnType<import('../features/registry.js').createFeatures>} features
 * @returns {{ schema: any, codec: ReturnType<typeof createMarkdownCodec>, draw: (doc: object) => any[] }}
 */
export function createRichTextReader(features) {
    if (!readers.has(features)) {
        readers.set(features, readerOf(features));
    }

    return readers.get(features);
}

/**
 * One reader per set of features, whoever asks.
 *
 * A schema is built by resolving every extension and a codec holds a markdown
 * parser, and a list of fifty previews is fifty viewers of one set: built once,
 * they are read fifty times.
 */
const readers = new WeakMap();

function readerOf(features) {
    const extensions = resolveExtensions(richTextExtensions(features));
    const schema = getSchemaByResolvedExtensions(extensions);

    const context = {
        views: features.views,
        nodeViews: nodeViewsOf(extensions, features.views, schema),
        decorating: decoratingOf(extensions, schema),
        decorated: [],
        extensions,
    };

    return {
        schema,
        codec: createMarkdownCodec(features),

        /**
         * @param {object} doc - ProseMirror JSON
         * @returns {any[]}
         */
        draw: (doc) => {
            const read = documentOf(schema, doc);

            return childrenOf(read, { ...context, decorated: decorationsOf(read, context.decorating) }, 0);
        },
    };
}

/**
 * The document, or what the editor makes of one its schema cannot hold: an
 * empty page, said out loud, rather than a page drawn that the editor would
 * refuse to open.
 */
function documentOf(schema, doc) {
    try {
        return schema.nodeFromJSON(doc);
    } catch (failure) {
        console.warn('A document holds what none of the features reads, and is drawn empty.', failure);

        return schema.nodeFromJSON({ type: 'doc', content: [{ type: 'paragraph' }] });
    }
}

/**
 * The node views the extensions build themselves, asked for the way the editor
 * asks for them, of an editor nobody can write in: a task item, a table. A
 * component a feature draws with is not among them; it is mounted as it is.
 */
function nodeViewsOf(extensions, views, schema) {
    const attributes = getAttributesFromExtensions(extensions);
    const built = {};

    for (const extension of extensions) {
        if (extension.type !== 'node' || views[extension.name]) {
            continue;
        }

        const addNodeView = getExtensionField(extension, 'addNodeView', {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
            editor: READ_ONLY,
            type: schema.nodes[extension.name],
        });

        // Asked twice, as tiptap asks: for the factory, then of each node.
        const make = addNodeView?.();

        if (make) {
            built[extension.name] = (node) =>
                make({
                    node,
                    view: READ_ONLY,
                    getPos: () => undefined,
                    decorations: [],
                    innerDecorations: [],
                    editor: READ_ONLY,
                    extension,
                    HTMLAttributes: getRenderedAttributes(node, attributes),
                });
        }
    }

    return built;
}

/**
 * The plugins that lay decorations, as the extensions build them for an editor
 * nobody can write in: those of a code block's colours among them.
 */
function decoratingOf(extensions, schema) {
    return extensions.flatMap((extension) => {
        const addProseMirrorPlugins = getExtensionField(extension, 'addProseMirrorPlugins', {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
            editor: READ_ONLY,
            type: schema.nodes[extension.name] ?? schema.marks[extension.name] ?? null,
        });

        return (addProseMirrorPlugins?.() ?? []).filter((plugin) => plugin.props.decorations);
    });
}

/**
 * What those plugins lay over [doc], asked of them as the editor's view asks:
 * of a state holding the document, which is data, and no view at all.
 */
function decorationsOf(doc, decorating) {
    if (decorating.length === 0) {
        return [];
    }

    const state = EditorState.create({ doc, plugins: decorating });

    return decorating.map((plugin) => plugin.props.decorations.call(plugin, state)).filter((set) => set?.find);
}

/** The inline decorations over the content of a textblock starting at [start]. */
function laidOver(node, start, context) {
    return context.decorated
        .flatMap((set) => set.find(start, start + node.content.size))
        .filter((decoration) => decoration.inline)
        .map((decoration) => ({
            from: decoration.from - start,
            to: decoration.to - start,
            attrs: decoration.type.attrs,
        }))
        .sort((a, b) => a.from - b.from);
}

function childrenOf(node, context, start) {
    const drawn = [];

    node.forEach((child, offset) => drawn.push(nodeOf(child, context, start + offset)));

    return drawn;
}

function nodeOf(node, context, position) {
    const name = node.type.name;

    if (context.views[name]) {
        return h(ReadNodeView, {
            view: context.views[name],
            node,
            position,
            extension: context.extensions.find((extension) => extension.name === name) ?? null,
            context,
        });
    }

    if (context.nodeViews[name]) {
        const built = context.nodeViews[name](node);

        return fromDom(built.dom, built.contentDOM ?? null, () => contentOf(node, context, position));
    }

    return fromSpec(node.type.spec.toDOM(node), () => contentOf(node, context, position));
}

/** What a node at [position] holds: blocks, or the line of a textblock. */
function contentOf(node, context, position) {
    return node.isTextblock
        ? withTrailingBreak(inlineOf(node, context, position + 1), node)
        : childrenOf(node, context, position + 1);
}

/**
 * The inline content of a textblock, each mark drawn once around every node it
 * spans, as ProseMirror nests them: `**a *b* c**` is one `strong` holding an
 * `em`, not three `strong`. Decorations sit inside the marks, around the text
 * they cover, as ProseMirror lays them.
 */
function inlineOf(node, context, start) {
    const decorations = laidOver(node, start, context);
    const root = { children: [] };
    const open = [];
    const top = () => open.at(-1) ?? root;

    const close = () => {
        const { mark, children } = open.pop();

        top().children.push(fromSpec(mark.type.spec.toDOM(mark, true), () => children));
    };

    node.forEach((child, offset) => {
        let kept = 0;

        while (kept < open.length && kept < child.marks.length && open[kept].mark.eq(child.marks[kept])) {
            kept++;
        }

        while (open.length > kept) {
            close();
        }

        for (const mark of child.marks.slice(kept)) {
            open.push({ mark, children: [] });
        }

        top().children.push(
            ...(child.isText ? decorated(child.text, offset, decorations) : [nodeOf(child, context, start + offset)])
        );
    });

    while (open.length > 0) {
        close();
    }

    return root.children;
}

/**
 * A run of text cut where decorations start and end, each covered piece in the
 * element its decoration names, `span` unless it says otherwise.
 */
function decorated(text, start, decorations) {
    const drawn = [];
    let at = start;
    const end = start + text.length;

    for (const decoration of decorations) {
        const from = Math.max(decoration.from, at);
        const to = Math.min(decoration.to, end);

        if (to <= from) {
            continue;
        }

        if (from > at) {
            drawn.push(text.slice(at - start, from - start));
        }

        const { nodeName = 'span', ...attrs } = decoration.attrs ?? {};

        drawn.push(h(nodeName, attrs, text.slice(from - start, to - start)));
        at = to;
    }

    if (at < end) {
        drawn.push(text.slice(at - start));
    }

    return drawn;
}

/**
 * The break ProseMirror puts at the end of a line that would otherwise draw no
 * height: an empty one, one ending on something that is not text, one ending
 * on a line feed. Without it an empty paragraph read is an empty paragraph
 * collapsed, and everything below it moves up.
 */
function withTrailingBreak(drawn, node) {
    const last = node.lastChild;

    if (!last || !last.isText || last.text.endsWith('\n')) {
        drawn.push(h('br', { class: 'ProseMirror-trailingBreak' }));
    }

    return drawn;
}

/**
 * A component drawing a node, mounted as the editor mounts it and handed the
 * same things, with nothing to edit.
 */
const ReadNodeView = defineComponent({
    name: 'ReadNodeView',

    props: {
        view: { type: [Object, Function], required: true },
        node: { type: Object, required: true },
        position: { type: Number, required: true },
        extension: { type: Object, default: null },
        context: { type: Object, required: true },
    },

    setup(props) {
        // What `NodeViewWrapper` reads: nothing to drag, and no decoration.
        provide('onDragStart', () => {});
        provide('decorationClasses', ref(''));
        provide(HELD_CONTENT, () => contentOf(props.node, props.context, props.position));

        return () =>
            h(props.view, {
                editor: READ_ONLY,
                node: props.node,
                decorations: [],
                innerDecorations: [],
                view: READ_ONLY,
                selected: false,
                extension: { name: props.extension?.name, options: props.extension?.options ?? {}, storage: {} },
                HTMLAttributes: {},
                getPos: () => undefined,
                updateAttributes: () => {},
                deleteNode: () => {},
            });
    },
});

/**
 * What a `toDOM` answers, as Vue draws it.
 *
 * The reading ProseMirror's serializer makes: a tag, attributes when the second
 * entry is a plain object, children, and `0` for where the content goes.
 */
function fromSpec(spec, content) {
    if (typeof spec === 'string') {
        return spec;
    }

    if (spec?.nodeType !== undefined) {
        return fromDom(spec, null, content);
    }

    if (spec?.dom) {
        return fromDom(spec.dom, spec.contentDOM ?? null, content);
    }

    const [tag, ...rest] = spec;
    const attributes =
        rest.length > 0 &&
        rest[0] &&
        typeof rest[0] === 'object' &&
        !Array.isArray(rest[0]) &&
        rest[0].nodeType === undefined
            ? rest.shift()
            : {};

    const children = rest.flatMap((child) => (child === 0 ? content() : [fromSpec(child, content)]));

    return h(tag.includes(' ') ? tag.split(' ')[1] : tag, present(attributes), children);
}

/** A built element, as Vue draws it, [hole] being where the content goes. */
function fromDom(element, hole, content) {
    if (element.nodeType === 3) {
        return element.textContent;
    }

    const attributes = {};

    for (const { name, value } of element.attributes) {
        attributes[name] = value;
    }

    // Whether a box is ticked is a property the view set, not an attribute it
    // wrote; and a box read is a box nobody can tick, as in a locked editor.
    if (element.tagName === 'INPUT') {
        // Ticked before the box is on the page, as the view ticks it: a box
        // ticked once drawn is drawn with a check of its own. Vue writes the
        // attribute beside the property, which the view never does, and a box
        // already ticked does not follow its attribute any more.
        attributes['.checked'] = element.checked;
        attributes.onVnodeMounted = (drawn) => drawn.el.removeAttribute('checked');
        attributes.onVnodeUpdated = (drawn) => drawn.el.removeAttribute('checked');
        attributes.onClick = (event) => event.preventDefault();
    }

    const children =
        element === hole ? content() : [...element.childNodes].map((child) => fromDom(child, hole, content));

    return h(element.tagName.toLowerCase(), attributes, children);
}

/** ProseMirror writes no attribute it was given nothing for. */
function present(attributes) {
    return Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== null && value !== undefined));
}
