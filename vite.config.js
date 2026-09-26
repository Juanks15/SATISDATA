import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const base = '/SATISDATA/';

export default defineConfig({
  base,

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'SATISDATA',
        short_name: 'SATISDATA',
        description: 'Sistema para la gestión de encuestas de satisfacción',
        theme_color: '#123b63',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',

        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        redirect: resolve(__dirname, 'redirect.html'),
      },
    },
  },
});