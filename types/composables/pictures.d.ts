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
export function useImageCarrier(): {
    resolveImage: (src: string) => Promise<string | null>;
    fetchImage: (url: string) => Promise<string | null>;
};
//# sourceMappingURL=pictures.d.ts.map