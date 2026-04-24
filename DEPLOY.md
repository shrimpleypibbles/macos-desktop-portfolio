# Deployment Guide — From Your Laptop to the Internet

**Goal:** put your portfolio online, for free, at a real URL (like `gabrielkyne.com` or `gabriel-kyne.pages.dev`), so that anyone in the world can visit it.

**Audience:** you've never used git before. We'll go slow.

**Time required:** first time, ~60 minutes (a lot of that is waiting for emails / DNS). Every future update takes ~30 seconds.

---

## Part 0 — The Mental Model

Three things, often confused:

| Thing | What it is | Where it lives |
|---|---|---|
| **git** | A program on your computer that tracks versions of files | Your laptop (command-line tool) |
| **GitHub** | A website that *hosts* git repositories in the cloud | github.com (a website owned by Microsoft) |
| **Cloudflare Pages** | A website that takes files from GitHub and serves them as a website to the world | pages.cloudflare.com |

**They are not the same.** Git is software. GitHub is a service that uses git. Cloudflare Pages is a totally separate service that reads from GitHub.

Think of it like this:

```
YOUR LAPTOP               GITHUB                  CLOUDFLARE PAGES
────────────              ──────                  ─────────────────
Your files      ──push──▶ A copy of your    ──▶   Serves those files
(edited in        (via    files in the            as a real website
VS Code etc.)    git)     cloud, free             to the whole
                          storage                  internet
```

You edit files locally → push them to GitHub → Cloudflare automatically sees the update and redeploys the site. That last part is the magic — you don't "upload" anything to Cloudflare. It watches GitHub and does it for you.

---

## Part 1 — One-Time Setup

### 1.1 Install git

Open **Terminal.app** (Spotlight → "Terminal") and type:

```bash
git --version
```

Press Enter.

- **If you see a version number** (like `git version 2.39.5`), skip to 1.2.
- **If you see "install the command line developer tools"**, a dialog pops up. Click **Install**. Wait a few minutes. Done.
- **If none of the above**, install [Homebrew](https://brew.sh) and then:
  ```bash
  brew install git
  ```

### 1.2 Tell git who you are

Still in Terminal:

```bash
git config --global user.name "Gabriel Kyne"
git config --global user.email "gabrielkyne@gmail.com"
```

This just tags your commits with your name. You only do it once per computer.

### 1.3 Make a GitHub account

1. Go to **[github.com](https://github.com)** and click **Sign up**.
2. Use the **same email** as in 1.2 (`gabrielkyne@gmail.com`).
3. Pick a username — this becomes part of your URLs. Something like `gabrielkyne` or `gkyne`. You can't easily change it later, so pick wisely.
4. Free plan is fine. Skip any upsells.
5. Verify your email.

### 1.4 Authorize your laptop to talk to GitHub

GitHub used to accept passwords but now needs a **Personal Access Token** (PAT) or SSH key. The easiest path for a beginner is the **GitHub CLI** — it handles all the auth for you:

```bash
brew install gh     # installs the GitHub command-line tool
gh auth login       # walks you through logging in via your browser
```

Pick: **GitHub.com** → **HTTPS** → **Login with a web browser**. It'll give you a one-time code, open a browser tab, you paste the code, click "Authorize." Done forever.

If you *don't* want to use `gh`, the alternative is SSH keys. Ask me later if you want to go that route.

---

## Part 2 — Put Your Project on GitHub

Your project at `~/Documents/macos-desktop-portfolio` is **already a git repository** (good — someone already ran `git init` at some point). You just need to connect it to a GitHub repo.

### 2.1 Check the current state

```bash
cd ~/Documents/macos-desktop-portfolio
git status
```

This tells you what files are modified. If it says "nothing to commit, working tree clean," perfect. If it lists changed files, that's also fine — we'll commit them in 2.3.

### 2.2 Create the GitHub repo

Using the `gh` CLI you installed:

```bash
gh repo create macos-desktop-portfolio --public --source=. --remote=origin
```

What this does:
- `repo create` — makes a new repo on GitHub
- `macos-desktop-portfolio` — the name (will live at `github.com/yourusername/macos-desktop-portfolio`)
- `--public` — anyone can see the code. Use `--private` if you prefer; Cloudflare Pages works with either. Public is simpler.
- `--source=.` — tells `gh` that the current folder is the project
- `--remote=origin` — tells git "the cloud copy is called `origin`" (convention)

### 2.3 Push your files

```bash
git add .
git commit -m "Initial portfolio"
git push -u origin main
```

What each line does:
- `git add .` — stages every changed/new file
- `git commit -m "Initial portfolio"` — bundles the staged files into a snapshot with a message
- `git push -u origin main` — uploads that snapshot to GitHub

When `git push` finishes, visit `github.com/yourusername/macos-desktop-portfolio` in your browser. You should see your files. 🎉

> **Branch names:** you'll see `main` in commands. That's the default branch. Older tutorials say `master` — same idea, GitHub renamed the default. If `git push` complains about `main` vs `master`, run `git branch -M main` and try again.

---

## Part 3 — Connect Cloudflare Pages

### 3.1 Make a Cloudflare account

1. Go to **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)**.
2. Sign up with your email. Verify.
3. Free plan.

### 3.2 Create the Pages project

1. In the Cloudflare dashboard: left sidebar → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Click **Connect GitHub**. A GitHub auth popup appears. Click **Authorize Cloudflare Pages**.
3. GitHub asks which repos to grant access to. Pick **Only select repositories** → choose `macos-desktop-portfolio`. (You can also choose "All repos" if you don't care.) Click **Save**.
4. Back in Cloudflare, your repo appears. Click **Begin setup**.
5. **Build settings:**
   - Project name: `macos-desktop-portfolio` (or something shorter — this becomes your URL: `<name>.pages.dev`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `/` (just a single slash)
6. Click **Save and Deploy**.

Wait ~1 minute. You'll see a progress log. When it finishes, Cloudflare gives you a URL like `https://macos-desktop-portfolio.pages.dev`. Visit it. Your site is live. 🚀

### 3.3 Verify the auto-deploy

The magic: from now on, every `git push` triggers an automatic redeploy. Try it:

1. Open `index.html` in your editor, change something tiny (e.g. a word in a heading).
2. Save.
3. In Terminal:
   ```bash
   git add index.html
   git commit -m "Test change"
   git push
   ```
4. Go back to the Cloudflare Pages dashboard. A new deployment starts within seconds. ~30 seconds later your live site reflects the change.

You never have to touch Cloudflare again after this. It just watches GitHub forever.

---

## Part 4 — Hook Up a Custom Domain (Optional)

`macos-desktop-portfolio.pages.dev` works forever, but you might want `gabrielkyne.com` or `gabrielkyne.de`.

### 4.1 Buy the domain

Register wherever you like — [Namecheap](https://namecheap.com), [Porkbun](https://porkbun.com), Google Domains alternatives, etc. Costs ~€10–15/year. **Or** buy it directly through Cloudflare (Cloudflare sells domains at cost with no markup — often the cheapest option).

### 4.2 Add it to Cloudflare

If you bought through Cloudflare: skip to 4.3 — it's already there.

If you bought elsewhere:
1. Cloudflare dashboard → **Websites** → **Add a site**.
2. Type your domain. Click Continue. Pick the **Free plan**.
3. Cloudflare gives you two **nameservers** (like `anna.ns.cloudflare.com` and `bob.ns.cloudflare.com`).
4. Log into your registrar (Namecheap etc.), find the "nameservers" setting for your domain, replace the defaults with the two Cloudflare gave you.
5. Wait. DNS propagation can take 5 minutes to 24 hours, typically ~15 minutes.

### 4.3 Point the domain at your Pages project

1. Cloudflare dashboard → **Workers & Pages** → your project → **Custom domains** tab.
2. Click **Set up a custom domain** → type `gabrielkyne.com` (or whatever) → **Continue**.
3. Cloudflare asks to add a CNAME record. Click **Activate**. It handles the DNS automatically because your domain is already on Cloudflare.
4. Free SSL is issued in ~1 minute. Your site is now at your domain with HTTPS.

Want `www.gabrielkyne.com` too? Repeat 4.3 with `www.gabrielkyne.com`.

---

## Part 5 — The Daily Workflow (once everything is set up)

This is what you'll do every time you add a new work, update the CSV, or change anything:

```bash
cd ~/Documents/macos-desktop-portfolio

# ... edit your files (works.csv, add media to assets/, etc.) ...

git add .
git commit -m "Add Winterreise recording"
git push
```

That's it. Cloudflare rebuilds and deploys within ~30 seconds.

### Tip: descriptive commit messages

Instead of `git commit -m "update"`, try:
- `git commit -m "Add Selbstliebe thumbnail"`
- `git commit -m "Update credits for Underground"`
- `git commit -m "Fix dock icon color"`

When you're scrolling through the history on GitHub 6 months from now trying to remember when you changed something, you'll thank yourself.

---

## Part 6 — Handling Big Media Files

Cloudflare Pages has a **25 MB per-file limit**. For a composer with orchestral video, you'll hit this.

### Option A: Compress first

Most of your videos should fit if you re-encode. [HandBrake](https://handbrake.fr) is free:

- 1080p, H.264, bitrate ~600–1500 kbps → a 5-min video lands at 20–50 MB
- Aim for under 25 MB and Pages will happily host it

### Option B: Cloudflare R2 (free, recommended)

R2 is Cloudflare's storage service. **Free tier: 10 GB storage, zero egress fees, unlimited reads.** Massive for a portfolio.

1. Cloudflare dashboard → **R2** → enable (requires adding a credit card for identity verification even on the free plan — you won't be charged unless you exceed 10 GB).
2. Create a bucket, e.g. `gk-portfolio-media`.
3. Enable public access on the bucket (Settings → Public Access → allow).
4. Upload your big video via the web UI (drag-and-drop).
5. Copy the public URL: something like `https://pub-xyz.r2.dev/underground.mp4`.
6. In your Google Sheet, paste that URL into the `media-location` column. The path resolver already passes `https://` URLs through unchanged.

No redeploy needed — R2 is independent of Pages.

### Option C: Video platforms (Vimeo, YouTube, Bunny)

If you already use Vimeo/YouTube, just paste the embed URL. We'd need to add iframe support for those embed formats — let me know if you want that.

---

## Part 7 — Common Pitfalls

### "git push" asks for username/password and rejects my real password

GitHub deprecated password auth for git. Either:
- Use `gh auth login` (Part 1.4)
- Or create a Personal Access Token: github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new. Paste that as your "password."

### "fatal: not a git repository"

You're in the wrong folder. Run `cd ~/Documents/macos-desktop-portfolio` first.

### Cloudflare build fails

Usually there's nothing to build for this project. Make sure **Build command** is blank and **Build output directory** is `/`. If you accidentally typed something, edit under Pages → project → Settings → Builds.

### My site works locally but not on Cloudflare

Usually a path issue. Paths in your code should be **relative** (`assets/foo.png`) not **absolute** to your local disk (`/Users/gabrielkyne/…`). Our code already does this correctly, but watch for it if you edit paths by hand.

### Accidentally committed a huge file

If you committed a 500 MB video by mistake, the push will fail or be incredibly slow. To remove it from the last commit:

```bash
git reset HEAD~1              # undo the last commit, keep the changes as "staged"
git restore --staged big.mp4  # unstage the big file
# add the file to .gitignore so it never gets staged again
echo "big.mp4" >> .gitignore
git add .
git commit -m "Re-commit without big file"
git push
```

### I broke something and want to go back

`git log --oneline` shows a list of every commit. Find the one before things broke, copy its hash (e.g. `a1b2c3d`), and:

```bash
git checkout a1b2c3d -- .     # restore every file to that commit
git add .
git commit -m "Revert to working state"
git push
```

This creates a *new* commit that undoes your bad one — safer than rewriting history.

---

## Part 8 — Cheat Sheet

Print this, stick it next to your desk:

```
# Check what's changed
git status

# Stage + commit + push (the holy trinity)
git add .
git commit -m "describe what you changed"
git push

# See your history
git log --oneline

# Undo unstaged changes to a file
git restore path/to/file

# Pull changes from GitHub (if you edited the repo in the browser)
git pull
```

---

## Part 9 — Where to Get Help

- **GitHub itself:** `github.com/yourusername/macos-desktop-portfolio` — you can edit files directly in the browser (GitHub → click file → pencil icon). Changes you make there have to be pulled down with `git pull` before you edit locally again.
- **Cloudflare support:** their docs are excellent. Dashboard → Help.
- **Me:** paste any error message and I'll walk you through it.

---

## TL;DR

1. Install git + `gh`, sign up for GitHub, run `gh auth login`.
2. `gh repo create macos-desktop-portfolio --public --source=. --remote=origin`
3. `git add . && git commit -m "Initial" && git push -u origin main`
4. Cloudflare → Pages → Connect to Git → pick the repo → Save and Deploy (build command blank, output `/`).
5. Every future update: `git add . && git commit -m "…" && git push`. Done.
