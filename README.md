Static Website Source

Overview

- Modern, responsive, accessible static website.
- No build step required — open `index.html` in a browser.
- Assets in `assets/` (CSS, JS, images). Logo at `assets/img/logo.png`.

Choose Your CMS Provider

- Quick and Git-based: Decap CMS (built-in, writes JSON in repo)
- Scalable and editor-first: Sanity (optional; SaaS headless with free plan)
- Switch in `assets/js/cms.config.js` by setting `provider` to `json` (Decap) or `sanity`.

CMS (Decap)

- Admin UI at `/admin/` using Decap (Netlify) CMS.
- Content edited as JSON in `assets/data/`:
  - `site.json` — contact details
  - `notices.json` — announcements list
  - `deposits.json` — deposit schemes
  - `loans.json` — loan schemes
- Local editing: run a dev server and the local CMS backend:
  - Serve the site: `python3 -m http.server 8080`
  - In another terminal: `npx decap-cms-proxy-server`
  - Open http://localhost:8080/admin/ (no login in local backend)
- Production: deploy to Netlify and enable Identity + Git Gateway for authenticated editing.

Alternative CMS (Recommended for longevity): Sanity

- Why Sanity: actively maintained, robust editor UI, free community plan suitable for marketing sites, fast CDN.
- Editors use Sanity Studio to manage notices, deposits, loans, activities, and gallery images.
- How this site connects:
  - Switch provider in `assets/js/cms.config.js` to `provider: 'sanity'` and set `projectId`, `dataset`.
  - The site will fetch content client‑side from the Sanity CDN (public, read‑only dataset).
- Setup steps:
  1) Create Sanity project + dataset (public read) and deploy Studio (free) to Sanity/Vercel/Netlify.
  2) Add schemas from `sanity/SCHEMA_README.md`.
  3) Populate content in Studio; publish.
  4) Update `assets/js/cms.config.js` with your project ID/dataset and redeploy this static site.

Static Hosting Options (free tiers)

- Cloudflare Pages, Vercel, or Netlify free tiers work well for this static site.
  - Cloudflare Pages: globally cached static hosting.
  - Vercel: free for hobby/static; instant deploys from Git.
  - Netlify: free static hosting; also pairs well with Decap CMS.

Structure

- `index.html` — single-page layout with sections:
  - Hero, Products, Deposits, Loans, Digital, Notices, About, Contact
- `assets/css/styles.css` — theme, layout, components
- `assets/js/main.js` — navigation, notices, small enhancements

Customize

- Bank details: update contact info in `index.html` (Contact section and footer).
- Notices: edit the `notices` array in `assets/js/main.js`.
- Colors: tweak CSS variables in `assets/css/styles.css` under `:root`.
- Sections: edit or duplicate cards within each section in `index.html`.

Run

- Serve locally (recommended for CMS/data fetch):
  - Python: `python3 -m http.server 8080` then open http://localhost:8080/
  - Node (if installed): `npx serve` in the project folder

Deploy

- Host on any static hosting (e.g., GitHub Pages, Netlify, Vercel, S3).
- Ensure all assets paths remain relative as in the repo.

Notes

- All product data and rates are illustrative. Consult the branch for official details.
- If you want separate pages instead of sections, we can split the layout into multiple HTML files and reuse the header/footer.
