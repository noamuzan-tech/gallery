#!/usr/bin/env node
// Helper: turns assets/logo-source.* (white letters on a black bar, on a white canvas) into:
//   assets/logo.png       light bar + see-through letters (for the dark pages)
//   assets/logo-dark.png  dark bar + see-through letters (for the white printable QR page)
//   assets/icon.png       180x180 browser/home-screen icon (the "N" from the logo)
// Run again only if you replace the logo:  npm run logo
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib.js';

const dir = path.join(ROOT, 'assets');
const src = fs.readdirSync(dir).find((f) => f.startsWith('logo-source.'));
if (!src) throw new Error('Put your logo at assets/logo-source.png / .jpg / .webp');

// Crop to the black bar and read it as greyscale (0 = bar, 255 = letters)
const bar = await sharp(path.join(dir, src)).flatten({ background: '#fff' })
  .trim({ background: '#ffffff', threshold: 40 }).toBuffer();
const { data, info } = await sharp(bar).greyscale().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// Bar colour + alpha (bar opaque, letters transparent)
function knockout(r, g, b) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255 - data[i];
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}
const png = { compressionLevel: 9, palette: true };

await knockout(0xf4, 0xf1, 0xea).resize({ width: 720 }).png(png).toFile(path.join(dir, 'logo.png'));
await knockout(0x0a, 0x0a, 0x0a).resize({ width: 720 }).png(png).toFile(path.join(dir, 'logo-dark.png'));

// Icon: the first letter of the logo. Find where the first letter ends (first all-bar column after it).
const isLetterColumn = (x) => { for (let y = 0; y < height; y++) if (data[y * width + x] > 128) return true; return false; };
let x = 0;
while (x < width && !isLetterColumn(x)) x++;
while (x < width && isLetterColumn(x)) x++;
const cropWidth = Math.min(x + Math.round(height * 0.08), width);
// inset a few px to drop the bar's anti-aliased outer edge
const inset = Math.max(2, Math.round(height * 0.02));
const cw = cropWidth - inset * 2, ch = height - inset * 2;
const letter = await knockout(0xf4, 0xf1, 0xea).extract({ left: inset, top: inset, width: cw, height: ch }).png().toBuffer();
const side = Math.round(Math.max(cw, ch) * 1.35);
const pos = { left: Math.round((side - cw) / 2), top: Math.round((side - ch) / 2) };
// light square, dark patch behind the letter, then the letter cut-out on top -> dark letter on light square
const darkPatch = await sharp({ create: { width: cw, height: ch, channels: 4, background: '#0a0a0a' } }).png().toBuffer();
const square = await sharp({ create: { width: side, height: side, channels: 4, background: '#f4f1ea' } })
  .composite([{ input: darkPatch, ...pos }, { input: letter, ...pos }])
  .flatten({ background: '#f4f1ea' })
  .png()
  .toBuffer();
await sharp(square).resize(180, 180).png(png).toFile(path.join(dir, 'icon.png'));

console.log('✓ assets/logo.png, assets/logo-dark.png, assets/icon.png');
