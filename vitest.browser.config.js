import { readFileSync } from 'node:fs';

import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * What only a browser can say: where things are drawn.
 *
 * jsdom lays nothing out, so a document written and the same document read can
 * only be compared there element by element. Here they are compared by the box
 * of every element and by the pixels themselves.
 */
/**
 * The server's storage route, which answers every stored path with the one
 * picture the tests store. The fetcher, the directive and the browser are the
 * real ones: what a cover draws is read over the network, as it is everywhere.
 */
const storage = {
    name: 'storage',
    configureServer(server) {
        server.middlewares.use('/storage/download/', (_, response) => {
            response.setHeader('Content-Type', 'image/png');
            response.end(readFileSync(new URL('./tests/browser/cover.png', import.meta.url)));
        });
    },
};

export default defineConfig({
    plugins: [vue(), storage],
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },

    // Every dependency the tests reach, found before the first one runs: one
    // found halfway reloads the page, and a first run on a fresh checkout
    // fails before a single test is drawn.
    optimizeDeps: { entries: ['tests/browser/**/*.test.js'] },

    test: {
        include: ['tests/browser/**/*.test.js'],
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
        },
    },
});
