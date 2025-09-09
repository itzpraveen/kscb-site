Static Website Source

Overview

- Single‑page static site using plain HTML, CSS, and JS
- No build step required — open `index.html` in a browser
- Assets live in `assets/` (CSS, JS, images)

Optional CMS

- Decap CMS (Git‑based) admin at `/admin/`
- Sanity (hosted headless) supported via `assets/js/cms.config.js`
- Content JSON lives in `assets/data/`

Local Preview

- Python: `python3 -m http.server 8080` then open http://localhost:8080/
- Node: `npx serve`

Deploy

- Suitable for static hosts (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3)
- Keep asset paths relative as in the repo

Structure

- `index.html` — single page layout and markup
- `assets/css/styles.css` — theme, layout, components
- `assets/js/main.js` — small client‑side behaviors

Notes

- This repository intentionally avoids brand‑specific language.
