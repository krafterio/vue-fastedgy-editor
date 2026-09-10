import { useFetcherService, useStorage } from 'vue-fastedgy';

import { attachmentId } from '../features/image.js';

/**
 * Reading a picture as what it is, and not as what it is drawn at.
 *
 * What a document shows is optimised: `v-fetcher-src` asks the storage route for
 * a size that suits the screen, and the blob it holds is that one. Copying it
 * would hand somebody a picture already reduced, and pasting it back would store
 * the reduction over the original. Everything here therefore asks again, without
 * the parameters that shrink it.
 *
 * A picture stored beside the record is read through the fetcher, which carries
 * the token. One that lives somewhere else is read with a plain request and no
 * credentials at all: a token is for our server, and handing it to a third party
 * because a document happens to name their file is not something to do quietly.
 *
 * @returns {{ resolveImage: (src: string) => Promise<string|null>, fetchImage: (url: string) => Promise<string|null> }}
 */
export function useImageCarrier() {
    const fetcher = useFetcherService();
    const { attachmentUrl, fileUrl } = useStorage();

    /** What is stored beside the record, read with the token and at full size. */
    async function stored(url) {
        try {
            const response = await fetcher.get(url);

            return await asDataUri(await response.blob());
        } catch {
            return null;
        }
    }

    /** What lives elsewhere, read as anybody would read it. */
    async function elsewhere(url) {
        try {
            const response = await fetch(url, { credentials: 'omit', mode: 'cors' });

            return response.ok ? await asDataUri(await response.blob()) : null;
        } catch {
            return null;
        }
    }

    const external = (address) => /^https?:/i.test(address);

    return {
        resolveImage(src) {
            const address = src ?? '';
            const id = attachmentId(address);

            if (id !== null) {
                return stored(attachmentUrl(id));
            }

            if (address.startsWith('data:')) {
                return Promise.resolve(address);
            }

            return external(address) ? elsewhere(address) : stored(fileUrl(address) ?? address);
        },

        fetchImage: (url) => (external(url) ? elsewhere(url) : stored(url)),
    };
}

function asDataUri(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
    });
}
