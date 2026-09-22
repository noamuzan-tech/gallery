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
.brand-logo{width:min(200px,56vw);height:auto}
.brand-sub{font-size:.62rem;font-weight:400;letter-spacing:.6em;margin-right:-.6em;color:var(--muted)}
.rule{width:36px;height:1px;background:var(--line);border:0;margin:1.75rem auto}
.foot{margin-top:auto;padding:2.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom));text-align:center;font-size:.75rem;letter-spacing:.06em;color:var(--muted)}
.foot p{margin:0}
.social{display:flex;justify-content:center;gap:1rem;margin-bottom:1.1rem}
.social a{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;color:#fff;
background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285aeb 90%);
box-shadow:0 6px 18px -6px rgba(214,36,159,.55);transition:transform .25s var(--ease),box-shadow .25s var(--ease),filter .25s}
.social a:hover{transform:translateY(-2px) scale(1.04);filter:brightness(1.08);box-shadow:0 10px 24px -6px rgba(214,36,159,.7)}
.social a:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
.social svg{width:22px;height:22px}
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
.share{margin-top:.9rem;display:inline-flex;align-items:center;justify-content:center;gap:.6rem;
width:100%;max-width:420px;min-height:52px;padding:.8rem 1.5rem;border-radius:999px;border:1px solid rgba(244,241,234,.28);
background:transparent;color:var(--fg);font:inherit;font-size:1rem;font-weight:500;cursor:pointer;
transition:background-color .25s,border-color .25s,transform .25s var(--ease)}
.share[hidden]{display:none}
.share:hover{background:rgba(244,241,234,.06);border-color:rgba(244,241,234,.5)}
.share:active{transform:scale(.99)}
.share:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.share svg{width:18px;height:18px;flex:none}
.credit{margin:1.75rem 0 0;font-size:.88rem;color:var(--muted)}
.credit a{color:var(--fg);text-decoration:none;border-bottom:1px solid rgba(244,241,234,.35);direction:ltr;unicode-bidi:isolate}
.credit a:hover{border-color:var(--fg)}
.credit a:focus-visible{outline:2px solid var(--fg);outline-offset:3px;border-radius:2px}
.help{margin-top:1.5rem;width:100%;max-width:420px;border:1px solid var(--line);border-radius:16px;text-align:start;background:rgba(244,241,234,.02)}
.help summary{list-style:none;cursor:pointer;padding:1rem 1.25rem;font-size:.95rem;font-weight:500;display:flex;align-items:center;justify-content:space-between;gap:1rem;border-radius:16px}
.help summary::-webkit-details-marker{display:none}
.help summary::after{content:"+";font-size:1.3rem;line-height:1;color:var(--muted);transition:transform .25s var(--ease)}
.help[open] summary::after{transform:rotate(45deg)}
.help summary:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.help-body{padding:0 1.25rem 1.1rem;font-size:.9rem;color:#d6d2ca}
.help-body h3{margin:.9rem 0 .35rem;font-size:.85rem;font-weight:600;color:var(--fg)}
.help-body ol{margin:0;padding-inline-start:1.2rem}
.help-body li{margin:.2rem 0}
.book{margin:3.5rem auto 0;padding:0 1.5rem;text-align:center;max-width:480px}
.book-card{border-top:1px solid var(--line);padding-top:2.25rem}
.book h2{margin:0;font-size:1.15rem;font-weight:600}
.book p{margin:.5rem 0 0;font-size:.92rem;color:var(--muted)}
.wa{margin-top:1.25rem;display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:50px;padding:.75rem 1.6rem;border-radius:999px;
background:#25d366;color:#07351b;text-decoration:none;font-weight:600;font-size:.98rem;transition:transform .25s var(--ease),filter .25s}
.wa:hover{transform:translateY(-2px);filter:brightness(1.06)}
.wa:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.wa svg{width:20px;height:20px;flex:none}
.toast{position:fixed;inset-inline:0;bottom:calc(1.5rem + env(safe-area-inset-bottom));margin:auto;width:max-content;max-width:90vw;
padding:.7rem 1.2rem;border-radius:999px;background:var(--fg);color:#0a0a0a;font-size:.9rem;font-weight:500;
opacity:0;transform:translateY(10px);transition:opacity .3s,transform .3s var(--ease);pointer-events:none}
.toast.show{opacity:1;transform:none}
.content>.up:nth-child(1){animation-delay:.25s}
.content>.up:nth-child(2){animation-delay:.35s}
.content>.up:nth-child(3){animation-delay:.45s}
.content>.up:nth-child(4){animation-delay:.55s}
.content>.up:nth-child(5){animation-delay:.65s}
.content>.up:nth-child(6){animation-delay:.75s}
.content>.up:nth-child(7){animation-delay:.85s}
.content>.up:nth-child(n+8){animation-delay:.95s}
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
.home .brand-logo{width:min(320px,76vw)}
.home .brand-logo{width:min(200px,56vw);height:auto}
.brand-sub{font-size:clamp(.7rem,2.4vw,.85rem)}
.home h1{margin:0;font-size:.85rem;font-weight:400;letter-spacing:.28em;margin-right:-.28em;text-transform:uppercase;color:var(--muted)}
.home p.msg{margin:1rem 0 0;color:var(--muted);font-size:.95rem;max-width:32ch}
.home a{color:var(--fg);text-underline-offset:4px}
.home a:focus-visible{outline:2px solid var(--fg);outline-offset:4px;border-radius:2px}
.home>.up:nth-child(1){animation-delay:.1s}
.home>.up:nth-child(2){animation-delay:.3s}
.home>.up:nth-child(3){animation-delay:.45s}
.home>.up:nth-child(4){animation-delay:.6s}
`;

// site.logo is a data: URI of assets/logo.png (inlined, so no extra request). Falls back to text.
function brand(site) {
  const name = site.logo
    ? `<img class="brand-logo" src="${site.logo.src}" width="${site.logo.width}" height="${site.logo.height}" alt="NOAM UZAN">`
    : '<span class="brand-name">NOAM UZAN</span>';
  return `<p class="brand" lang="en" dir="ltr">${name}<span class="brand-sub">PHOTOGRAPHY</span></p>`;
}
const INSTAGRAM_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor" stroke="none"/></svg>`;

function footer({ instagramUrl }) {
  const social = instagramUrl
    ? `<nav class="social" aria-label="Social"><a href="${esc(instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram - Noam Uzan Photography">${INSTAGRAM_ICON}</a></nav>`
    : '';
  return `<footer class="foot">${social}<p lang="en" dir="ltr">&copy; Noam Uzan Photography</p></footer>`;
}

const SHARE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`;

const CHAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>`;

// Minimal progressive enhancement: the share button stays hidden without JavaScript.
// Uses the phone's native share sheet, or copies the link on desktop.
const SHARE_SCRIPT = `(function(){var b=document.getElementById('share');if(!b)return;b.hidden=false;
var t=document.getElementById('toast');function toast(m){t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2200)}
b.addEventListener('click',function(){var d={title:b.dataset.title,url:b.dataset.url};
if(navigator.share){navigator.share(d).catch(function(){});return}
if(navigator.clipboard){navigator.clipboard.writeText(d.url).then(function(){toast('הקישור הועתק')},function(){prompt('העתיקו את הקישור:',d.url)})}
else{prompt('העתיקו את הקישור:',d.url)}})})();`;

const DOWNLOAD_HELP = `<details class="help up">
<summary>איך מורידים את התמונות?</summary>
<div class="help-body">
<h3>תמונה בודדת מהטלפון</h3>
<ol>
<li>לוחצים על "לצפייה בגלריה המלאה" ופותחים את התמונה.</li>
<li>לוחצים על שלוש הנקודות <span aria-hidden="true">⋮</span> ובוחרים "הורדה".</li>
<li>באייפון: בוחרים "שליחת עותק" ואז "שמירת תמונה", והיא נשמרת בגלריה.</li>
</ol>
<h3>כל הגלריה בבת אחת (מהמחשב)</h3>
<ol>
<li>פותחים את הגלריה במחשב.</li>
<li>לוחצים על שם התיקייה בראש העמוד ובוחרים "הורדה".</li>
<li>Google Drive מכין קובץ ZIP עם כל התמונות באיכות מלאה.</li>
</ol>
</div>
</details>`;

function bookingSection(site, eventTitle) {
  if (!site.whatsapp) return '';
  const text = `היי נועם, הגעתי מהגלריה "${eventTitle}" ואשמח לשמוע על צילום לאירוע שלנו`;
  const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
  return `<section class="book" aria-labelledby="book-title"><div class="book-card">
<h2 id="book-title">רוצים צילום לאירוע שלכם?</h2>
<p>משחקים, אירועי ספורט ואירועים פרטיים. שלחו לי הודעה ונתאם.</p>
<a class="wa" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${CHAT_ICON}<span>שליחת הודעה בוואטסאפ</span></a>
</div></section>`;
}

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
export function renderEventPage(e, og, site) {
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
<div class="up">${brand(site)}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="title up" id="event-title">${esc(e.title)}</h1>
<p class="date up">${dateHtml}</p>
${e.description ? `<p class="desc up">${esc(e.description)}</p>` : ''}
<a class="cta up" href="${esc(e.driveUrl)}" rel="noopener noreferrer">
<span>לצפייה בגלריה המלאה</span>${ARROW}
</a>
<p class="hint up">הגלריה נפתחת ב-Google Drive</p>
<button class="share up" id="share" type="button" hidden data-url="${esc(og.pageUrl)}" data-title="${esc(e.title)}">${SHARE_ICON}<span>שיתוף הגלריה</span></button>
${site.instagramHandle ? `<p class="credit up">מעלים לאינסטגרם? אשמח לתיוג <a href="${esc(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">@${esc(site.instagramHandle)}</a></p>` : ''}
${DOWNLOAD_HELP}
</section>
</main>
${bookingSection(site, e.title)}
${footer(site)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>${SHARE_SCRIPT}</script>
</body>
</html>
`;
}

export function renderHomePage(site) {
  const { siteUrl } = site;
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
<div class="up">${brand(site)}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="up">Photography Galleries</h1>
<p class="msg up">Received a gallery link? Open it directly from your message.</p>
</main>
${footer(site)}
</body>
</html>
`;
}

export function renderNotFoundPage(site) {
  const { siteUrl } = site;
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
<div class="up">${brand(site)}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="up" lang="en" dir="ltr">Page not found</h1>
<p class="msg up">הקישור שגוי או שהגלריה אינה זמינה. מומלץ לבדוק שהקישור הועתק במלואו. <a href="${esc(siteUrl)}/">לדף הבית</a></p>
</main>
${footer(site)}
</body>
</html>
`;
}
