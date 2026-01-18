import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'


const rootDir = dirname(fileURLToPath(import.meta.url))
const BASE_PATH = '/static/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: BASE_PATH,
  build: {
    manifest: 'manifest.json',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'src/main.ts'),
      },
    },
  },
})
