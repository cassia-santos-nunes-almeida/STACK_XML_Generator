import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
      root: 'src',
      base: '/STACK_XML_Generator/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
      build: {
        outDir: '../dist',
      },
    };
});
