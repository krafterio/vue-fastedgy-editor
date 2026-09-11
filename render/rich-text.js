import {
    getAttributesFromExtensions,
    getExtensionField,
    getRenderedAttributes,
    getSchemaByResolvedExtensions,
    isNodeEmpty,
    resolveExtensions,
} from '@tiptap/core';
import { EditorState, Selection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { cloneVNode, defineComponent, h, provide, ref } from 'vue';

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
        extensions,
    };

    return {
        schema,
        codec: createMarkdownCodec(features),

        /**
         * @param {object} doc - ProseMirror JSON
         * @param {{ placeholder?: ((said: { node: any, empty: boolean }) => string)|null }} [options]
         *   What an editor that has just opened [doc] says on its empty line, as it says it
         * @returns {any[]}
         */
        draw: (doc, options = {}) => {
            const read = documentOf(schema, doc);
            const laid = withPlaceholder(decorationsOf(read, context.decorating), read, options.placeholder);

            return childrenOf(read, context, laid, 0);
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
            built[extension.name] = (node, decorations, innerDecorations) =>
                make({
                    node,
                    view: READ_ONLY,
                    getPos: () => undefined,
                    decorations,
                    innerDecorations,
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
 * of a state holding the document, which is data, and no view at all. Laid by
 * several plugins, they are read as one set, as the view reads them.
 */
function decorationsOf(doc, decorating) {
    if (decorating.length === 0) {
        return DecorationSet.empty;
    }

    const state = EditorState.create({ doc, plugins: decorating });
    const sets = decorating.map((plugin) => plugin.props.decorations.call(plugin, state)).filter((set) => set?.find);

    return sets.length === 1
        ? sets[0]
        : DecorationSet.create(
              doc,
              sets.flatMap((set) => set.find())
          );
}

/**
 * What an editor says on the line its caret starts on, laid over [decorated].
 *
 * tiptap's `Placeholder`, as the editor configures it, read of the state an
 * editor opens on: the caret at the start, and the textblock it stands in, when
 * it holds nothing, carrying the words and the classes the stylesheet shows
 * them by. An editor draws this while it is built, so the field it becomes says
 * the same thing from the first frame.
 */
function withPlaceholder(decorated, doc, placeholder) {
    if (!placeholder) {
        return decorated;
    }

    const { anchor } = Selection.atStart(doc);
    const resolved = doc.resolve(anchor);
    const node = resolved.depth > 0 ? resolved.node(1) : resolved.nodeAfter;
    const start = resolved.depth > 0 ? resolved.before(1) : anchor;

    if (!node?.type.isTextblock || !isNodeEmpty(node)) {
        return decorated;
    }

    const empty = isNodeEmpty(doc);
    const said = Decoration.node(start, start + node.nodeSize, {
        class: empty ? 'is-empty is-editor-empty' : 'is-empty',
        'data-placeholder': placeholder({ node, empty }),
    });

    return DecorationSet.create(doc, [...decorated.find(), said]);
}

/**
 * The children of [parent] and the widgets between them, in the order the view
 * draws them, each child handed the decorations drawn around it and the source
 * of those inside it: ProseMirror's own walk (`iterDeco`), a text cut wherever
 * a decoration starts or ends.
 *
 * @param {any} parent
 * @param {any} source - A decoration source, local to [parent]
 * @param {(widget: any, index: number, insideNode: boolean) => void} onWidget
 * @param {(child: any, outer: any[], inner: any, offset: number) => void} onNode
 */
function iterDeco(parent, source, onWidget, onNode) {
    const locals = source.locals(parent);
    let offset = 0;

    if (locals.length === 0) {
        parent.forEach((child, at) => onNode(child, locals, source.forChild(at, child), at));

        return;
    }

    let decoIndex = 0;
    let restNode = null;
    const active = [];

    for (let parentIndex = 0; ;) {
        const widgets = [];

        while (decoIndex < locals.length && locals[decoIndex].to === offset) {
            const next = locals[decoIndex++];

            if (next.widget) {
                widgets.push(next);
            }
        }

        widgets.sort((a, b) => a.type.side - b.type.side);
        widgets.forEach((widget) => onWidget(widget, parentIndex, Boolean(restNode)));

        let child;

        if (restNode) {
            child = restNode;
            restNode = null;
        } else if (parentIndex < parent.childCount) {
            child = parent.child(parentIndex++);
        } else {
            break;
        }

        for (let at = 0; at < active.length; at++) {
            if (active[at].to <= offset) {
                active.splice(at--, 1);
            }
        }

        while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset) {
            active.push(locals[decoIndex++]);
        }

        let end = offset + child.nodeSize;

        if (child.isText) {
            let cutAt = end;

            if (decoIndex < locals.length && locals[decoIndex].from < cutAt) {
                cutAt = locals[decoIndex].from;
            }

            for (const decoration of active) {
                if (decoration.to < cutAt) {
                    cutAt = decoration.to;
                }
            }

            if (cutAt < end) {
                restNode = child.cut(cutAt - offset);
                child = child.cut(0, cutAt - offset);
                end = cutAt;
            }
        } else {
            while (decoIndex < locals.length && locals[decoIndex].to < end) {
                decoIndex++;
            }
        }

        const outer =
            child.isInline && !child.isLeaf ? active.filter((decoration) => !decoration.inline) : active.slice();

        onNode(child, outer, source.forChild(offset, child), offset);
        offset = end;
    }
}

/**
 * The decorations drawn around a node, as the view lays them (`computeOuterDeco`):
 * the first level on the node's own element, and one more around it for every
 * decoration naming an element of its own. A text, which has no element to
 * carry anything, is wrapped in one.
 */
function outerLevels(outer, node, needsWrap) {
    const levels = [{}];
    let top = levels[0];

    for (const decoration of outer) {
        const attrs = decoration.type.attrs;

        if (!attrs) {
            continue;
        }

        if (attrs.nodeName) {
            levels.push((top = { nodeName: attrs.nodeName }));
        }

        for (const [name, value] of Object.entries(attrs)) {
            if (value === null || value === undefined) {
                continue;
            }

            if (needsWrap && levels.length === 1) {
                levels.push((top = { nodeName: node.isInline ? 'span' : 'div' }));
            }

            if (name === 'class') {
                top.class = (top.class ? `${top.class} ` : '') + value;
            } else if (name === 'style') {
                top.style = (top.style ? `${top.style};` : '') + value;
            } else if (name !== 'nodeName') {
                top[name] = value;
            }
        }
    }

    return levels;
}

/**
 * What a level sets, in the order the view sets it (`patchAttributes`): its
 * attributes, then its classes, then its style.
 */
function attributesOf(level) {
    const { class: classes, style, ...rest } = level;
    const named = Object.entries(rest).filter(([name]) => name !== 'nodeName');

    return { ...Object.fromEntries(named), ...(classes ? { class: classes } : {}), ...(style ? { style } : {}) };
}

/** [drawn] with the decorations around it: its own element given the first level, then wrapped. */
function wrapped(drawn, levels, own = (vnode, attributes) => cloneVNode(vnode, attributes, true)) {
    const [first, ...around] = levels;
    const attributes = attributesOf(first);
    let vnode = Object.keys(attributes).length > 0 ? own(drawn, attributes) : drawn;

    for (const level of around) {
        vnode = h(level.nodeName, attributesOf(level), [vnode]);
    }

    return vnode;
}

/** A widget, as the view draws one: its element, never written in, marked as a widget. */
function widgetOf(widget, position) {
    let dom = widget.type.toDOM;

    if (typeof dom === 'function') {
        dom = dom(READ_ONLY, () => position);
    }

    if (!widget.type.spec.raw) {
        if (dom.nodeType !== 1) {
            const wrap = document.createElement('span');

            wrap.appendChild(dom);
            dom = wrap;
        }

        if (!dom.hasAttribute('contenteditable')) {
            dom.contentEditable = 'false';
        }

        dom.classList.add('ProseMirror-widget');
    }

    return fromDom(dom, null, () => []);
}

function childrenOf(node, context, source, start) {
    const drawn = [];

    iterDeco(
        node,
        source,
        (widget) => drawn.push(widgetOf(widget, start + widget.from)),
        (child, outer, inner, offset) => drawn.push(nodeOf(child, context, outer, inner, start + offset))
    );

    return drawn;
}

function nodeOf(node, context, outer, inner, position) {
    const name = node.type.name;
    const levels = outerLevels(outer, node, false);

    if (context.views[name]) {
        // The classes go where the editor puts them, through the wrapper that
        // reads them; everything else lands on the element the view draws.
        const { class: classes, ...rest } = levels[0];

        return wrapped(
            h(ReadNodeView, {
                view: context.views[name],
                node,
                position,
                extension: context.extensions.find((extension) => extension.name === name) ?? null,
                context,
                decorations: outer,
                inner,
                classes: classes ?? '',
            }),
            [rest, ...levels.slice(1)],
            (vnode, attributes) => cloneVNode(vnode, { attributes })
        );
    }

    if (context.nodeViews[name]) {
        const built = context.nodeViews[name](node, outer, inner);

        return wrapped(
            fromDom(built.dom, built.contentDOM ?? null, () => contentOf(node, context, inner, position)),
            levels
        );
    }

    return wrapped(
        fromSpec(node.type.spec.toDOM(node), () => contentOf(node, context, inner, position)),
        levels
    );
}

/** What a node at [position] holds: blocks, or the line of a textblock. */
function contentOf(node, context, source, position) {
    return node.isTextblock
        ? inlineOf(node, context, source, position + 1)
        : childrenOf(node, context, source, position + 1);
}

/**
 * The inline content of a textblock, each mark drawn once around every node it
 * spans, as ProseMirror nests them: `**a *b* c**` is one `strong` holding an
 * `em`, not three `strong`. What decorations draw sits inside the marks, around
 * what it covers, and a widget takes the marks the view gives it: its own, the
 * next node's when it stands before it, or those already open.
 */
function inlineOf(node, context, source, start) {
    const items = [];

    iterDeco(
        node,
        source,
        (widget, index, insideNode) =>
            items.push({
                marks:
                    widget.spec.marks ??
                    (widget.type.side >= 0 && !insideNode
                        ? index === node.childCount
                            ? []
                            : node.child(index).marks
                        : null),
                drawn: widgetOf(widget, start + widget.from),
                text: null,
            }),
        (child, outer, inner, offset) =>
            items.push({
                marks: child.marks,
                drawn: child.isText
                    ? wrapped(child.text, outerLevels(outer, child, true))
                    : nodeOf(child, context, outer, inner, start + offset),
                text: child.isText ? child.text : null,
            })
    );

    const root = { children: [] };
    const open = [];
    const top = () => open.at(-1) ?? root;

    const close = () => {
        const { mark, children } = open.pop();

        top().children.push(fromSpec(mark.type.spec.toDOM(mark, true), () => children));
    };

    for (const { marks, drawn } of items) {
        if (marks !== null) {
            let kept = 0;

            while (kept < open.length && kept < marks.length && open[kept].mark.eq(marks[kept])) {
                kept++;
            }

            while (open.length > kept) {
                close();
            }

            for (const mark of marks.slice(kept)) {
                open.push({ mark, children: [] });
            }
        }

        top().children.push(drawn);
    }

    while (open.length > 0) {
        close();
    }

    return withTrailingBreak(root.children, items.at(-1));
}

/**
 * The break ProseMirror puts at the end of a line that would otherwise draw no
 * height: an empty one, one ending on something that is not text, a widget
 * among them, one ending on a line feed. Without it an empty paragraph read is
 * an empty paragraph collapsed, and everything below it moves up.
 */
function withTrailingBreak(drawn, last) {
    if (!last || last.text === null || last.text.endsWith('\n')) {
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
        decorations: { type: Array, default: () => [] },
        inner: { type: Object, required: true },
        classes: { type: String, default: '' },
        attributes: { type: Object, default: () => ({}) },
    },

    setup(props) {
        // What `NodeViewWrapper` reads: nothing to drag, and the classes of
        // the decorations around the node, as tiptap hands them over.
        provide('onDragStart', () => {});
        provide('decorationClasses', ref(props.classes));
        provide(HELD_CONTENT, () => contentOf(props.node, props.context, props.inner, props.position));

        return () =>
            h(props.view, {
                ...props.attributes,
                editor: READ_ONLY,
                node: props.node,
                decorations: props.decorations,
                innerDecorations: props.inner,
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
