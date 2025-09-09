Sanity schema (optional, if you choose Sanity CMS)

Overview

- Sanity offers a generous free plan suitable for marketing sites.
- Create a project and dataset (public read), then add these schemas.
- Deploy Studio (free) to Sanity, Vercel, or Netlify. Editors use the Studio UI.

Quick Start

1) Install Sanity CLI (local): `npm create sanity@latest`
2) Choose a clean project and dataset name (e.g., `production`).
3) Replace your `schemaTypes` with the below definitions, or add them alongside.

Schema (TypeScript)

// ./schemas/notice.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'notice',
  title: 'Notice',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'date', type: 'date', validation: r => r.required() }),
    defineField({ name: 'link', type: 'url' }),
  ],
  preview: { select: { title: 'title', subtitle: 'date' } }
})

// ./schemas/deposit.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'deposit',
  title: 'Deposit Scheme',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'features', type: 'array', of: [{ type: 'string' }] }),
  ]
})

// ./schemas/loan.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'loan',
  title: 'Loan Scheme',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'description', type: 'text' }),
  ]
})

// ./schemas/activity.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'activity',
  title: 'Activity',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'date', type: 'date' }),
    defineField({ name: 'summary', type: 'text' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
  ]
})

// ./schemas/galleryImage.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'caption', type: 'string' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true }, validation: r => r.required() }),
  ]
})

// ./schemas/siteSettings.ts
import { defineField, defineType } from 'sanity'
export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'org', type: 'string' }),
    defineField({ name: 'address', type: 'text' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'map_url', type: 'url' }),
  ]
})

// ./schema.ts
import notice from './schemas/notice'
import deposit from './schemas/deposit'
import loan from './schemas/loan'
import activity from './schemas/activity'
import galleryImage from './schemas/galleryImage'
import siteSettings from './schemas/siteSettings'
export const schema = {
  types: [notice, deposit, loan, activity, galleryImage, siteSettings]
}

Security / Public access

- Set dataset visibility to public (read-only) so the website can fetch without a token.
- Restrict allowed CORS origins to your site domain(s).
- Editors authenticate in Studio; public read doesn’t allow changes.

Connect the website

1) Edit `assets/js/cms.config.js` and set:
   - `provider: 'sanity'`
   - `sanity.projectId`: your project ID
   - `sanity.dataset`: your dataset name
2) Publish content in Studio. The site will render new items instantly via Sanity CDN.

