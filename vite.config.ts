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
      // Vendored copies of the monorepo packages — works in any environment
      '@noriginmedia/norigin-spatial-navigation': path.resolve(
        __dirname,
        'src/vendor/norigin-spatial-navigation/index.ts'
      ),
      '@noriginmedia/norigin-spatial-navigation-core': path.resolve(
        __dirname,
        'src/vendor/norigin-spatial-navigation-core/index.ts'
      ),
      '@noriginmedia/norigin-spatial-navigation-react': path.resolve(
        __dirname,
        'src/vendor/norigin-spatial-navigation-react/index.ts'
      ),
    }
  }
});
