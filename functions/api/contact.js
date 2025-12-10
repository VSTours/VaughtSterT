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

  // Accept GET as a harmless probe (some clients prefetch or probe endpoints).
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ ok: false, message: 'Contact API accepts POST requests only. Use POST to submit a contact inquiry.' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
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
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Use an external webhook to process notifications (SendGrid, Slack, Zapier, etc.)
  const webhook = env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return new Response(JSON.stringify({ error: 'No webhook configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Build payload to forward
  const payload = {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    email: data.email,
    phone: data.phone || '',
    package: data.package || '',
    visitDates: data.visitDates || '',
    guests: data.guests || '',
    message: data.message || '',
    referral: data.referral || ''
  };

  // Forward to user-provided webhook URL
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to forward' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
