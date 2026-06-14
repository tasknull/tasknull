// Generate favicon.png and apple-touch-icon.png from assets/logo.jpg (resize only).
// Usage:  npm install   (in this folder, once)   then   node genfav.js
const sharp = require('sharp');
const path = require('path');

const assets = path.join(__dirname, '..', 'assets');
const src = path.join(assets, 'logo.jpg');

(async () => {
  await sharp(src).resize(64, 64).png().toFile(path.join(assets, 'favicon.png'));
  await sharp(src).resize(180, 180).png().toFile(path.join(assets, 'apple-touch-icon.png'));
  console.log('genfav.js: favicon.png + apple-touch-icon.png written');
})().catch(e => { console.error(e); process.exit(1); });
