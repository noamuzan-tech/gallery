// Shared helpers for build.js and new-event.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EVENTS_DIR = path.join(ROOT, 'events');
export const DIST_DIR = path.join(ROOT, 'dist');
export const CONFIG_FILE = path.join(ROOT, 'site.config.json');

// Lowercase letters, digits and single hyphens. e.g. "beitar-maccabi", "wedding-cohen-2026"
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Folder names that would clash with site files
export const RESERVED_SLUGS = new Set(['assets', '404', 'index', 'events', 'dist']);

export const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];

export function readConfig() {
  const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const siteUrl = String(raw.siteUrl || '').trim().replace(/\/+$/, '');
  // "instagram" may be a handle ("noamuzan", "@noamuzan") or a full URL. Empty = no icon.
  const ig = String(raw.instagram || '').trim();
  const instagramUrl = !ig ? '' : /^https?:\/\//.test(ig) ? ig : `https://www.instagram.com/${ig.replace(/^@/, '')}/`;
  // "whatsapp": phone number for the booking button, e.g. "0501234567" or "972501234567". Empty = no button.
  let whatsapp = String(raw.whatsapp || '').replace(/\D/g, '');
  if (whatsapp.startsWith('0')) whatsapp = `972${whatsapp.slice(1)}`;
  const instagramHandle = instagramUrl ? instagramUrl.replace(/\/+$/, '').split('/').pop() : '';
  return { ...raw, siteUrl, instagramUrl, instagramHandle, whatsapp };
}

export function validateSlug(slug) {
  if (!slug) return 'slug is missing';
  if (!SLUG_RE.test(slug)) {
    return `slug "${slug}" is not URL-safe. Use only lowercase English letters, numbers and hyphens (e.g. "beitar-maccabi")`;
  }
  if (RESERVED_SLUGS.has(slug)) return `slug "${slug}" is reserved, please choose another name`;
  return null;
}

export function validateDriveUrl(url) {
  if (!url) return 'driveUrl is missing';
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return `driveUrl "${url}" is not a valid URL`;
  }
  if (parsed.protocol !== 'https:') return `driveUrl must start with https:// (got "${url}")`;
  if (/REPLACE|\.\.\.$/i.test(url)) return 'driveUrl still contains the placeholder value, paste the real Google Drive link';
  return null;
}
