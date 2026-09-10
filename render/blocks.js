import { h } from 'vue';

/**
 * A document drawn without an editor.
 *
 * A read-only editor is still an editor: a focus scope, an overlay, a controller
 * and a measuring pass, all of it for something nobody is going to type in.
 * Showing fifty of them, which is what a conversation or a list of notes is,
 * asks for something else, and this is it.
 *
 * The classes and the variables are the editor's, so a document looks the same
 * whether it is being read or written. That sameness is the point, not the
 * mechanism.
 */

/** How deep a block sits, written the way the extension writes it. */
const indented = (block) =>
    block.attrs?.indent
        ? {
              'data-indent': block.attrs.indent,
              style: `margin-left:calc(${block.attrs.indent} * var(--fe-editor-indent-step, 1.5rem))`,
          }
        : {};

const MARK_TAGS = {
    bold: 'strong',
    italic: 'em',
    strike: 's',
    underline: 'u',
    code: 'code',
};

/**
 * One run of text, wearing its marks.
 *
 * The order of nesting is the codec's, so what is read looks like what is
 * written: emphasis inside strike inside underline inside code inside link.
 */
function runOf(run, options) {
    const marks = run.marks ?? [];

    if (run.type === 'hardBreak') {
        return h('br');
    }

    if (run.type === 'mention') {
        return h(
            'span',
            {
                'data-mention': '',
                'data-model': run.attrs?.model,
                'data-id': run.attrs?.id,
                onClick: () => options.onMention?.({ model: run.attrs?.model, id: run.attrs?.id }),
            },
            run.attrs?.label ?? ''
        );
    }

    if (run.type !== 'text') {
        return null;
    }

    let drawn = run.text ?? '';

    for (const kind of ['bold', 'italic', 'underline', 'strike', 'code']) {
        if (marks.some((mark) => mark.type === kind)) {
            drawn = h(MARK_TAGS[kind], drawn);
        }
    }

    const link = marks.find((mark) => mark.type === 'link');

    return link ? h('a', { href: link.attrs?.href, target: '_blank', rel: 'noopener noreferrer' }, [drawn]) : drawn;
}

const runsOf = (block, options) =>
    (block.content ?? []).map((run) => runOf(run, options)).filter((run) => run !== null);

/** The paragraph a wrapper holds, an item never holding more than one. */
const bodyOf = (block, options) => runsOf((block.content ?? [])[0] ?? block, options);

/**
 * The blocks of [doc], as VNodes.
 *
 * @param {object} doc - Document, ProseMirror JSON
 * @param {{ onMention?: (record: { model: string, id: number }) => void, image?: (block: object) => any, code?: (text: string, language: string|null) => any }} [options]
 * @returns {any[]}
 */
export function renderBlocks(doc, options = {}) {
    return (doc?.content ?? []).map((block) => blockOf(block, options)).filter((block) => block !== null);
}

function blockOf(block, options) {
    const attributes = indented(block);

    switch (block.type) {
        case 'paragraph':
            return h('p', attributes, runsOf(block, options));

        case 'heading':
            return h(`h${Math.min(Math.max(block.attrs?.level ?? 1, 1), 6)}`, attributes, runsOf(block, options));

        case 'blockquote':
            return h('blockquote', attributes, [h('p', bodyOf(block, options))]);

        case 'horizontalRule':
            return h('hr', attributes);

        case 'codeBlock': {
            const language = block.attrs?.language ?? null;
            const written = (block.content ?? []).map((run) => run.text ?? '').join('');

            return h('pre', { ...attributes, 'data-language': language ?? undefined }, [
                h('code', options.code ? options.code(written, language) : written),
            ]);
        }

        case 'bulletList':
            return h('ul', attributes, itemsOf(block, options));

        case 'orderedList':
            return h('ol', { ...attributes, start: block.attrs?.start ?? undefined }, itemsOf(block, options));

        case 'taskList':
            return h('ul', { ...attributes, 'data-type': 'taskList' }, itemsOf(block, options));

        case 'image':
            return options.image ? options.image(block) : null;

        case 'table':
            return h('table', attributes, [
                h(
                    'tbody',
                    (block.content ?? []).map((row) => rowOf(row, options))
                ),
            ]);

        default:
            return null;
    }
}

function itemsOf(list, options) {
    return (list.content ?? []).map((item) =>
        item.type === 'taskItem'
            ? h(
                  'li',
                  {
                      ...indented(item),
                      'data-slot': 'editor-task-item',
                      'data-checked': item.attrs?.checked || undefined,
                  },
                  [
                      h('span', { 'data-slot': 'editor-task-check', 'aria-hidden': 'true' }),
                      h('span', { 'data-slot': 'editor-task-body' }, bodyOf(item, options)),
                  ]
              )
            : h('li', indented(item), bodyOf(item, options))
    );
}

function rowOf(row, options) {
    return h(
        'tr',
        (row.content ?? []).map((cell) =>
            h(
                cell.type === 'tableHeader' ? 'th' : 'td',
                { style: cell.attrs?.colwidth?.[0] ? `width:${cell.attrs.colwidth[0]}px` : undefined },
                (cell.content ?? []).map((block) => blockOf(block, options))
            )
        )
    );
}
