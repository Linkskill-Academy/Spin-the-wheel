import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function copyExtensionAssets(): Plugin {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      fs.copyFileSync(path.resolve(__dirname, 'manifest.json'), path.join(outDir, 'manifest.json'));
      const iconsOut = path.join(outDir, 'icons');
      fs.mkdirSync(iconsOut, { recursive: true });
      for (const file of fs.readdirSync(path.resolve(__dirname, 'icons'))) {
        fs.copyFileSync(path.resolve(__dirname, 'icons', file), path.join(iconsOut, file));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  resolve: {
    alias: {
      '@mecrm/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@mecrm/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@mecrm/ui/styles.css': path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      '@mecrm/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        newtab: path.resolve(__dirname, 'newtab.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
