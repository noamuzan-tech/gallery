#!/usr/bin/env node
// Interactive helper: npm run new-event
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { EVENTS_DIR, readConfig, validateSlug, validateDriveUrl } from './lib.js';

const rl = readline.createInterface({ input, output });
const lines = rl[Symbol.asyncIterator]();

async function ask(question, { required = true, validate } = {}) {
  for (;;) {
    output.write(question);
    const next = await lines.next();
    if (next.done) { console.log('\nCancelled.'); process.exit(1); }
    const answer = next.value.trim();
    if (!answer && !required) return '';
    if (!answer) { console.log('  This field is required.'); continue; }
    const err = validate?.(answer);
    if (err) { console.log(`  ${err}`); continue; }
    return answer;
  }
}

const slug = await ask('Event slug (e.g. beitar-maccabi): ', {
  validate: (s) => validateSlug(s) || (fs.existsSync(path.join(EVENTS_DIR, s)) ? `events/${s} already exists` : null),
});
const title = await ask('Event title: ');
const date = await ask('Event date (DD.MM.YYYY): ');
const description = await ask('Description (optional): ', { required: false });
const driveUrl = await ask('Google Drive URL (leave empty if the gallery is not ready yet): ', { required: false, validate: validateDriveUrl });
const accentColor = await ask('Accent colour (optional, e.g. #f5c400): ', {
  required: false,
  validate: (v) => (/^#[0-9a-f]{6}$/i.test(v) ? null : 'Use a hex colour like #f5c400'),
});
rl.close();

const event = { slug, title, date, description, driveUrl };
if (!driveUrl) event.comingSoon = true;
if (accentColor) event.accentColor = accentColor;

const dir = path.join(EVENTS_DIR, slug);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'event.json'), JSON.stringify(event, null, 2) + '\n');

const { siteUrl } = readConfig();
console.log(`
✓ Created events/${slug}/event.json

Now place your cover image at:
events/${slug}/cover.jpg

Then run "npm run build" and push. The page will be live at:
${siteUrl}/${slug}/

Printable QR code: ${siteUrl}/${slug}/qr/${driveUrl ? '' : `

Coming-soon mode is on. When the gallery is ready, just paste the Drive link
into events/${slug}/event.json ("driveUrl"), build and push.`}
`);
