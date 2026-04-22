import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/mst-button/index': resolve(
          __dirname,
          'src/components/mst-button/index.ts',
        ),
        'components/mst-tree/index': resolve(
          __dirname,
          'src/components/mst-tree/index.ts',
        ),
        'components/mst-feature-tree/index': resolve(
          __dirname,
          'src/components/mst-feature-tree/index.ts',
        ),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      external: [/^lit($|\/)/],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    target: 'es2020',
    minify: false,
  },
});
