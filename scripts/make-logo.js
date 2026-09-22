#!/usr/bin/env node
// One-off helper: turns assets/logo-source.* (white letters on a black bar, on a white canvas)
// into assets/logo.png - a light bar with transparent letters, for the dark pages.
// Run again only if you replace the logo:  node scripts/make-logo.js
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib.js';

const dir = path.join(ROOT, 'assets');
const src = fs.readdirSync(dir).find((f) => f.startsWith('logo-source.'));
if (!src) throw new Error('Put your logo at assets/logo-source.png / .jpg / .webp');

const bar = await sharp(path.join(dir, src)).flatten({ background: '#fff' })
  .trim({ background: '#ffffff', threshold: 40 }).toBuffer();
const { data, info } = await sharp(bar).resize({ width: 720 }).greyscale().raw().toBuffer({ resolveWithObject: true });

const rgba = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  rgba[i * 4] = 0xf4; rgba[i * 4 + 1] = 0xf1; rgba[i * 4 + 2] = 0xea; // --fg
  rgba[i * 4 + 3] = 255 - data[i]; // black bar -> opaque, white letters -> transparent
}
await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(dir, 'logo.png'));
console.log(`✓ assets/logo.png (${info.width}x${info.height})`);
