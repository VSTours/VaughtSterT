# Worker: Booking Webhook Recommendations

This file contains recommended changes and testing steps for the Cloudflare Worker you provided (booking webhook).

## Key fixes to apply

- Change the notification recipient from `bookings@vaughnsterlingtours.com` to `vaughn@vaughnsterlingtours.com` (or add it as a CC/BCC) so Vaughn receives booking notifications directly.
- Add logging around the MailChannels response and the D1 insert so failures are visible in Worker logs.
- Ensure the MailChannels `dkim_domain` and `dkim_selector` are configured in MailChannels dashboard for `vaughnsterlingtours.com`. If not configured, remove those fields or update accordingly.
- Consider adding a fallback email send from the site (`functions/booking.js`) so that if the worker fails to email, the site still sends a copy via SendGrid.

## Suggested code changes

1) Change the `to` recipient to include Vaughn:

Replace:

```js
to: [{ email: 'bookings@vaughnsterlingtours.com' }]
```

With:

```js
to: [{ email: 'vaughn@vaughnsterlingtours.com' }],
cc: [{ email: 'bookings@vaughnsterlingtours.com' }]
```

2) Add a try/catch around the MailChannels response and log details:

```js
const mailRes = await fetch('https://api.mailchannels.net/tx/v1/send', { ... });
const mailBody = await mailRes.text().catch(() => '');
if (!mailRes.ok) console.error('MailChannels error', mailRes.status, mailBody);
```

3) Ensure the D1 insert result is checked and logged:

```js
const result = await env.DB.prepare(`...`).bind(...).run();
console.log('D1 insert result', result);
```

## Deployment & testing

1. Deploy worker (via `wrangler publish` or Cloudflare Dashboard).
2. Set the CORS origin to `https://vaughnsterlingtours.com` (already present). If you have `www.` variant, add that as well.
3. Submit a booking from the site (or use `curl`) and check:
   - Worker logs (Cloudflare) for D1 insert and MailChannels status.
   - The recipient inbox (`vaughn@vaughnsterlingtours.com`) for the notification.

## Alternate: site-side backup

If you'd prefer the site to ensure delivery regardless of Worker state, set `BOOKING_SEND_COPY=true` and configure `SENDGRID_API_KEY` and `SENDGRID_TO` in your Cloudflare Pages environment. The repo's `functions/booking.js` will then send a SendGrid copy when forwarding fails or when `BOOKING_SEND_COPY` is set.

---

If you'd like, I can prepare a patch of the worker code with these edits for you to copy into your Worker repo or Cloudflare Dashboard. Tell me if you want me to proceed with a ready-to-deploy Worker script.
