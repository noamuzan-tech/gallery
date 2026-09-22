# Noam Uzan Photography: Gallery Links

A small, free static site that gives **every event its own permanent landing page** and its own **WhatsApp link preview** (cover image + title + description). The big button on each page opens the event's Google Drive gallery.

```
https://USERNAME.github.io/gallery/                  → home page (does not list events)
https://USERNAME.github.io/gallery/beitar-maccabi/   → event page
https://USERNAME.github.io/gallery/hapoel-akko/      → event page
```

Hosting is GitHub Pages (free). There's no server, database or paid service: a Node.js script turns the `events/` folder into plain HTML.

---

## ⚠️ Important: this is NOT a password or access control

- An event page is **not protected**. **Anyone who has or discovers the URL can open it** and click through to the Drive link.
- Event pages include `<meta name="robots" content="noindex, nofollow">`, aren't linked from the home page and aren't in any sitemap. That makes them *less likely* to show up in Google. It doesn't make them private.
- **On the free GitHub plan the repository must be public for GitHub Pages to work.** So anyone who finds your repository on GitHub can see every `events/*/event.json`, including titles and Drive links.
- The real access control is the **Google Drive sharing setting** on each folder. If a gallery must stay private, share the Drive folder only with specific Google accounts rather than "Anyone with the link".

---

## Project structure

```
gallery/
├── site.config.json          ← YOUR GITHUB USERNAME GOES HERE (siteUrl)
├── package.json
├── events/
│   ├── _example/             ← template to duplicate (never published)
│   │   ├── event.json
│   │   └── cover.jpg
│   └── beitar-maccabi/       ← one folder per event
│       ├── event.json
│       └── cover.jpg
├── scripts/
│   ├── build.js              ← npm run build
│   ├── new-event.js          ← npm run new-event
│   ├── preview.js            ← npm run preview
│   ├── templates.js          ← page HTML + CSS (design lives here)
│   └── lib.js
├── .github/workflows/deploy.yml  ← automatic deploy to GitHub Pages
└── dist/                     ← generated output (not committed)
```

---

## 1. Initial GitHub setup (one time)

1. Install **Node.js 20 or newer** from <https://nodejs.org> (the LTS version is fine).
2. Install **Git** from <https://git-scm.com>, or use **GitHub Desktop** if you prefer buttons over commands.
3. Create a free account at <https://github.com> if you don't have one.
4. Create a new repository named exactly **`gallery`** and make it **Public**. Don't add a README, .gitignore or license, since this project already has them.
   *The repository name becomes part of the URL:* `https://USERNAME.github.io/gallery/`. If you choose a different name, use it in `siteUrl` too.
5. In this project folder, run:

   ```bash
   npm install
   git init -b main
   git add .
   git commit -m "Initial gallery site"
   git remote add origin https://github.com/USERNAME/gallery.git
   git push -u origin main
   ```

## 2. Enable GitHub Pages (one time)

1. On GitHub, open your `gallery` repository and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. That's all. Every push to `main` now deploys the site automatically (see section 9).

## 3. Where to enter your GitHub username

There's exactly **one** place: **`site.config.json`**.

```json
{
  "siteUrl": "https://USERNAME.github.io/gallery"
}
```

Replace `USERNAME` with your GitHub username, for example `https://noamuzan.github.io/gallery`. Leave off the trailing slash.
Optional: `"whatsapp": "0501234567"` shows a "רוצים צילום לאירוע שלכם?" section with a WhatsApp button (pre-filled message mentioning the event). Leave it empty to hide it.

Optional: add `"instagram": "your_handle"` (or a full Instagram URL) to show a clickable Instagram icon at the bottom of every page. Leave it empty to hide the icon.

Every Open Graph URL is built from this value. The automatic deployment **refuses to build** while it still says `USERNAME`, so you can't publish broken previews by mistake.

## 4. Create your first event

**Option A: interactive helper (easiest)**

```bash
npm run new-event
```

It asks for:

```
Event slug (e.g. beitar-maccabi): beitar-maccabi
Event title: בית״ר ירושלים נגד מכבי תל אביב
Event date (DD.MM.YYYY): 23.09.2026
Description (optional): גלריית התמונות המלאה מהמשחק
Google Drive URL: https://drive.google.com/drive/folders/...
```

and creates `events/beitar-maccabi/event.json`. Then **put your cover image at `events/beitar-maccabi/cover.jpg`**.

**Option B: by hand**

1. Copy the folder `events/_example`.
2. Rename the copy, e.g. `events/beitar-maccabi`.
3. Replace `cover.jpg` inside it with your cover.
4. Edit `event.json`:

```json
{
  "slug": "beitar-maccabi",
  "title": "בית״ר ירושלים נגד מכבי תל אביב",
  "date": "23.09.2026",
  "description": "גלריית התמונות המלאה מהמשחק",
  "driveUrl": "https://drive.google.com/drive/folders/1AbCdEf..."
}
```

| Field | Required | Notes |
|---|---|---|
| `slug` | ✅ | Must be **identical to the folder name**. Use only lowercase English letters, numbers and hyphens. It becomes the URL. |
| `title` | ✅ | Hebrew or English. Shown on the page and in the WhatsApp preview. |
| `date` | ✅ | Shown as written. `DD.MM.YYYY` is recommended. |
| `description` | optional | Short line shown on the page and in the WhatsApp preview. |
| `driveUrl` | ✅ | Must start with `https://`. |
| `coverAlt` | optional | Accessibility text for the cover. Defaults to "title – date". |
| `accentColor` | optional | Hex colour for the button, e.g. `"#f5c400"`. See section 15. |
| `comingSoon` | optional | `true` = gallery not ready yet (no Drive link needed). See section 15. |
| `coverPosition` | optional | How to crop a cover that isn't 1.91:1: `center` (default), `top`, `bottom`, `left`, `right`, `attention` (auto-detects the interesting area), or a **height percentage** such as `"30%"` for portrait photos (keeps the strip around 30% from the top, e.g. the player's face). |

Then build and publish:

```bash
npm run build
git add .
git commit -m "Add beitar-maccabi"
git push
```

Wait about 1–2 minutes and the page is live at `https://USERNAME.github.io/gallery/beitar-maccabi/`.

## 5. Add another event

Repeat section 4 with a new slug. **Don't delete or rename old event folders.** Each folder *is* that event's permanent page. Adding a new event never changes the URLs or metadata of existing events, because each page is built only from its own folder.

## 6. Choose or change a cover

- Recommended: **1200 × 630 px** (1.91:1), JPG. Larger images also work.
- Supported file names: `cover.jpg`, `cover.jpeg`, `cover.png`, `cover.webp`.
- The build automatically resizes/crops to 1200×630, compresses to a WhatsApp-friendly size (usually well under 300 KB) and saves it with a unique name like `cover-a83f29c1.jpg`.
- The name is a hash of the image, so **it changes only when you replace the image**. Rebuilding without changes keeps the same file name.
- On phones the landing page shows a taller crop of the cover (4:3). The WhatsApp preview always uses the full 1200×630 image.

To change a cover, replace `events/<slug>/cover.jpg`, then build and push. The page will point to the new `cover-xxxxxxxx.jpg` file.

## 7. Enter the Google Drive link

1. In Google Drive, right-click the event folder and choose **Share → Share**.
2. Under *General access*, choose **Anyone with the link → Viewer** (or restrict to specific people, see the warning at the top).
3. Click **Copy link** and paste it as `driveUrl` in `event.json`.

Don't use Drive for the cover image. The cover must live in the event folder so GitHub Pages serves it directly. WhatsApp can't reliably read images hosted on Drive.

## 8. Build and preview locally

```bash
npm install        # first time only
npm run build      # validates all events, then creates dist/
npm run preview    # opens a local server at http://localhost:4173/
```

Open `http://localhost:4173/beitar-maccabi/` in your browser.

The build **stops with a clear list of problems** if anything is wrong, for example:

```
✗ Build failed. Please fix the following:

  events/hapoel-akko
    - title is missing
    - driveUrl must start with https:// (got "http://...")
    - cover image is missing - put a cover.jpg in events/hapoel-akko/
```

It checks for: missing slug, title, date, driveUrl or cover; unsafe slugs; slug ≠ folder name; non-HTTPS Drive links; placeholder Drive links; and unreadable or too-small cover images.

(`dist/` is regenerated from scratch on every build and isn't committed. GitHub builds it again during deployment.)

## 9. How automatic deployment works

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Installs dependencies (`npm ci`)
2. Runs `npm run build` (the same validation as locally, so a broken event stops the deploy and the live site stays as it was)
3. Uploads `dist/` and publishes it to GitHub Pages

You can watch it under the **Actions** tab of your repository. A green check means it's live. If it's red, click it to see the same error message you'd see locally.

## 10. How WhatsApp previews work

When you paste a link, WhatsApp downloads the page's HTML and reads the **Open Graph** tags in `<head>`:

```html
<meta property="og:title" content="בית״ר ירושלים נגד מכבי תל אביב">
<meta property="og:description" content="23.09.2026 · גלריית התמונות המלאה מהמשחק">
<meta property="og:image" content="https://USERNAME.github.io/gallery/beitar-maccabi/cover-a83f29c1.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://USERNAME.github.io/gallery/beitar-maccabi/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

WhatsApp doesn't run JavaScript, so these tags are written **directly into the static HTML** by the build. The pages contain no JavaScript at all. The image URL is **absolute HTTPS** and points at GitHub Pages.

Tips for reliable previews:
- The link must be the full `https://` URL.
- The cover should stay under ~300 KB (the build handles this).
- Send the link **with a trailing slash**: `.../beitar-maccabi/`. Without it GitHub Pages redirects, which usually works but is one extra step.

## 11. WhatsApp caching behavior

- WhatsApp **caches a preview per URL**. After it has seen a link once, it may keep showing the old title/image for that exact URL for a long time, even after you update the page.
- Previews already sent in a chat **never change**. They're stored in the message.
- The unique `cover-<hash>.jpg` name means a changed cover is always a *new* image URL. So WhatsApp can't mix up an old cached image file with your new one once it re-reads the page.

## 12. If WhatsApp still shows an old image

1. Make sure the deployment finished (green check under **Actions**), then wait a few minutes. GitHub Pages' own CDN caches for up to about 10 minutes.
2. **Add a version parameter to the link** you send. WhatsApp treats it as a new URL, and GitHub Pages ignores the parameter and shows the same page:

   ```
   https://USERNAME.github.io/gallery/beitar-maccabi/?v=2
   ```

3. Refresh Meta's cache: open the **Facebook Sharing Debugger** (<https://developers.facebook.com/tools/debug/>), paste the URL and click **Scrape Again**.
4. Paste the link into a **new** chat (or a chat with yourself) rather than editing an old message.

## 13. Verify the generated Open Graph metadata

**Locally, after `npm run build`:**

```bash
grep -E "og:|twitter:" dist/beitar-maccabi/index.html
```

(On Windows PowerShell: `Select-String -Path dist\beitar-maccabi\index.html -Pattern "og:|twitter:"`)

Check that `og:image` starts with `https://USERNAME.github.io/gallery/beitar-maccabi/cover-`.

**On the live site:**

```bash
curl -s https://USERNAME.github.io/gallery/beitar-maccabi/ | grep -E "og:|twitter:"
```

Or use one of these online tools:
- <https://developers.facebook.com/tools/debug/> (Meta, closest to WhatsApp)
- <https://www.opengraph.xyz/>
- In the browser: right-click → **View page source**. The tags must be visible there, not only in DevTools.

Also open the `og:image` URL itself in a browser. It should show the cover image.

## 14. Using your own custom domain (optional, later)

Example: `https://gallery.noamuzan.com`

1. Buy a domain from any registrar.
2. At the registrar's DNS settings, add a **CNAME** record: name `gallery`, value `USERNAME.github.io`.
3. On GitHub: **Settings → Pages → Custom domain**, enter `gallery.noamuzan.com` and save. When it's available, tick **Enforce HTTPS**.
4. Update `site.config.json`. Note: the domain now points straight at this site, so there's **no `/gallery` path**:

   ```json
   { "siteUrl": "https://gallery.noamuzan.com" }
   ```

5. Build, commit and push.

GitHub automatically redirects the old `USERNAME.github.io/gallery/...` links to the new domain, so links you already sent keep working. Their WhatsApp previews in old messages won't change.

---

## 15. Extra features

### Accent colour per event
Add `"accentColor": "#f5c400"` to `event.json`. The main button, the small divider and the "coming soon" badge use that colour. Text on the button automatically switches between black and white for contrast.

### "Coming soon" pages (print the QR before the gallery exists)
Create the event without a Drive link and add `"comingSoon": true`:

```json
{
  "slug": "derby-2026",
  "title": "מכבי נגד הפועל",
  "date": "30.09.2026",
  "driveUrl": "",
  "comingSoon": true
}
```

The page shows **"הגלריה בהכנה"** and a big **"עקבו באינסטגרם"** button (grows your followers, and nobody needs to message you). When the gallery is ready, **paste the Drive link into `driveUrl`** and push. The page switches to the normal gallery page automatically, at the same URL, so the printed QR code keeps working. (`npm run new-event` does this for you if you leave the Drive URL empty.)

To collect newsletter sign-ups instead, add `"notifyUrl": "https://..."` (a sign-up form) to `site.config.json`: the main button becomes **"עדכנו אותי כשהגלריה עולה"** and Instagram moves to a secondary button.

WhatsApp caches previews: people who got the link while it was "coming soon" may still see "הגלריה בהכנה" in the old preview text. The page itself is always up to date.

### QR codes
Every build creates, per event:
- `https://gallery.noamuzan.media/<slug>/qr/`: a printable A5 card (logo, title, QR). Use "הדפסה או שמירה כקובץ PDF".
- `.../<slug>/qr.png`: the QR alone, 1200 px
- `.../<slug>/qr.svg`: vector, for a designer

### Highlights strip
Put up to 8 photos in `events/<slug>/highlights/` (any names, `.jpg/.png/.webp`). They're cropped to 4:5 around the interesting part, compressed, and shown as a swipeable "רגעים מהגלריה" strip under the button. Without that folder, nothing is shown. (Later, an automatic Drive picker can simply fill this folder.)

### Site-wide settings (`site.config.json`)

| Key | Meaning |
|---|---|
| `siteUrl` | Public address of the site (no trailing slash). |
| `instagram` | Instagram handle. Shows the Instagram icon, the tag request and the Instagram button on coming-soon pages. |
| `whatsapp` | Phone number. Shows the "רוצים צילום לאירוע שלכם?" booking button. |
| `mainSite` | Your main website. Linked from the home page. |
| `notifyUrl` | Optional newsletter sign-up form for coming-soon pages. Replaces Instagram as the main button. |

## Quick reference

```bash
npm run new-event   # create a new event folder interactively
npm run build       # validate + generate dist/
npm run preview     # view dist/ at http://localhost:4173/
git add . && git commit -m "Add event" && git push   # publish
```

Design and wording (colors, fonts, button text, footer) live in `scripts/templates.js`.

**Logo:** the original is `assets/logo-source.webp`. `npm run logo` turns it into `assets/logo.png` (light bar, see-through letters) which is embedded in every page. To change the logo, replace `logo-source.*` (same style: white letters on a black bar) and run `npm run logo`, then build.
