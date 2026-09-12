// Copies the built web app (apps/web/dist) into apps/mobile/www so Capacitor can package it.
// Run `npm run build --workspace=apps/web` first.
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../../web/dist');
const dest = path.resolve(__dirname, '../www');

if (!fs.existsSync(src)) {
  console.error('apps/web/dist not found. Run "npm run build --workspace=apps/web" first.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
