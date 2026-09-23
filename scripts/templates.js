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

// "23.09.2026" -> "2026-09-23" (for the <time datetime> attribute). Returns null if not DD.MM.YYYY.
function isoDate(date) {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(String(date).trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// --accent / --on-accent can be overridden per event (event.json "accentColor").
const BASE_CSS = `
:root{--bg:#0a0a0a;--fg:#f4f1ea;--muted:#a8a49c;--line:rgba(244,241,234,.14);--accent:#f4f1ea;--on-accent:#0a0a0a;--ease:cubic-bezier(.2,.7,.2,1)}
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
.rule{width:36px;height:1px;border:0;margin:1.75rem auto;background:color-mix(in srgb,var(--accent) 45%,transparent)}
.foot{margin-top:auto;padding:2.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom));text-align:center;font-size:.75rem;letter-spacing:.06em;color:var(--muted)}
.foot p{margin:0}
.social{display:flex;justify-content:center;gap:1rem;margin-bottom:1.1rem}
.social a,.ig-dot{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;color:#fff;
background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285aeb 90%);
box-shadow:0 6px 18px -6px rgba(214,36,159,.55);transition:transform .25s var(--ease),box-shadow .25s var(--ease),filter .25s}
.social a:hover{transform:translateY(-2px) scale(1.04);filter:brightness(1.08);box-shadow:0 10px 24px -6px rgba(214,36,159,.7)}
.social a:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
.social svg,.ig-dot svg{width:22px;height:22px}
.book{margin:3.5rem auto 0;padding:0 1.5rem;text-align:center;max-width:480px;width:100%}
.book-card{border-top:1px solid var(--line);padding-top:2.25rem}
.book h2{margin:0;font-size:1.15rem;font-weight:600}
.book p{margin:.5rem 0 0;font-size:.92rem;color:var(--muted)}
.wa{margin-top:1.25rem;display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:50px;padding:.75rem 1.6rem;border-radius:999px;
background:#25d366;color:#07351b;text-decoration:none;font-weight:600;font-size:.98rem;transition:transform .25s var(--ease),filter .25s}
.wa:hover{transform:translateY(-2px);filter:brightness(1.06)}
.wa:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.wa svg{width:20px;height:20px;flex:none}
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
width:100%;max-width:420px;min-height:60px;padding:1rem 1.75rem;border-radius:999px;border:0;
background:var(--accent);color:var(--on-accent);text-decoration:none;font:inherit;font-size:1.08rem;font-weight:600;cursor:pointer;
box-shadow:0 10px 30px -10px color-mix(in srgb,var(--accent) 45%,transparent);
transition:transform .25s var(--ease),box-shadow .25s var(--ease),filter .25s}
.cta svg{width:20px;height:20px;flex:none;transition:transform .25s var(--ease)}
.cta:hover{transform:translateY(-2px);filter:brightness(1.07);box-shadow:0 16px 40px -12px color-mix(in srgb,var(--accent) 60%,transparent)}
.cta:hover svg.arrow{transform:translateX(-4px)}
.cta:active{transform:translateY(0) scale(.99)}
.cta:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.hint{margin:.9rem 0 0;font-size:.78rem;color:var(--muted)}
.ghost{margin-top:.9rem;display:inline-flex;align-items:center;justify-content:center;gap:.6rem;
width:100%;max-width:420px;min-height:52px;padding:.8rem 1.5rem;border-radius:999px;border:1px solid rgba(244,241,234,.28);
background:transparent;color:var(--fg);text-decoration:none;font:inherit;font-size:1rem;font-weight:500;cursor:pointer;
transition:background-color .25s,border-color .25s,transform .25s var(--ease)}
.ghost[hidden]{display:none}
.ghost:hover{background:rgba(244,241,234,.06);border-color:rgba(244,241,234,.5)}
.ghost:active{transform:scale(.99)}
.ghost:focus-visible{outline:3px solid var(--fg);outline-offset:4px}
.ghost svg{width:18px;height:18px;flex:none}
.ghost .ig-dot{width:26px;height:26px;box-shadow:none}
.ghost .ig-dot svg{width:15px;height:15px}
.strip-wrap{margin-top:2.25rem;width:calc(100% + 3rem);margin-inline:-1.5rem}
.strip-label{margin:0 0 .8rem;font-size:.75rem;letter-spacing:.18em;color:var(--muted)}
.strip{display:flex;gap:.6rem;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 1.5rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.strip::-webkit-scrollbar{display:none}
.strip a{flex:0 0 40%;max-width:190px;aspect-ratio:4/5;border-radius:12px;overflow:hidden;scroll-snap-align:center;background:#161616}
.strip a:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.strip img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
.strip a:hover img{transform:scale(1.04)}
.soon{margin-top:2rem;width:100%;max-width:420px;padding:1.6rem 1.25rem 1.4rem;border:1px solid var(--line);border-radius:22px;background:rgba(244,241,234,.03)}
.badge{display:inline-flex;align-items:center;gap:.55rem;padding:.35rem .95rem;border-radius:999px;font-size:.82rem;font-weight:600;
color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent)}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.soon p{margin:1rem 0 0;font-size:.98rem;color:#d6d2ca;text-wrap:pretty}
.soon .cta{margin-top:1.4rem}
.credit{margin:1.75rem 0 0;font-size:.88rem;color:var(--muted)}
.credit a{color:var(--fg);text-decoration:none;border-bottom:1px solid rgba(244,241,234,.35);direction:ltr;unicode-bidi:isolate}
.credit a:hover{border-color:var(--fg)}
.credit a:focus-visible{outline:2px solid var(--fg);outline-offset:3px;border-radius:2px}
.help{margin-top:1.5rem;width:100%;max-width:420px;border:1px solid var(--line);border-radius:16px;text-align:start;background:rgba(244,241,234,.02)}
.help summary{list-style:none;cursor:pointer;padding:1rem 1.25rem;font-size:.95rem;font-weight:500;display:flex;align-items:center;justify-content:space-between;gap:1rem;border-radius:16px}
.help summary::-webkit-details-marker{display:none}
.help summary::after{content:"+";font-size:1.3rem;line-height:1;color:var(--accent);transition:transform .25s var(--ease)}
.help[open] summary::after{transform:rotate(45deg)}
.help summary:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.help-body{padding:0 1.25rem 1.1rem;font-size:.9rem;color:#d6d2ca}
.help-body h3{margin:.9rem 0 .35rem;font-size:.85rem;font-weight:600;color:var(--fg)}
.help-body ol{margin:0;padding-inline-start:1.2rem}
.help-body li{margin:.2rem 0}
.help-body p{margin:.6rem 0 0}
.referral summary{gap:.6rem;justify-content:flex-start}
.referral summary::after{margin-inline-start:auto}
.referral summary svg{width:20px;height:20px;flex:none;color:var(--accent)}
.referral .lead{margin-top:.2rem;color:var(--fg)}
.ref-form{margin-top:1rem;display:flex;flex-direction:column;gap:.6rem}
.ref-form[hidden]{display:none}
.ref-form label{font-size:.82rem;color:var(--muted)}
.ref-form input{font:inherit;font-size:1rem;padding:.8rem 1rem;border-radius:12px;border:1px solid rgba(244,241,234,.28);background:rgba(244,241,234,.04);color:var(--fg);width:100%}
.ref-form input:focus-visible{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}
.ref-form .cta{margin-top:.2rem;min-height:52px;font-size:1rem}
.terms{margin-top:1rem;font-size:.78rem;color:var(--muted)}
.terms ul{margin:.35rem 0 0;padding-inline-start:1.1rem}
.terms li{margin:.15rem 0}
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
.strip{justify-content:center}
}
`;

const HOME_CSS = `
.home{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem 1.5rem 0}
.home .brand-name{font-size:clamp(1.3rem,5vw,1.9rem)}
.home .brand-logo{width:min(320px,76vw)}
.home .brand-sub{font-size:clamp(.7rem,2.4vw,.85rem)}
.home h1{margin:0;font-size:.85rem;font-weight:400;letter-spacing:.28em;margin-right:-.28em;text-transform:uppercase;color:var(--muted)}
.home p.msg{margin:1rem 0 0;color:var(--muted);font-size:.95rem;max-width:32ch}
.home a{color:var(--fg);text-underline-offset:4px}
.home a:focus-visible{outline:2px solid var(--fg);outline-offset:4px;border-radius:2px}
.home .site-link{margin-top:2rem;display:inline-flex;align-items:center;gap:.5rem;padding:.8rem 1.5rem;border:1px solid rgba(244,241,234,.28);border-radius:999px;
text-decoration:none;font-size:.9rem;letter-spacing:.08em;transition:background-color .25s,border-color .25s}
.home .site-link:hover{background:rgba(244,241,234,.06);border-color:rgba(244,241,234,.5)}
.home>.up:nth-child(1){animation-delay:.1s}
.home>.up:nth-child(2){animation-delay:.3s}
.home>.up:nth-child(3){animation-delay:.45s}
.home>.up:nth-child(n+4){animation-delay:.6s}
.book.up{animation-delay:.75s}
`;

// Printable QR card (white, for printing). Uses the dark logo.
const QR_CSS = `
:root{--ink:#0a0a0a;--paper:#fff;--accent:#0a0a0a}
*{box-sizing:border-box}
body{margin:0;background:#e9e7e2;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Heebo","Assistant","Noto Sans Hebrew",Roboto,Arial,sans-serif;
display:flex;flex-direction:column;align-items:center;padding:2rem 1rem;gap:1.25rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.card{width:min(420px,100%);aspect-ratio:1/1.414;background:var(--paper);border-radius:10px;box-shadow:0 20px 50px -20px rgba(0,0,0,.35);
display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:9% 9% 7%;text-align:center}
.card .logo{width:62%;height:auto}
.card .sub{margin:.5rem 0 0;font:500 .62rem/1 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.6em;margin-right:-.6em;color:#555}
.card h1{margin:0;font-size:1.35rem;line-height:1.25;text-wrap:balance}
.card .date{margin:.35rem 0 0;font-size:.85rem;color:#555;letter-spacing:.1em}
.card .qr{width:62%;aspect-ratio:1;padding:3%;border-radius:12px;border:2px solid var(--accent)}
.card .qr svg{display:block;width:100%;height:100%}
.card .scan{margin:0;font-size:1rem;font-weight:700}
.card .url{margin:.3rem 0 0;font-size:.62rem;color:#666;direction:ltr;word-break:break-all}
.tools{display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center}
.tools a,.tools button{font:inherit;font-size:.9rem;padding:.7rem 1.2rem;border-radius:999px;border:1px solid #0a0a0a;background:#0a0a0a;color:#fff;text-decoration:none;cursor:pointer}
.tools a{background:transparent;color:#0a0a0a}
.tools :focus-visible{outline:3px solid #0a0a0a;outline-offset:3px}
@media print{body{background:#fff;padding:0}.tools{display:none}.card{box-shadow:none;border-radius:0;width:148mm;height:210mm;aspect-ratio:auto}@page{size:A5;margin:0}}
`;

// ---------- shared pieces ----------

// site.logo is a data: URI of assets/logo.png (inlined, so no extra request). Falls back to text.
function brand(site) {
  const name = site.logo
    ? `<img class="brand-logo" src="${site.logo.src}" width="${site.logo.width}" height="${site.logo.height}" alt="NOAM UZAN">`
    : '<span class="brand-name">NOAM UZAN</span>';
  return `<p class="brand" lang="en" dir="ltr">${name}<span class="brand-sub">PHOTOGRAPHY</span></p>`;
}

const INSTAGRAM_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor" stroke="none"/></svg>`;
const SHARE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`;
const CHAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>`;
const BELL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`;
const ARROW = `<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>`;

function footer({ instagramUrl }) {
  const social = instagramUrl
    ? `<nav class="social" aria-label="Social"><a href="${esc(instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram - Noam Uzan Photography">${INSTAGRAM_ICON}</a></nav>`
    : '';
  return `<footer class="foot">${social}<p lang="en" dir="ltr">&copy; Noam Uzan Photography</p></footer>`;
}

function waLink(site, text) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Copy per audience: sport credentials on game pages, personal-event focus on other events,
// a general version on the home page (type '').
const BOOKING_COPY = {
  game: {
    title: 'רוצים צילום למשחק שלכם?',
    lines: [
      'עבדתי עם מועדוני כדורגל מובילים בליגת העל, והצילומים שלי פורסמו במגוון רחב של אתרים ופלטפורמות.',
      'משחקים, טורנירים ואירועי ספורט. שלחו לי הודעה ונתאם.',
    ],
  },
  event: {
    title: 'רוצים צילום לאירוע שלכם?',
    lines: [
      'בר ובת מצווה, אירועים משפחתיים ואירועי חברה. צילום מקצועי ודיסקרטי, שתופס את הרגעים האמיתיים ומגיע אליכם בגלריה מסודרת, בדיוק כמו זו.',
      'שלחו לי הודעה ונתאם.',
    ],
  },
  '': {
    title: 'רוצים צילום לאירוע שלכם?',
    lines: [
      'צילומי ספורט, אירועים פרטיים ואירועי חברה, עם גלריה מסודרת ומוכנה לשיתוף.',
      'שלחו לי הודעה ונתאם.',
    ],
  },
};

function bookingSection(site, eventTitle, extraClass = '', type = '') {
  if (!site.whatsapp) return '';
  const text = eventTitle
    ? `היי נועם, הגעתי מהגלריה "${eventTitle}" ואשמח לשמוע על צילום ${type === 'game' ? 'למשחק' : 'לאירוע'} שלנו`
    : 'היי נועם, אשמח לשמוע על צילום לאירוע שלנו';
  const copy = BOOKING_COPY[type] || BOOKING_COPY.event;
  return `<section class="book${extraClass}" lang="he" dir="rtl" aria-labelledby="book-title"><div class="book-card">
<h2 id="book-title">${copy.title}</h2>
${copy.lines.map((l) => `<p>${l}</p>`).join('\n')}
<a class="wa" href="${esc(waLink(site, text))}" target="_blank" rel="noopener noreferrer">${CHAT_ICON}<span>שליחת הודעה בוואטסאפ</span></a>
</div></section>`;
}

// Icon for browser tabs / home-screen (assets/icon.png, absolute URL so it works from any page)
function commonHead(site) {
  const icon = site.iconUrl ? `\n<link rel="icon" type="image/png" href="${esc(site.iconUrl)}">\n<link rel="apple-touch-icon" href="${esc(site.iconUrl)}">` : '';
  return `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a0a0a">
<meta name="color-scheme" content="dark">
<meta name="format-detection" content="telephone=no">${icon}`;
}

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

// ---------- referral offer (game shoots only) ----------

const GIFT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>`;

// "2026-10-31" -> "31.10.2026"
const displayDate = (iso) => iso.split('-').reverse().join('.');

// Shown on "type": "game" events while site.referral.until hasn't passed (checked at build time,
// and again in the browser so the offer disappears on its own after the deadline).
function referralBlock(e, site) {
  const r = site.referral;
  if (e.type !== 'game' || !r || !site.whatsapp) return '';
  const until = displayDate(r.until);
  return `<details class="help referral up" data-until="${esc(r.until)}">
<summary>${GIFT_ICON}<span>הטבה לשחקנים: חבר מביא חבר</span></summary>
<div class="help-body">
<p class="lead">אהבתם את התמונות? המליצו עליי לחברים. על כל חבר שיזמין צילום משחק בזכותכם, תקבלו <strong>${r.amount} ₪ בביט</strong>, מתנה ממני.</p>
<h3>איך זה עובד</h3>
<ol>
<li>כתבו את השם שלכם למטה ולחצו "שליחה לחבר".</li>
<li>החבר מקבל הודעה עם קישור אליי בוואטסאפ, שהשם שלכם כבר כתוב בה.</li>
<li>אחרי שהמשחק שלו צולם והתשלום הושלם, ${r.amount} ₪ עוברים אליכם בביט.</li>
</ol>
<form class="ref-form" id="ref-form" hidden data-phone="${esc(site.whatsapp)}">
<label for="ref-name">השם המלא שלכם</label>
<input id="ref-name" name="name" type="text" autocomplete="name" required placeholder="לדוגמה: יוסי כהן">
<button class="cta" type="submit">${SHARE_ICON}<span>שליחה לחבר</span></button>
</form>
<div class="terms">
<strong>תנאי ההטבה</strong>
<ul>
<li>בתוקף להזמנות שיתואמו עד ${until}.</li>
<li>החבר צריך לציין את שמכם המלא בהודעה הראשונה שהוא שולח אליי. לא ניתן להוסיף ממליץ בדיעבד.</li>
<li>ההטבה ניתנת על הזמנת צילום משחק בלבד, לאחר שהצילום בוצע והתשלום התקבל במלואו.</li>
<li>החבר צריך להיות לקוח חדש, שלא הזמין ממני צילום בעבר.</li>
<li>אין הגבלה על מספר החברים: כל הזמנה שעומדת בתנאים מזכה ב-${r.amount} ₪.</li>
<li>אם כמה אנשים המליצו על אותו חבר, ההטבה תינתן למי ששמו צוין בהודעה.</li>
<li>הזיכוי יועבר בביט תוך 7 ימים מהשלמת התשלום, ואינו ניתן להמרה או לשילוב עם הטבות אחרות.</li>
<li>אני רשאי לעדכן את תנאי ההטבה או להפסיק אותה בכל עת.</li>
</ul>
</div>
</div>
</details>`;
}

const REFERRAL_SCRIPT = `(function(){var d=document.querySelector('.referral');if(!d)return;
if(new Date()>new Date(d.dataset.until+'T23:59:59+03:00')){d.remove();return}
var f=document.getElementById('ref-form');f.hidden=false;
f.addEventListener('submit',function(ev){ev.preventDefault();var n=f.name.value.trim();if(!n)return;
var ask='היי נועם, הגעתי בהמלצה של '+n+' ואשמח לתאם צילום משחק';
var link='https://wa.me/'+f.dataset.phone+'?text='+encodeURIComponent(ask);
var msg='היי! נועם עוזן צילם אותי במשחק והתמונות יצאו מעולות 📸 רוצה גם? שלח לו הודעה דרך הקישור הזה (השם שלי כבר כתוב בה): '+link;
if(navigator.share){navigator.share({text:msg}).catch(function(){});}
else{window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener');}})})();`;

// ---------- event page ----------

function highlightsStrip(e) {
  if (!e.highlights?.length) return '';
  const items = e.highlights.map((h, i) => {
    const img = `<img src="${esc(h.file)}" width="${h.width}" height="${h.height}" alt="${esc(`${e.title} – תמונה ${i + 1}`)}" loading="lazy" decoding="async">`;
    return e.comingSoon ? `<a tabindex="-1" aria-hidden="true">${img}</a>` : `<a href="${esc(e.driveUrl)}" rel="noopener noreferrer">${img}</a>`;
  }).join('');
  return `<div class="strip-wrap up"><p class="strip-label">רגעים מהגלריה</p><div class="strip">${items}</div></div>`;
}

function ctaBlock(e, site) {
  if (!e.comingSoon) {
    return `<a class="cta up" href="${esc(e.driveUrl)}" rel="noopener noreferrer">
<span>לצפייה בגלריה המלאה</span>${ARROW}
</a>
<p class="hint up">הגלריה נפתחת בגוגל דרייב</p>`;
  }
  // Coming soon: Instagram is the main call to action (grows followers, no flood of WhatsApp messages).
  // If site.notifyUrl is set (a newsletter sign-up form), it becomes the main button and Instagram the secondary one.
  const notify = site.notifyUrl
    ? `<a class="cta" href="${esc(site.notifyUrl)}" target="_blank" rel="noopener noreferrer">${BELL_ICON}<span>עדכנו אותי כשהגלריה עולה</span></a>`
    : '';
  const ig = site.instagramUrl
    ? notify
      ? `<a class="ghost" href="${esc(site.instagramUrl)}" target="_blank" rel="noopener noreferrer"><span class="ig-dot">${INSTAGRAM_ICON}</span><span>בינתיים, באינסטגרם</span></a>`
      : `<a class="cta" href="${esc(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">${INSTAGRAM_ICON}<span>עקבו באינסטגרם</span></a>
<p class="hint" dir="ltr">@${esc(site.instagramHandle)}</p>`
    : '';
  const text = notify
    ? 'התמונות יעלו לכאן בקרוב, בדיוק בקישור הזה. רוצים לקבל הודעה ברגע שהן עולות?'
    : site.instagramUrl
      ? 'התמונות יעלו לכאן בקרוב, בדיוק בקישור הזה. בינתיים, עקבו באינסטגרם ותהיו הראשונים לדעת כשהגלריה עולה.'
      : 'התמונות יעלו לכאן בקרוב, בדיוק בקישור הזה.';
  return `<div class="soon up">
<span class="badge">הגלריה בהכנה</span>
<p>${text}</p>
${notify}
${ig}
</div>`;
}

/**
 * Event landing page.
 * e: { slug, title, date, description, driveUrl, coverAlt, comingSoon, highlights, accent }
 * og: { pageUrl, imageUrl, imageFile, width, height, mime, ogDescription, focus }
 */
export function renderEventPage(e, og, site) {
  const iso = isoDate(e.date);
  const dateHtml = iso ? `<time datetime="${iso}">${esc(e.date)}</time>` : esc(e.date);
  const alt = e.coverAlt || `${e.title} – ${e.date}`;
  const accentStyle = e.accent ? ` style="--accent:${e.accent.color};--on-accent:${e.accent.on}"` : '';
  const credit = site.instagramHandle && !e.comingSoon
    ? `<p class="credit up">מעלים לאינסטגרם? אשמח לתיוג <a href="${esc(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">@${esc(site.instagramHandle)}</a></p>`
    : '';

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
${commonHead(site)}
<link rel="preload" as="image" href="${esc(og.imageFile)}" fetchpriority="high">
<style>${BASE_CSS}${EVENT_CSS}</style>
</head>
<body${accentStyle}>
<img class="ambient" src="${esc(og.imageFile)}" alt="" aria-hidden="true" decoding="async">
<main class="page">
<figure class="hero"${og.focus ? ` style="--pos:${og.focus}"` : ''}>
<img src="${esc(og.imageFile)}" width="${og.width}" height="${og.height}" alt="${esc(alt)}" fetchpriority="high" decoding="async">
</figure>
<section class="content" aria-labelledby="event-title">
${e.brandCover ? '' : `<div class="up">${brand(site)}</div>
<hr class="rule up" aria-hidden="true">`}
<h1 class="title up" id="event-title">${esc(e.title)}</h1>
<p class="date up">${dateHtml}</p>
${e.description ? `<p class="desc up">${esc(e.description)}</p>` : ''}
${ctaBlock(e, site)}
${highlightsStrip(e)}
<button class="ghost up" id="share" type="button" hidden data-url="${esc(og.pageUrl)}" data-title="${esc(e.title)}">${SHARE_ICON}<span>שיתוף הגלריה</span></button>
${credit}
${e.comingSoon ? '' : DOWNLOAD_HELP}
${referralBlock(e, site)}
</section>
</main>
${bookingSection(site, e.title, '', e.type || 'event')}
${footer(site)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>${SHARE_SCRIPT}${e.type === 'game' && site.referral ? REFERRAL_SCRIPT : ''}</script>
</body>
</html>
`;
}

// ---------- printable QR page (dist/<slug>/qr/) ----------

export function renderQrPage(e, pageUrl, qrSvg, site) {
  const accent = e.accent ? ` style="--accent:${e.accent.color}"` : '';
  const logo = site.logoDark
    ? `<img class="logo" src="${site.logoDark.src}" width="${site.logoDark.width}" height="${site.logoDark.height}" alt="NOAM UZAN">`
    : '<strong lang="en">NOAM UZAN</strong>';
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>QR – ${esc(e.title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width,initial-scale=1">
${site.iconUrl ? `<link rel="icon" type="image/png" href="${esc(site.iconUrl)}">` : ''}
<style>${QR_CSS}</style>
</head>
<body${accent}>
<article class="card">
<div>${logo}<p class="sub" lang="en" dir="ltr">PHOTOGRAPHY</p></div>
<div><h1>${esc(e.title)}</h1><p class="date">${esc(e.date)}</p></div>
<div class="qr" role="img" aria-label="QR code לגלריה">${qrSvg}</div>
<div><p class="scan">סרקו לצפייה בגלריה</p><p class="url">${esc(pageUrl.replace(/^https:\/\//, ''))}</p></div>
</article>
<div class="tools">
<button type="button" onclick="print()">הדפסה או שמירה כקובץ PDF</button>
<a href="../qr.png" download>הורדת QR בלבד (PNG)</a>
<a href="../qr.svg" download>SVG לגרפיקאי</a>
</div>
</body>
</html>
`;
}

// ---------- home + 404 ----------

export function renderHomePage(site) {
  const { siteUrl } = site;
  const og = site.homeOg
    ? `<meta property="og:image" content="${esc(site.homeOg.url)}">
<meta property="og:image:width" content="${site.homeOg.width}">
<meta property="og:image:height" content="${site.homeOg.height}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(site.homeOg.url)}">`
    : '<meta name="twitter:card" content="summary">';
  const mainSite = site.mainSiteUrl
    ? `<a class="site-link up" href="${esc(site.mainSiteUrl)}">${esc(site.mainSiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} <span aria-hidden="true">→</span></a>`
    : '';
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
${og}
<link rel="canonical" href="${esc(siteUrl)}/">
${commonHead(site)}
<style>${BASE_CSS}${HOME_CSS}</style>
</head>
<body>
<main class="home">
<div class="up">${brand(site)}</div>
<hr class="rule up" aria-hidden="true">
<h1 class="up">Photography Galleries</h1>
<p class="msg up">Received a gallery link? Open it directly from your message.</p>
${mainSite}
</main>
${bookingSection(site, '', ' up')}
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
${commonHead(site)}
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
