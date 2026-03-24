import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/** Même règle pour `vite` et `vite preview` : le front appelle `/api/*` → Express sur 8081 sans préfixe. */
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8081',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy: apiProxy,
  },
});
