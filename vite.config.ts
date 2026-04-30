import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      // Point directly to source files since packages are not pre-built
      '@noriginmedia/norigin-spatial-navigation': path.resolve(
        __dirname,
        '../../packages/legacy/src/index.ts'
      ),
      '@noriginmedia/norigin-spatial-navigation-core': path.resolve(
        __dirname,
        '../../packages/core/src/index.ts'
      ),
      '@noriginmedia/norigin-spatial-navigation-react': path.resolve(
        __dirname,
        '../../packages/react/src/index.ts'
      ),
    }
  }
});
