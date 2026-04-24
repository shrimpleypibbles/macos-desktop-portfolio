# Setup Guide — Gabriel Kyne Portfolio

## Overview

Your portfolio reads all works from a CSV file (`data/works.csv`) that you maintain in a Google Sheet. The actual media files (audio, video, images, PDFs, text) live under `assets/`.

```
┌─────────────────┐   Export    ┌──────────────────┐   Fetched by
│  Google Sheet   │ ──────────▶ │  data/works.csv  │ ──────▶ index.html
└─────────────────┘   as CSV    └──────────────────┘

┌─────────────────┐             ┌──────────────────┐
│  Media files    │ ──────────▶ │    assets/       │ ──────▶ Played in
│  .mp3 .mp4 .pdf │   Upload    │  audio/ video/   │         browser on
│  .txt .jpg ...  │             │  images/ text/   │         double-click
└─────────────────┘             └──────────────────┘
```

---

## CSV Schema (9 columns)

| number | name | year | description | credits | notes | media-type | media-location | thumbnail-location |
|---|---|---|---|---|---|---|---|---|

See **`GOOGLE_SHEETS_TEMPLATE.md`** for a fuller breakdown. Short version:

- **number / name** — required.
- **year / description / credits / notes** — optional metadata. `year` + `description` become the subtitle under the icon; `credits` and `notes` are shown in the player.
- **media-type** — one of `audio`, `video`, `image`, `text`, `pdf`, `score`. Auto-detected from the file extension if left blank.
- **media-location / thumbnail-location** — paths to the files. See **Path Shortcut** below.

Legacy note: if your sheet still has `instrumentation` instead of `description`, it keeps working — they're treated as synonyms.

---

## Path Shortcut

You do **not** need to type `assets/` in front of every path. All of these resolve to the same file:

```
video/foo.mp4
/assets/video/foo.mp4
assets/video/foo.mp4
https://example.com/foo.mp4   ← full URLs are left alone
```

Just type `video/foo.mp4` or `thumbnails/foo.png` and the site does the rest.

---

## Media Players

Each `media-type` opens in a purpose-built player:

| media-type | Player | What you get |
|---|---|---|
| `audio` | Custom HTML5 audio | Play/pause, progress bar, waveform animation |
| `video` | HTML5 `<video>` | Native controls. **Does not autoplay.** |
| `image` | Image viewer | Full-size image + metadata footer |
| `text` | Text viewer | Monospace, scrollable |
| `pdf` / `score` | Embedded PDF iframe | Native browser PDF viewer |

If `media-type` is missing, the site guesses from the file extension. Unknown types show a warning.

---

## Update Workflow

Every time you want to change what's on the desktop:

1. **Upload any new media files:**
   - Audio → `assets/audio/`
   - Video → `assets/video/`
   - Images → `assets/images/`
   - Text → `assets/text/`
   - PDFs/scores → `assets/text/` (convention) or anywhere you like
   - Thumbnails → `assets/thumbnails/`
2. **Edit the Google Sheet** — add/edit/delete rows.
3. **Export** — File → Download → Comma-separated values (.csv).
4. **Drop in the CSV:**
   ```bash
   cp ~/Downloads/your-sheet.csv ~/Documents/macos-desktop-portfolio/data/works.csv
   ```
5. **Commit & push** (if using git):
   ```bash
   cd ~/Documents/macos-desktop-portfolio
   git add data/works.csv assets/
   git commit -m "Update works"
   git push
   ```
6. **Refresh the browser.** Done.

---

## Desktop Interactions

- **Click once** — select (faint blue highlight)
- **Double-click** — opens the file in the correct player
- **Drag** — moves the icon (position saved per-browser in `localStorage`)
- **First load** — icons scatter naturally around the center with a few drifting toward the edges. Looks hand-dragged.

---

## The Dock (Configuring Items)

The dock is driven by the `DOCK_ITEMS` array near the top of `index.html`. Each entry has an `id`, a `label` (shown as tooltip on hover), and an `action`. Example:

```js
const DOCK_ITEMS = [
  { id:'finder',   label:'Finder',   action:{ type:'section', section:'works' } },
  { id:'works',    label:'Works',    action:{ type:'section', section:'works' } },
  { id:'about',    label:'About Me', action:{ type:'section', section:'about' } },
  { id:'contact',  label:'Contact',  action:{ type:'section', section:'contact' } },
  { id:'teaching', label:'Teaching', action:{ type:'section', section:'teaching' } },
  // { id:'cv',        label:'CV',        action:{ type:'file', path:'text/cv.pdf' } },
  // { id:'instagram', label:'Instagram', action:{ type:'url',  url:'https://instagram.com/…' } },
];
```

Action types:

| `action.type` | What happens on click |
|---|---|
| `section` | Opens one of the built-in sections (`works`, `about`, `contact`, `teaching`) |
| `url` | Opens an external URL in a new tab |
| `file` | Opens a specific file (e.g. your CV) in the matching player |

The dock shows tooltips on hover and no zoom (you asked). A separator appears between the first item (Finder) and the rest.

### Dock Icon Images

By default, dock items show a built-in white SVG glyph (Finder, Works, About, Contact, Teaching have hand-drawn fallbacks). To replace one:

1. Drop a PNG into `assets/dock/` named after the `id`: `finder.png`, `works.png`, `cv.png`, etc.
2. Recommended size: **128×128px or larger**, square.
3. Refresh.

If a PNG is missing, the SVG fallback is used — so you can replace them one at a time.

> **About .icns files:** macOS uses `.icns` but browsers don't. Convert each icon to PNG first: open the `.icns` in Preview → File → Export → format: PNG → 256×256. Or use `iconutil` / `sips` on the command line. Then drop the PNG into `assets/dock/`.

---

## Menu Bar

The top bar mimics macOS: Apple logo + "Gabriel Kyne  Film Composer" + File/Edit/View/Window/Help on the left; volume icon, battery (charging), date + 24h time on the right.

To change the bold + light titles, edit these constants at the top of `index.html`:

```js
const APP_TITLE_BOLD  = 'Gabriel Kyne';
const APP_TITLE_LIGHT = 'Film Composer';
```

The menu items (File/Edit/View/…) are currently decorative (no dropdowns). Let me know if you want any of them to actually do something.

---

## Running Locally

A static server is required (the site uses `fetch()` for the CSV, which browsers block on `file://`):

**Option 1 — Python:**
```bash
cd ~/Documents/macos-desktop-portfolio
python3 -m http.server 8000
```

**Option 2 — Node:**
```bash
cd ~/Documents/macos-desktop-portfolio
npx serve .
```

Then open **http://localhost:8000**.

---

## Troubleshooting

### "Could not load data/works.csv"
- File must exist at `data/works.csv`.
- You must be serving over HTTP (see "Running Locally").

### Icons show a letter instead of a thumbnail
- Check that `thumbnail-location` points to a real file. Remember the path shortcut — `thumbnails/foo.png` is enough.
- Case matters on some servers: `foo.JPG` ≠ `foo.jpg`.

### Audio/video won't play
- Open the browser console (F12) and check for errors.
- Browser must support the codec (MP3, MP4/H.264, WebM are safe bets; AVI/MOV often aren't).
- If the site is on HTTPS, your media must be HTTPS too (no mixed content).

### PDF doesn't render
- Some browsers block cross-origin PDFs in iframes. Keep PDFs under `assets/` — served from the same origin, they work in Chrome/Safari/Firefox.

### Icon positions got weird
```js
// Paste into browser console:
localStorage.removeItem('gk-icon-positions'); location.reload();
```

---

## File Reference

| Path | Purpose |
|---|---|
| `index.html` | The site itself |
| `data/works.csv` | Your works database (exported from Google Sheets) |
| `assets/dock/` | Custom dock icon PNGs (optional — falls back to SVG) |
| `assets/thumbnails/` | Desktop icon images |
| `assets/audio/` | Audio files |
| `assets/video/` | Video files |
| `assets/images/` | Image files |
| `assets/text/` | Text files + PDFs |
| `uploads/` | Wallpaper image |
| `project/` | Original design prototype files (not used by the live site) |
| `GOOGLE_SHEETS_TEMPLATE.md` | Sheet schema + example rows |
| `TECHNICAL_NOTES.md` | Deeper implementation notes |
