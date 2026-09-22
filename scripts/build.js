#!/usr/bin/env node
// Builds dist/ from events/*/event.json + cover image.
//
//   dist/index.html            home page (does NOT list events)
//   dist/404.html
//   dist/<slug>/index.html     event landing page with static Open Graph tags
//   dist/<slug>/cover-<hash>.jpg
//
// Folders in events/ whose name starts with "_" or "." (like events/_example) are skipped.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  EVENTS_DIR, DIST_DIR, COVER_NAMES,
  readConfig, validateSlug, validateDriveUrl,
} from './lib.js';
import { renderEventPage, renderHomePage, renderNotFoundPage } from './templates.js';

// Bump this if the image pipeline below changes, so every cover gets a new filename
// (and WhatsApp is forced to fetch it again).
const PIPELINE_VERSION = '1';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const COVER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right', 'attention'];
const WHATSAPP_SAFE_BYTES = 300 * 1024;

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
  };

  if (!errors.length) {
    const slugErr = validateSlug(event.slug);
    if (slugErr) errors.push(slugErr);
    else if (event.slug !== folder) {
      errors.push(`slug "${event.slug}" must match the folder name "${folder}" (rename the folder or fix the slug)`);
    }
    if (!event.title) errors.push('title is missing');
    if (!event.date) errors.push('date is missing');
    const driveErr = validateDriveUrl(event.driveUrl);
    if (driveErr) errors.push(driveErr);
    if (!COVER_POSITIONS.includes(event.coverPosition)) {
      errors.push(`coverPosition must be one of: ${COVER_POSITIONS.join(', ')}`);
    }
  }

  const coverName = COVER_NAMES.find((n) => fs.existsSync(path.join(dir, n)));
  if (!coverName) {
    errors.push(`cover image is missing - put a cover.jpg in events/${folder}/`);
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

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

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
  const html = renderEventPage(e, {
    pageUrl,
    imageUrl: `${pageUrl}${cover.file}`,
    imageFile: cover.file,
    width: cover.width,
    height: cover.height,
    mime: cover.mime,
    focus: { top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' }[e.coverPosition],
    ogDescription: [e.date, e.description].filter(Boolean).join(' · '),
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  e.pageUrl = pageUrl;
  e.coverFile = cover.file;
}

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), renderHomePage(config.siteUrl));
fs.writeFileSync(path.join(DIST_DIR, '404.html'), renderNotFoundPage(config.siteUrl));
fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');

// ---------- report ----------

console.log(c.green(c.bold(`✓ Built ${events.length} event page(s) into dist/`)));
console.log(c.dim(`  Home: ${config.siteUrl}/`));
for (const e of events) {
  console.log(`  ${c.bold(e.slug.padEnd(24))} ${e.pageUrl}  ${c.dim(e.coverFile)}`);
}
if (!events.length) console.log(c.dim('  (no events yet - run "npm run new-event" or duplicate events/_example)'));
for (const w of warnings) console.warn(c.yellow(`! ${w}`));

// ---------- helpers ----------

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
  const source = fs.readFileSync(e.coverPath);
  // The filename hash depends only on the source image and pipeline settings, so it
  // stays the same across builds and only changes when you replace the cover.
  const hash = crypto.createHash('sha256')
    .update(source)
    .update(`|v${PIPELINE_VERSION}|${sharp ? 'sharp' : 'raw'}|${e.coverPosition}`)
    .digest('hex')
    .slice(0, 8);

  if (sharp) {
    const pipeline = (quality) => sharp(source)
      .rotate() // respect EXIF orientation
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: e.coverPosition === 'attention' ? sharp.strategy.attention : e.coverPosition,
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
