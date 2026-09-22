#!/usr/bin/env node
// Builds dist/ from events/*/event.json + cover image.
//
//   dist/index.html            home page (does NOT list events)
//   dist/404.html
//   dist/<slug>/index.html     event landing page with static Open Graph tags
//   dist/<slug>/cover-<hash>.jpg
//   dist/<slug>/h-<hash>.jpg     optional highlight thumbnails (events/<slug>/highlights/)
//   dist/<slug>/qr.png, qr.svg   QR code of the page URL
//   dist/<slug>/qr/index.html    printable QR card
//   dist/assets/                 icon + home page preview image
//
// Folders in events/ whose name starts with "_" or "." (like events/_example) are skipped.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import {
  ROOT, EVENTS_DIR, DIST_DIR, COVER_NAMES,
  readConfig, validateSlug, validateDriveUrl,
} from './lib.js';
import { renderEventPage, renderHomePage, renderNotFoundPage, renderQrPage } from './templates.js';

// Bump this if the image pipeline below changes, so every cover gets a new filename
// (and WhatsApp is forced to fetch it again).
const PIPELINE_VERSION = '1';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const COVER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'attention'];
const WHATSAPP_SAFE_BYTES = 300 * 1024;
const MAX_HIGHLIGHTS = 8;
let brandCoverCache; // logo cover, generated once per build
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

// sharp is optional: with it covers are resized/compressed to 1200x630,
// without it they are copied as-is.
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn(c.yellow('! "sharp" is not installed - cover images will be copied without optimisation. Run "npm install" to enable it.'));
}

// ---------- config ----------

const config = readConfig();
const configErrors = [];
try {
  const u = new URL(config.siteUrl);
  if (u.protocol !== 'https:') configErrors.push(`siteUrl must start with https:// (got "${config.siteUrl}")`);
} catch {
  configErrors.push(`siteUrl "${config.siteUrl}" is not a valid URL`);
}
if (configErrors.length) fail([['site.config.json', configErrors]]);

if (/USERNAME/.test(config.siteUrl)) {
  const msg = 'siteUrl in site.config.json still contains "USERNAME". Replace it with your GitHub username, otherwise WhatsApp previews will not work.';
  if (process.env.GITHUB_ACTIONS) fail([['site.config.json', [msg]]]);
  console.warn(c.yellow(`! ${msg}\n`));
}

// ---------- discover + validate events ----------

const folders = fs.existsSync(EVENTS_DIR)
  ? fs.readdirSync(EVENTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort()
  : [];

const events = [];
const problems = [];

for (const folder of folders) {
  const dir = path.join(EVENTS_DIR, folder);
  const errors = [];
  const jsonPath = path.join(dir, 'event.json');
  let data = {};

  if (!fs.existsSync(jsonPath)) {
    errors.push('event.json is missing');
  } else {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^﻿/, ''));
    } catch (err) {
      errors.push(`event.json is not valid JSON: ${err.message}`);
    }
  }

  const str = (k) => (typeof data[k] === 'string' ? data[k].trim() : data[k] == null ? '' : String(data[k]).trim());
  const event = {
    folder,
    slug: str('slug'),
    title: str('title'),
    date: str('date'),
    description: str('description'),
    driveUrl: str('driveUrl'),
    coverAlt: str('coverAlt'),
    coverPosition: str('coverPosition') || 'center',
    accentColor: str('accentColor'),
    // "comingSoon": true + no driveUrl yet = page shows "coming soon" + notify sign-up. Adding the Drive link switches it on.
    comingSoon: data.comingSoon === true && !str('driveUrl'),
  };

  if (!errors.length) {
    const slugErr = validateSlug(event.slug);
    if (slugErr) errors.push(slugErr);
    else if (event.slug !== folder) {
      errors.push(`slug "${event.slug}" must match the folder name "${folder}" (rename the folder or fix the slug)`);
    }
    if (!event.title) errors.push('title is missing');
    if (!event.date) errors.push('date is missing');
    if (!event.comingSoon || event.driveUrl) {
      const driveErr = validateDriveUrl(event.driveUrl);
      if (driveErr) errors.push(event.driveUrl ? driveErr : `${driveErr} (or set "comingSoon": true if the gallery is not ready yet)`);
    }
    if (event.accentColor && !/^#[0-9a-f]{6}$/i.test(event.accentColor)) {
      errors.push(`accentColor must be a hex colour like "#f5c400" (got "${event.accentColor}")`);
    }
    if (!COVER_POSITIONS.includes(event.coverPosition) && !parsePercent(event.coverPosition)) {
      errors.push(`coverPosition must be one of: ${COVER_POSITIONS.join(', ')}, or a height percentage like "30%"`);
    }
  }

  const coverName = COVER_NAMES.find((n) => fs.existsSync(path.join(dir, n)));
  if (!coverName) {
    // A coming-soon event may go without a cover for now: it gets the branded logo cover.
    if (!(event.comingSoon && sharp)) errors.push(`cover image is missing - put a cover.jpg in events/${folder}/`);
  } else {
    event.coverPath = path.join(dir, coverName);
    const coverErr = await checkCover(event.coverPath);
    if (coverErr) errors.push(coverErr);
  }

  if (errors.length) problems.push([`events/${folder}`, errors]);
  else events.push(event);
}

if (problems.length) fail(problems);

// ---------- build ----------

// Logos (made by scripts/make-logo.js) are inlined into the pages.
const logo = inlinePng(path.join(ROOT, 'assets', 'logo.png'));
const logoDark = inlinePng(path.join(ROOT, 'assets', 'logo-dark.png'));

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });

const site = {
  siteUrl: config.siteUrl,
  instagramUrl: config.instagramUrl,
  instagramHandle: config.instagramHandle,
  whatsapp: config.whatsapp,
  notifyUrl: config.notifyUrl || '',
  mainSiteUrl: config.mainSite || '',
  logo,
  logoDark,
  iconUrl: copyAsset(path.join(ROOT, 'assets', 'icon.png'), 'icon'),
  homeOg: await buildHomeOgImage(),
};

const warnings = [];
for (const e of events) {
  const outDir = path.join(DIST_DIR, e.slug);
  fs.mkdirSync(outDir, { recursive: true });

  const cover = await processCover(e);
  fs.writeFileSync(path.join(outDir, cover.file), cover.buffer);
  if (cover.buffer.length > WHATSAPP_SAFE_BYTES) {
    warnings.push(`${e.slug}: cover is ${Math.round(cover.buffer.length / 1024)} KB. WhatsApp may skip images over ~300 KB.`);
  }
  const ratio = cover.width / cover.height;
  if (Math.abs(ratio - 1.91) > 0.15) {
    warnings.push(`${e.slug}: cover is ${cover.width}x${cover.height}. 1200x630 (1.91:1) is recommended.`);
  }

  const pageUrl = `${config.siteUrl}/${e.slug}/`;
  if (e.accentColor) e.accent = { color: e.accentColor, on: textColorOn(e.accentColor) };
  e.highlights = await processHighlights(e, outDir, warnings);

  // QR code: PNG for printing, SVG for designers, and a printable card page
  fs.writeFileSync(path.join(outDir, 'qr.png'), await QRCode.toBuffer(pageUrl, { width: 1200, margin: 2, errorCorrectionLevel: 'M' }));
  fs.writeFileSync(path.join(outDir, 'qr.svg'), await QRCode.toString(pageUrl, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }));
  const qrInline = await QRCode.toString(pageUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0a0a0aff', light: '#ffffff00' } });
  fs.mkdirSync(path.join(outDir, 'qr'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'qr', 'index.html'), renderQrPage(e, pageUrl, qrInline, site));

  const html = renderEventPage(e, {
    pageUrl,
    imageUrl: `${pageUrl}${cover.file}`,
    imageFile: cover.file,
    width: cover.width,
    height: cover.height,
    mime: cover.mime,
    focus: { top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' }[e.coverPosition],
    ogDescription: [e.date, e.comingSoon ? 'הגלריה בהכנה ותעלה בקרוב' : e.description].filter(Boolean).join(' · '),
  }, site);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  e.pageUrl = pageUrl;
  e.coverFile = cover.file;
}

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), renderHomePage(site));
fs.writeFileSync(path.join(DIST_DIR, '404.html'), renderNotFoundPage(site));
fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');

// ---------- report ----------

console.log(c.green(c.bold(`✓ Built ${events.length} event page(s) into dist/`)));
console.log(c.dim(`  Home: ${config.siteUrl}/`));
for (const e of events) {
  const tag = e.comingSoon ? c.yellow(' [coming soon]') : '';
  console.log(`  ${c.bold(e.slug.padEnd(24))} ${e.pageUrl}${tag}  ${c.dim(`QR: ${e.pageUrl}qr/`)}`);
}
if (!events.length) console.log(c.dim('  (no events yet - run "npm run new-event" or duplicate events/_example)'));
for (const w of warnings) console.warn(c.yellow(`! ${w}`));

// ---------- helpers ----------

function inlinePng(file) {
  if (!fs.existsSync(file)) return null;
  const buf = fs.readFileSync(file);
  return { src: `data:image/png;base64,${buf.toString('base64')}`, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Copies an asset into dist/assets/ with a content hash in its name; returns its absolute URL.
function copyAsset(file, name) {
  if (!fs.existsSync(file)) return '';
  const buf = fs.readFileSync(file);
  const out = `${name}-${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8)}${path.extname(file)}`;
  fs.writeFileSync(path.join(DIST_DIR, 'assets', out), buf);
  return `${config.siteUrl}/assets/${out}`;
}

// 1200x630 image of the logo on the dark background (home page preview + default cover).
async function brandCover() {
  const logoFile = path.join(ROOT, 'assets', 'logo.png');
  if (!sharp || !fs.existsSync(logoFile)) return null;
  if (brandCoverCache) return brandCoverCache;
  const logoBuf = await sharp(logoFile).resize({ width: 640 }).toBuffer();
  const meta = await sharp(logoBuf).metadata();
  const lineY = Math.round(OG_HEIGHT / 2 + meta.height / 2 + 34);
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#1d1c1a"/><stop offset="1" stop-color="#0a0a0a"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="570" y="${lineY}" width="60" height="2" fill="#f4f1ea" fill-opacity=".35"/></svg>`);
  const buf = await sharp(bg)
    .composite([{ input: logoBuf, left: Math.round((OG_WIDTH - meta.width) / 2), top: Math.round((OG_HEIGHT - meta.height) / 2) }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  brandCoverCache = buf;
  return buf;
}

async function buildHomeOgImage() {
  const buf = await brandCover();
  if (!buf) return null;
  const file = `og-home-${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8)}.jpg`;
  fs.writeFileSync(path.join(DIST_DIR, 'assets', file), buf);
  return { url: `${config.siteUrl}/assets/${file}`, width: OG_WIDTH, height: OG_HEIGHT };
}

// Optional events/<slug>/highlights/*.jpg -> small 4:5 thumbnails shown under the button.
async function processHighlights(e, outDir, warnings) {
  const dir = path.join(EVENTS_DIR, e.folder, 'highlights');
  if (!fs.existsSync(dir)) return [];
  let files = fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f)).sort();
  if (!files.length) return [];
  if (!sharp) { warnings.push(`${e.slug}: highlights need "sharp" - run npm install`); return []; }
  if (files.length > MAX_HIGHLIGHTS) {
    warnings.push(`${e.slug}: ${files.length} highlight images found, only the first ${MAX_HIGHLIGHTS} are used`);
    files = files.slice(0, MAX_HIGHLIGHTS);
  }
  const out = [];
  for (const f of files) {
    const source = fs.readFileSync(path.join(dir, f));
    const hash = crypto.createHash('sha256').update(source).update(`|h${PIPELINE_VERSION}`).digest('hex').slice(0, 8);
    const buffer = await sharp(source).rotate()
      .resize(480, 600, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 78, mozjpeg: true, progressive: true })
      .toBuffer();
    const file = `h-${hash}.jpg`;
    fs.writeFileSync(path.join(outDir, file), buffer);
    out.push({ file, width: 480, height: 600 });
  }
  return out;
}

// Black or white text, whichever has more contrast on the given background colour.
function textColorOn(hex) {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16)));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#0a0a0a' : '#ffffff';
}

function fail(list) {
  console.error(c.red(c.bold('\n✗ Build failed. Please fix the following:\n')));
  for (const [where, errs] of list) {
    console.error(c.bold(`  ${where}`));
    for (const err of errs) console.error(c.red(`    - ${err}`));
  }
  console.error('');
  process.exit(1);
}

async function checkCover(file) {
  if (sharp) {
    try {
      const meta = await sharp(file).metadata();
      if (!meta.width || !meta.height) return 'cover image could not be read';
      if (meta.width < 600) return `cover image is only ${meta.width}px wide - use at least 1200x630`;
    } catch (err) {
      return `cover image could not be read (${err.message})`;
    }
    return null;
  }
  if (!/\.(jpe?g|png)$/i.test(file)) return 'without "sharp" installed only cover.jpg / cover.png are supported';
  return readImageSize(fs.readFileSync(file)) ? null : 'cover image could not be read (is it a real JPEG/PNG?)';
}

async function processCover(e) {
  if (!e.coverPath) {
    const buffer = await brandCover();
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8);
    e.brandCover = true;
    return { buffer, file: `cover-${hash}.jpg`, width: OG_WIDTH, height: OG_HEIGHT, mime: 'image/jpeg' };
  }
  const source = fs.readFileSync(e.coverPath);
  // The filename hash depends only on the source image and pipeline settings, so it
  // stays the same across builds and only changes when you replace the cover.
  const hash = crypto.createHash('sha256')
    .update(source)
    .update(`|v${PIPELINE_VERSION}|${sharp ? 'sharp' : 'raw'}|${e.coverPosition}`)
    .digest('hex')
    .slice(0, 8);

  if (sharp) {
    const focusY = parsePercent(e.coverPosition);
    if (focusY != null) {
      // Vertical focus point for tall (portrait) covers: "30%" keeps the band around 30% from the top.
      const { data, info } = await sharp(source).rotate().resize({ width: OG_WIDTH }).toBuffer({ resolveWithObject: true });
      if (info.height > OG_HEIGHT) {
        const top = Math.round(Math.min(Math.max(focusY * info.height - OG_HEIGHT / 2, 0), info.height - OG_HEIGHT));
        const crop = (quality) => sharp(data)
          .extract({ left: 0, top, width: OG_WIDTH, height: OG_HEIGHT })
          .jpeg({ quality, mozjpeg: true, progressive: true })
          .toBuffer();
        let buffer = await crop(82);
        if (buffer.length > WHATSAPP_SAFE_BYTES) buffer = await crop(70);
        return { buffer, file: `cover-${hash}.jpg`, width: OG_WIDTH, height: OG_HEIGHT, mime: 'image/jpeg' };
      }
    }
    const pipeline = (quality) => sharp(source)
      .rotate() // respect EXIF orientation
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: parsePercent(e.coverPosition) != null ? 'center' : e.coverPosition === 'attention' ? sharp.strategy.attention : e.coverPosition,
      })
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();
    let buffer = await pipeline(82);
    if (buffer.length > WHATSAPP_SAFE_BYTES) buffer = await pipeline(70);
    return { buffer, file: `cover-${hash}.jpg`, width: OG_WIDTH, height: OG_HEIGHT, mime: 'image/jpeg' };
  }

  const size = readImageSize(source);
  const isPng = /\.png$/i.test(e.coverPath);
  return {
    buffer: source,
    file: `cover-${hash}.${isPng ? 'png' : 'jpg'}`,
    width: size.width,
    height: size.height,
    mime: isPng ? 'image/png' : 'image/jpeg',
  };
}

// "30%" -> 0.3, anything else -> null
function parsePercent(value) {
  const m = /^(\d{1,3})%$/.exec(value);
  return m && Number(m[1]) <= 100 ? Number(m[1]) / 100 : null;
}

// Minimal JPEG/PNG dimension reader, used only when sharp is unavailable.
function readImageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}
