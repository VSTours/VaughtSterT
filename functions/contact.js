export async function onRequest(context) {
  const { request, env } = context;

  // Allow preflight (CORS) for browser-based POSTs
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let data = {};
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await request.json();
  } else {
    // Support forms sent from HTML <form> (urlencoded/multipart)
    const form = await request.formData();
    data = Object.fromEntries(form.entries());
  }

  // Minimal validation
  if (!data.firstName || !data.email || !data.message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  // Use an external webhook to process notifications (SendGrid, Slack, Zapier, etc.)
  const webhook = env.CONTACT_WEBHOOK_URL;

  // Build payload to forward (include optional source)
  const payload = {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    email: data.email,
    phone: data.phone || '',
    package: data.package || '',
    visitDates: data.visitDates || '',
    guests: data.guests || '',
    message: data.message || '',
    referral: data.referral || '',
    source: data.source || ''
  };

  // If user configured a webhook URL, forward the payload
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return new Response(JSON.stringify({ error: 'Webhook returned non-OK', status: res.status, body: text }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Failed to forward to webhook' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  // No webhook configured — if SendGrid is configured, send an email directly
  const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
  const SENDGRID_FROM = env.SENDGRID_FROM || 'no-reply@vaughnsterlingtours.com';
  const SENDGRID_TO = env.SENDGRID_TO || 'vaughn@vaughnsterlingtours.com';

  if (SENDGRID_API_KEY) {
    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: SENDGRID_TO }] }],
          from: { email: SENDGRID_FROM },
          subject: `New booking inquiry from ${payload.name || payload.email}`,
          content: [{ type: 'text/plain', value: `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nPackage: ${payload.package}\nVisit Dates: ${payload.visitDates}\nGuests: ${payload.guests}\nReferral: ${payload.referral}\nSource: ${payload.source}\n\nMessage:\n${payload.message}` }]
        })
      });

      if (!sgRes.ok) {
        const txt = await sgRes.text().catch(() => '');
        return new Response(JSON.stringify({ error: 'SendGrid error', status: sgRes.status, body: txt }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Failed to send via SendGrid' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // No delivery configured
  return new Response(JSON.stringify({ error: 'No webhook or SendGrid configured' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
