import { config } from '@vue/test-utils';
import { fetcherSrc } from 'vue-fastedgy';

/**
 * The directive that carries the token onto a stored picture.
 *
 * `createFetcher` registers it wherever the package really runs, and nothing
 * here installs that plugin: Vue would be asked for a directive nobody
 * registered and warn at every picture a test draws.
 */
config.global.directives = { 'fetcher-src': fetcherSrc };

/**
 * jsdom draws nothing, so nothing ever comes into sight.
 *
 * A picture is read lazily, which means read once it is looked at, and what
 * says so is an observer jsdom does not have. One that watches and never fires
 * is what "nothing was ever looked at" means: the picture keeps the address it
 * was given, which is the one a test reads.
 */
globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
};

/**
 * jsdom does no layout, and ProseMirror measures.
 *
 * Scrolling a selection into view asks a text node or a range where it is, and
 * jsdom has no answer to give. An empty list is what "nothing is laid out" means
 * and it is what a browser answers for a node nobody drew, so measuring reads as
 * nothing rather than throwing under every test that moves the caret.
 */
const nothing = Object.assign([], { item: () => null });
const empty = () => nothing;
const zero = () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0 });

for (const holder of [globalThis.Range, globalThis.Node]) {
    if (holder && !holder.prototype.getClientRects) {
        holder.prototype.getClientRects = empty;
    }

    if (holder && !holder.prototype.getBoundingClientRect) {
        holder.prototype.getBoundingClientRect = zero;
    }
}
