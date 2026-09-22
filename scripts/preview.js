#!/usr/bin/env node
// Tiny local server for checking dist/ in a browser: npm run preview
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DIST_DIR } from './lib.js';

const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ does not exist yet. Run "npm run build" first.');
  process.exit(1);
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST_DIR, path.normalize(urlPath).replace(/^([/\\])+/, ''));
  if (!file.startsWith(DIST_DIR)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith('/')) { res.writeHead(301, { Location: `${urlPath}/` }).end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    fs.createReadStream(path.join(DIST_DIR, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Preview running at http://localhost:${PORT}/`);
  console.log('(Open Graph tags point to your real GitHub Pages URL; previews only work after deploying.)');
});
