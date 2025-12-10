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
This project is ready for Cloudflare Pages as a static site (no server adapter required).

The repo includes a GitHub Action to build and deploy automatically on push to `main` to Cloudflare Pages using the `cloudflare/pages-action` GitHub Action. To enable this, add these repository secrets in GitHub:

- `CLOUDFLARE_API_TOKEN` — a Pages/token with `Pages` & `Account` write permissions.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.
- `CLOUDFLARE_PAGES_PROJECT_NAME` — your Pages project name (optional — action can detect if omitted).
	- `CONTACT_WEBHOOK_URL` — optional webhook URL where contact/booking form submissions will be forwarded (e.g., Zapier, Slack inbound, SendGrid inbound webhook).

Common Reasons a Custom Domain Might Not Load
- DNS isn't pointed to the site: Make sure your domain's DNS is pointed to Cloudflare if you want Cloudflare Pages to serve it. If you're using Cloudflare, add the custom domain in Pages and ensure the site's DNS records are configured in the Cloudflare DNS dashboard.
- SSL cert not issued yet: Cloudflare Pages will provision certificates once the domain is added and DNS is pointing to Cloudflare. This may take a few minutes.
- Domain conflicts: If you previously used GitHub Pages or another hosting provider, remove conflicting DNS records (A/CNAME) that point to the old provider.

Troubleshooting Steps
1. Add your custom domain to the Pages project: Cloudflare Dashboard → Pages → Your project → Settings → Domains → Add a custom domain.
2. Update DNS: If your domain is managed elsewhere, add the DNS records as instructed by Cloudflare. If you use Cloudflare-managed DNS, set the record to the value Cloudflare shows and ensure it is allowed / proxied as needed.
3. Verify: After adding the domain and DNS records, the GitHub Actions workflow adds a smoke-check step that tries: `curl -sS -o /dev/null -w "%{http_code}" https://vaughnsterlingtours.com`. If it doesn't return 200, wait for DNS to propagate or check the Logs & Domain status in Cloudflare Pages dashboard.
4. Remove conflicting hosting: If you use GitHub Pages or another host for the domain, remove the conflicting CNAME/A records.

If you'd like help, share the current DNS settings for `vaughnsterlingtours.com` (masked if needed), and I can advise on the exact records required.

Manual deploy example using `wrangler` (optional):

```bash
wrangler login
npm run build
wrangler pages deploy dist --project-name=vaughnsterlingtours
```

## Important Settings to Update
- Verify the WhatsApp link is correct in `src/layouts/Layout.astro`, `src/pages/contact.astro`, and other pages. It's currently set to `https://wa.me/639202468178`.
- Update the email address `vaughn@vaughnsterlingtours.com` to your working email address.
- Replace Unsplash images with real photos if available.
	- Configure the Cloudflare Pages Environment Variable `CONTACT_WEBHOOK_URL` (or add it to the Pages project in the Cloudflare dashboard) to enable the `functions/api/contact` server-side forwarding.

### Cloudflare Pages Functions and environment variables
To enable secure forwarding of contact requests from the `functions/api/contact` endpoint, set the `CONTACT_WEBHOOK_URL` value in the Pages project's Environment Variables (Cloudflare dashboard → Pages → Your project → Settings → Environment variables). The function reads `CONTACT_WEBHOOK_URL` from the environment and forwards POST data to that URL.

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
