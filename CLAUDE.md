# Portfolio Project — Claude Code Context

## Project location
`~/Documents/gabrielkyne.com/macos-desktop-portfolio/` — this is the ONLY correct path.
Never edit files in `~/Downloads/` or any `.claude/worktrees/` path.

## What this is
Single-file React portfolio styled as a macOS desktop. No build step — React + Babel loaded via CDN.
- **Main file**: `index.html` (~1400 lines, all components inline)
- **Works data**: `data/works.csv` — columns: `number, name, year, instrumentation, media-type, media-location, thumbnail-location`
- **Media**: hosted on Cloudflare R2, public base URL `https://pub-715e1f7bc3864cb8b05d16f94698b504.r2.dev`
- **Deploy**: GitHub → Cloudflare Pages (auto-deploy on push to `main`)
- **GitHub repo**: `https://github.com/shrimpleypibbles/macos-desktop-portfolio`

## Sync commands
```bash
# Push code changes live
cd ~/Documents/gabrielkyne.com/macos-desktop-portfolio
git add <files> && git commit -m "..." && git push origin main

# Sync media to R2
rclone sync ~/Documents/gabrielkyne.com/assets r2:gk-portfolio-media/assets
```

## Key design decisions (don't undo)
- **File extensions in CSV `name` column** are intentional — the "messy desktop" aesthetic.
- **Thumbnails**: `objectFit:'contain'` with black letterbox background (no cropping). Same thumb size always.
- **Email** is always split/obscured in JS: `'gabrielkyne' + '@' + 'gmail.com'` — never a plain string.
- **Dock hover lift** is commented out (marked `// HOVER LIFT`) — kept for later re-enable, don't delete.
- **No corner badge** on Thumbnail component.
- **VideoPlayer does NOT autoplay.**
- **Animated thumbnails** use `.webp` format (img2webp pipeline from PNG frames).

## works.csv media types
`video` | `audio` | `text` | `image` | `score` | (more TBD)
Score entries show as PDF download links in the Scores window.

## Dock items
Finder, Works, About, Contact, Scores (Music for Instruments / dorico.png icon)

## Deferred / do not touch yet
- Mobile view
- Font choice
- More dock items (CV, Instagram)
- Animation-name minigame
- Custom HTML5 video player
- Finder-style Works window (saved as `WorksContentFinder` commented out in index.html)
- Shell scripts for ffmpeg encoding presets
- Responsive dock scaling (dynamic based on window size)

## Dock proportions (reference)
Derived from 4K macOS screenshot measurements. Icon/dock ratio ~65.4%.
Gap between icons: 5px. Dock padding: `6px 6px 8px 6px`. BorderRadius: 16.
Open-app dot: `position:absolute, bottom:-4` (doesn't affect dock height).
