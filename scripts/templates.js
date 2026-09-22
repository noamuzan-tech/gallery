// HTML templates. Everything (CSS included) is inlined so each page is a single
// small request, and all Open Graph tags are static text inside <head>.

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230a0a0a'/%3E%3Ctext x='32' y='41' font-family='Arial,sans-serif' font-size='24' font-weight='600' letter-spacing='2' fill='%23f4f1ea' text-anchor='middle'%3ENU%3C/text%3E%3C/svg%3E";

// "23.09.2026" -> "2026-09-23" (for the <time datetime> attribute). Returns null if not DD.MM.YYYY.
function isoDate(date) {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(String(date).trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const BASE_CSS = `
:root{--bg:#0a0a0a;--fg:#f4f1ea;--muted:#a8a49c;--line:rgba(244,241,234,.14);--ease:cubic-bezier(.2,.7,.2,1)}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100svh;background:var(--bg);color:var(--fg);
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Heebo","Assistant","Noto Sans Hebrew",Roboto,Arial,sans-serif;
line-height:1.5;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
img{display:block;max-width:100%}
.brand{margin:0;display:flex;flex-direction:column;align-items:center;gap:.55rem;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.brand-name{font-size:.95rem;font-weight:500;letter-spacing:.42em;margin-right:-.42em}
.brand-sub{font-size:.62rem;font-weight:400;letter-spacing:.6em;margin-right:-.6em;color:var(--muted)}
.rule{width:36px;height:1px;background:var(--line);border:0;margin:1.75rem auto}
.foot{margin-top:auto;padding:2.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom));text-align:center;font-size:.75rem;letter-spacing:.06em;color:var(--muted)}
.foot p{margin:0}
.up{opacity:0;animation:up .9s var(--ease) forwards}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}}
`;

const EVENT_CSS = `
.ambient{position:fixed;inset:-10%;width:120%;height:120%;max-width:none;object-fit:cover;z-index:-2;
filter:blur(60px) saturate(1.15);opacity:.26;transform:translateZ(0);pointer-events:none}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
background:linear-gradient(180deg,rgba(10,10,10,.35) 0%,rgba(10,10,10,.85) 55%,var(--bg) 100%)}
.page{width:100%;max-width:1040px;margin:0 auto}
.hero{position:relative;margin:0;overflow:hidden;aspect-ratio:4/3;max-height:62vh;max-height:62svh;width:100%;
-webkit-mask-image:linear-gradient(180deg,#000 70%,transparent 100%);mask-image:linear-gradient(180deg,#000 70%,transparent 100%)}
.hero img{width:100%;height:100%;object-fit:cover;object-position:var(--pos,center);animation:reveal 1.4s var(--ease) both}
@keyframes reveal{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:none}}
.content{position:relative;margin-top:-.75rem;padding:0 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center}
.title{margin:0;font-size:clamp(1.65rem,6.4vw,2.6rem);line-height:1.2;font-weight:700;letter-spacing:-.01em;max-width:22ch;text-wrap:balance}
.date{margin:.9rem 0 0;font-size:.95rem;color:var(--muted);letter-spacing:.14em;font-variant-numeric:tabular-nums}
.desc{margin:1rem 0 0;font-size:1.02rem;color:#d6d2ca;max-width:34ch;text-wrap:pretty}
.cta{margin-top:2.25rem;display:inline-flex;align-items:center;justify-content:center;gap:.75rem;
width:100%;max-width:420px;min-height:60px;padding:1rem 1.75rem;border-radius:999px;
background:var(--fg);color:#0a0a0a;text-decoration:none;font-size:1.08rem;font-weight:600;
box-shadow:0 10px 30px -10px rgba(244,241,234,.35);
transition:transform .25s var(--ease),box-shadow .25s var(--ease),background-color .25s}
.cta svg{width:20px;height:20px;flex:none;transition:transform .25s var(--ease)}
.cta:hover{transform:translateY(-2px);box-shadow:0 16px 40px -12px rgba(244,241,234,.45);background:#fff}
.cta:hover svg{transform:translateX(-4px)}
.cta:active{transform:translateY(0) scale(.99)}
.cta:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.hint{margin:.9rem 0 0;font-size:.78rem;color:var(--muted)}
.content>.up:nth-child(1){animation-delay:.25s}
.content>.up:nth-child(2){animation-delay:.35s}
.content>.up:nth-child(3){animation-delay:.45s}
.content>.up:nth-child(4){animation-delay:.55s}
.content>.up:nth-child(5){animation-delay:.65s}
.content>.up:nth-child(6){animation-delay:.75s}
.content>.up:nth-child(7){animation-delay:.85s}
@media (min-width:600px) and (max-width:767px){.hero{aspect-ratio:16/9}}
@media (min-width:768px){
.page{padding:3rem 2rem 0}
.hero{aspect-ratio:1200/630;max-height:none;width:min(100%,calc(52vh * 1.905));margin:0 auto;border-radius:18px;box-shadow:0 40px 80px -30px rgba(0,0,0,.8);-webkit-mask-image:none;mask-image:none}
.content{margin-top:2.5rem}
}
`;

const HOME_CSS = `
.home{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem 1.5rem}
.home .brand-name{font-size:clamp(1.3rem,5vw,1.9rem)}
.home .brand-sub{font-size:clamp(.7rem,2.4vw,.85rem)}
.home h1{margin:0;font-size:.85rem;font-weight:400;letter-spacing:.28em;margin-right:-.28em;text-transform:uppercase;color:var(--muted)}
.home p.msg{margin:1rem 0 0;color:var(--muted);font-size:.95rem;max-width:32ch}
.home a{color:var(--fg);text-underline-offset:4px}
.home a:focus-visible{outline:2px solid var(--fg);outline-offset:4px;border-radius:2px}
.home>.up:nth-child(1){animation-delay:.1s}
.home>.up:nth-child(2){animation-delay:.3s}
.home>.up:nth-child(3){animation-delay:.45s}
.home>.up:nth-child(4){animation-delay:.6s}
`;

const BRAND = `<p class="brand" lang="en" dir="ltr"><span class="brand-name">NOAM UZAN</span><span class="brand-sub">PHOTOGRAPHY</span></p>`;
const FOOTER = `<footer class="foot"><p lang="en" dir="ltr">&copy; Noam Uzan Photography</p></footer>`;

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>`;

function commonHead() {
  return `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a0a0a">
<meta name="color-scheme" content="dark">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${FAVICON}">`;
}

/**
 * Event landing page.
 * e: { slug, title, date, description, driveUrl, coverAlt }
 * og: { pageUrl, imageUrl, imageFile, width, height, mime, ogDescription }
 */
export function renderEventPage(e, og) {
  const iso = isoDate(e.date);
  const dateHtml = iso ? `<time datetime="${iso}">${esc(e.date)}</time>` : esc(e.date);
  const alt = e.coverAlt || `${e.title} – ${e.date}`;

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${esc(e.title)} | Noam Uzan Photography</title>
<meta name="description" content="${esc(og.ogDescription)}">
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Noam Uzan Photography">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(e.title)}">
<meta property="og:description" content="${esc(og.ogDescription)}">
<meta property="og:url" content="${esc(og.pageUrl)}">
<meta property="og:image" content="${esc(og.imageUrl)}">
<meta property="og:image:secure_url" content="${esc(og.imageUrl)}">
<meta property="og:image:type" content="${og.mime}">
<meta property="og:image:width" content="${og.width}">
<meta property="og:image:height" content="${og.height}">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(e.title)}">
<meta name="twitter:description" content="${esc(og.ogDescription)}">
<meta name="twitter:image" content="${esc(og.imageUrl)}">
<link rel="canonical" href="${esc(og.pageUrl)}">
${commonHead()}
<link rel="preload" as="image" href="${esc(og.imageFile)}" fetchpriority="high">
<style>${BASE_CSS}${EVENT_CSS}</style>
</head>
<body>
<img class="ambient" src="${esc(og.imageFile)}" alt="" aria-hidden="true" decoding="async">
<main class="page">
<figure class="hero"${og.focus ? ` style="--pos:${og.focus}"` : ''}>
<img src="${esc(og.imageFile)}" width="${og.width}" height="${og.height}" alt="${esc(alt)}" fetchpriority="high" decoding="async">
</figure>
<section class="content" aria-labelledby="event-title">
<div class="up">${BRAND}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="title up" id="event-title">${esc(e.title)}</h1>
<p class="date up">${dateHtml}</p>
${e.description ? `<p class="desc up">${esc(e.description)}</p>` : ''}
<a class="cta up" href="${esc(e.driveUrl)}" rel="noopener noreferrer">
<span>לצפייה בגלריה המלאה</span>${ARROW}
</a>
<p class="hint up">הגלריה נפתחת ב-Google Drive</p>
</section>
</main>
${FOOTER}
</body>
</html>
`;
}

export function renderHomePage(siteUrl) {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<title>Noam Uzan Photography</title>
<meta name="description" content="Photography Galleries by Noam Uzan Photography">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Noam Uzan Photography">
<meta property="og:title" content="Noam Uzan Photography">
<meta property="og:description" content="Photography Galleries">
<meta property="og:url" content="${esc(siteUrl)}/">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${esc(siteUrl)}/">
${commonHead()}
<style>${BASE_CSS}${HOME_CSS}</style>
</head>
<body>
<main class="home">
<div class="up">${BRAND}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="up">Photography Galleries</h1>
<p class="msg up">Received a gallery link? Open it directly from your message.</p>
</main>
${FOOTER}
</body>
</html>
`;
}

export function renderNotFoundPage(siteUrl) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>הדף לא נמצא | Noam Uzan Photography</title>
<meta name="robots" content="noindex, nofollow">
${commonHead()}
<style>${BASE_CSS}${HOME_CSS}</style>
</head>
<body>
<main class="home">
<div class="up">${BRAND}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="up" lang="en" dir="ltr">Page not found</h1>
<p class="msg up">הקישור שגוי או שהגלריה אינה זמינה. מומלץ לבדוק שהקישור הועתק במלואו. <a href="${esc(siteUrl)}/">לדף הבית</a></p>
</main>
${FOOTER}
</body>
</html>
`;
}
