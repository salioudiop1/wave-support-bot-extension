// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const banner = `
var __g = (typeof globalThis!=="undefined" ? globalThis : window);
var process = __g.process || { env: { NODE_ENV: "production" } };
var global  = __g.global  || __g;
__g.process = process;
__g.global  = global;
`;

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        'assistant-adapter': resolve(__dirname, 'src/assistant-adapter.jsx'),
        'templates-adapter': resolve(__dirname, 'src/templates-adapter.jsx'),
      },
      output: {
        // ⚠️ retirer inlineDynamicImports si input multiple
        // inlineDynamicImports: true,  // ❌ SUPPRIMÉ
        entryFileNames: (chunk) => `${chunk.name}.js`,
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        banner,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': {},
    'global': 'window',
  },
});
