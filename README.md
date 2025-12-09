# Vaughn Sterling Tours — Astro Site

This repository contains a minimal Astro + Tailwind site for Vaughn Sterling Tours. It features pages for services, contact, gallery, FAQ, and more.

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Deploy
This project includes `wrangler.toml` and is configured for Cloudflare Pages as a static site (no adapter).

Example deploy workflow:

```bash
wrangler login
npm run build
wrangler pages deploy dist --project-name=vaughnsterlingtours
```

## Important Settings to Update
- Verify the WhatsApp link is correct in `src/layouts/Layout.astro`, `src/pages/contact.astro`, and other pages. It's currently set to `https://wa.me/639202468178`.
- Update the email address `vaughn@vaughnsterlingtours.com` to your working email address.
- Replace Unsplash images with real photos if available.

## Files Created
- `package.json`
- `astro.config.mjs`
- `tailwind.config.cjs`
- `wrangler.toml`
- `src/layouts/Layout.astro`
- `src/pages/{index,services,about,gallery,contact,faq}.astro`
- `src/styles/global.css`
- `public/favicon.svg`

## Notes
- The site uses Tailwind for styling; you can customize the color palette in `tailwind.config.cjs`.
- After updating the WhatsApp number and email, rebuild and redeploy.

---

If you'd like, I can run the build now and validate the output.
