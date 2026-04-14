import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        viz1: resolve(__dirname, 'src/viz1-next-word/index.html'),
        viz2: resolve(__dirname, 'src/viz2-word-vectors/index.html'),
        viz3: resolve(__dirname, 'src/viz3-vector-arithmetic/index.html'),
        viz4: resolve(__dirname, 'src/viz4-temperature/index.html'),
        viz5: resolve(__dirname, 'src/viz5-transformer-anatomy/index.html'),
      },
    },
  },
});
