import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are served using relative paths
  build: {
    outDir: 'dist', // The output directory for build files
  },
});
