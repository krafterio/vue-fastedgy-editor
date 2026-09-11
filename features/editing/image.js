import { Plugin } from '@tiptap/pm/state';

import { useImageCarrier } from '../../composables/pictures.js';
import { extendedOnce } from '../../extensions/extend.js';

/**
 * What writes a picture: choosing one, pasting or dropping one, carrying one on
 * the clipboard, and the entries that insert one.
 *
 * @param {any} extension - The picture as its feature reads it
 * @param {object} options - The feature's, `pickFile` and `store` read on every call
 * @returns {import('../registry.js').RichTextEditing}
 */
export function imageEditing(extension, options) {
    const chosen = { pickFile: pickImageFile, ...options };

    return {
        extensions: [
            extendedOnce(extension, {
                addCommands() {
                    return {
                        ...this.parent?.(),

                        insertPickedImage:
                            () =>
                            ({ editor }) => {
                                void insertPicked(editor, chosen);

                                return true;
                            },
                    };
                },

                addProseMirrorPlugins() {
                    return [pastedImages(this.editor, chosen)];
                },
            }),
        ],

        // What a picture becomes on its way to the clipboard and back: carried
        // inside what was copied rather than as a reference to somebody else's
        // record, and fetched from what was pasted where it can be had.
        clipboard: () => pictureCarriers(useImageCarrier()),

        // Pictures dropped on the text are its to place.
        takes: (kinds) => kinds.every((kind) => kind.startsWith('image/')),

        // A picture is the one thing on the "/" menu somebody looks for on the
        // strip: it is reached far more often than a rule.
        actions: [
            {
                name: 'image',
                glyph: 'image',
                group: 3,
                isActive: () => false,
                isEnabled: (editor) => editor.isEditable,
                run: (editor) => editor.chain().focus().insertPickedImage().run(),
            },
        ],

        menuItems: [
            {
                name: 'image',
                glyph: 'image',
                keywords: ['image', 'picture', 'photo'],
                run: (editor) => editor.chain().focus().insertPickedImage().run(),
            },
        ],

        replacesMenuItems: ['image'],
    };
}

/**
 * A picture pasted into the document.
 *
 * It lands as the `data:` URI the clipboard handed over, and becomes an
 * attachment on the next save: what somebody pasted is in the text from the
 * moment they pasted it, whether or not a record exists to store it against.
 */
const picturesIn = (transfer) => [...(transfer?.files ?? [])].filter((file) => file.type.startsWith('image/'));

/**
 * Pictures brought in from outside, pasted or dropped.
 *
 * Dropped, they land where the pointer let go and not where the caret happened
 * to be: the drop cursor has been following the pointer the whole way, and it
 * would be saying something untrue otherwise. Read one after the other rather
 * than all at once, so three pictures dropped together come out in the order
 * they were dropped in.
 */
function pastedImages(editor, options) {
    return new Plugin({
        props: {
            handlePaste(view, event) {
                const files = picturesIn(event.clipboardData);

                if (files.length === 0) {
                    return false;
                }

                event.preventDefault();
                void insertFiles(editor, files, options);

                return true;
            },

            handleDrop(view, event, _slice, moved) {
                const files = moved ? [] : picturesIn(event.dataTransfer);

                if (files.length === 0) {
                    return false;
                }

                const at = view.posAtCoords({ left: event.clientX, top: event.clientY });

                event.preventDefault();

                if (at) {
                    editor.commands.setTextSelection(at.pos);
                }

                void insertFiles(editor, files, options);

                return true;
            },
        },
    });
}

async function insertFiles(editor, files, options) {
    for (const file of files) {
        await insertFile(editor, file, options);
    }
}

/**
 * Picks a file, stores it, and drops what came back into the document.
 *
 * The picture is inserted either way: as an attachment where one could be
 * written, and as the `data:` URI it was read as where the record is not there
 * yet. What is in the text is never lost waiting for a record.
 */
/**
 * The browser's own file chooser, which is the only one there is on the web.
 *
 * An application with another way of choosing a picture — a library of its own,
 * a camera — passes `pickFile` instead.
 */
export function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
    });
}

async function insertPicked(editor, options) {
    const file = await options.pickFile?.();

    if (file) {
        await insertFile(editor, file, options);
    }
}

async function insertFile(editor, file, options) {
    const id = (await options.store?.(file)) ?? null;
    const src = id === null ? await asDataUri(file) : `attachment:${id}`;

    if (src) {
        editor.chain().focus().insertContent({ type: 'image', attrs: { src } }).run();
    }
}

/**
 * How wide a picture is carried at before it is stored, and how well.
 *
 * A picture written into a record that has no id yet travels inside the text as
 * a `data:` URI, and the server stores it at the next save. Sent whole, a
 * twelve megapixel photo makes every keystroke carry ten megabytes of base64
 * until then; sent reduced, it appears at once even on a thin line and reaches
 * the server the size a document draws it at.
 */
const CARRIED_WIDTH = 2048;
const CARRIED_QUALITY = 0.82;

/**
 * The picture as it travels: reduced where it can be, whole where it cannot.
 *
 * Anything the browser cannot draw — an animation whose frames would be lost, a
 * format canvas does not read — is carried as it is rather than flattened into
 * something else.
 */
async function asDataUri(file) {
    const reduced = file.type === 'image/gif' ? null : await drawnSmaller(file);

    return reduced ?? readAsDataUri(file);
}

function readAsDataUri(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

async function drawnSmaller(file) {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
        return null;
    }

    try {
        const picture = await createImageBitmap(file);
        const scale = Math.min(1, CARRIED_WIDTH / Math.max(picture.width, picture.height));
        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(picture.width * scale));
        canvas.height = Math.max(1, Math.round(picture.height * scale));
        canvas.getContext('2d')?.drawImage(picture, 0, 0, canvas.width, canvas.height);
        picture.close?.();

        const drawn = canvas.toDataURL('image/jpeg', CARRIED_QUALITY);

        return drawn.startsWith('data:image/') ? drawn : null;
    } catch {
        return null;
    }
}

/** What a picture may weigh before it is left where it lives. */
const MAX_INLINE_BYTES = 10 * 1024 * 1024;

/**
 * What a picture becomes on the clipboard, given what reads one.
 *
 * Copied, a picture travels **inside** what was copied, as a `data:` URI: an
 * attachment belongs to the record it was stored against, and pasting elsewhere
 * a reference to somebody else's file gives a picture that vanishes the day that
 * record does. It is read at full size, never as the document draws it: the
 * shown picture is optimised for the screen, and copying that would store the
 * reduction over the original on the next save.
 *
 * Pasted, a picture named by a remote address is fetched to be carried inline,
 * which the next save turns into an attachment of the record; one that cannot be
 * had, or weighs too much, is left pointing where it pointed.
 *
 * @param {{ resolveImage: (src: string) => Promise<string|null>, fetchImage: (url: string) => Promise<string|null> }} carrier
 * @returns {Record<string, { copied: Function, pasted: Function }>}
 */
export function pictureCarriers({ resolveImage, fetchImage }) {
    const within = (block, src) => ({ ...block, attrs: { ...block.attrs, src } });

    return {
        image: {
            copied(block) {
                const src = block.attrs?.src ?? '';

                return src.startsWith('data:')
                    ? null
                    : resolveImage(src).then((carried) => (carried ? within(block, carried) : block));
            },

            pasted(block) {
                const src = block.attrs?.src ?? '';

                return /^https?:/i.test(src)
                    ? fetchImage(src).then((inlined) =>
                          inlined && inlined.length <= MAX_INLINE_BYTES ? within(block, inlined) : block
                      )
                    : null;
            },
        },
    };
}
