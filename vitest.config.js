import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [vue()],

    // vue-fastedgy reads `import.meta.env` at module scope, and vitest hands a
    // node_modules import straight to node, where there is none.
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },

    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js'],
        server: { deps: { inline: ['vue-fastedgy'] } },
    },
});
