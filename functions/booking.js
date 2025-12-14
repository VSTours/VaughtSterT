export async function onRequest(context) {
  const { request, env } = context;

  // Allow preflight (CORS)
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
    const form = await request.formData();
    data = Object.fromEntries(form.entries());
  }

  // Basic validation: expect a minimal booking shape
  const name = data?.data?.customer?.name || data.name || '';
  const email = data?.data?.customer?.email || data.email || '';
  const tourType = data?.data?.booking?.tourType || data.tourType || '';
  const date = data?.data?.booking?.date || data.date || '';

  if (!name || !email || !tourType || !date) {
    return new Response(JSON.stringify({ error: 'Missing required booking fields (name, email, tourType, date)' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  const payload = {
    name,
    email,
    phone: data?.data?.customer?.phone || data.phone || '',
    tourType,
    date,
    guests: data?.data?.booking?.guests || data.guests || '',
    specialRequests: data?.data?.booking?.specialRequests || data.specialRequests || '',
    source: data?.source || data?.data?.source || 'website-booking'
  };

  const webhook = env.BOOKING_WEBHOOK_URL;

  if (webhook) {
    // Some webhooks expect the original nested booking payload (event/data). If the incoming
    // body contains an `event` or `data` field, forward the original body; otherwise forward
    // the normalized `payload` object.
    const forwardBody = (data && (data.event || data.data)) ? data : payload;

    let webhookOk = false;
    let webhookInfo = {};
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forwardBody)
      });

      const bodyText = await res.text().catch(() => '');
      webhookInfo = { status: res.status, body: bodyText };

      if (res.ok) {
        webhookOk = true;
      }
    } catch (err) {
      webhookInfo = { error: String(err) };
    }

    // Decide if we should send an email copy: if BOOKING_SEND_COPY === 'true' request explicit copy,
    // or always send a copy when webhook failed and SendGrid is configured.
    const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
    const BOOKING_SEND_COPY = (env.BOOKING_SEND_COPY || '').toLowerCase() === 'true';
    let sendOk = false;
    let sendInfo = {};

    if (SENDGRID_API_KEY && (BOOKING_SEND_COPY || !webhookOk)) {
      // attempt to send via SendGrid
      const SENDGRID_FROM = env.SENDGRID_FROM || 'no-reply@vaughnsterlingtours.com';
      const SENDGRID_TO = env.SENDGRID_TO || 'vaughn@vaughnsterlingtours.com';
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
            subject: `New booking request: ${payload.tourType} on ${payload.date}`,
            content: [{ type: 'text/plain', value: `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nTour: ${payload.tourType}\nDate: ${payload.date}\nGuests: ${payload.guests}\nSpecial Requests: ${payload.specialRequests}\nSource: ${payload.source}` }]
          })
        });

        const sgBody = await sgRes.text().catch(() => '');
        sendInfo = { status: sgRes.status, body: sgBody };
        if (sgRes.ok) sendOk = true;
      } catch (err) {
        sendInfo = { error: String(err) };
      }
    }

    // Decide response
    if (webhookOk || sendOk) {
      return new Response(JSON.stringify({ ok: true, webhookOk, webhookInfo, sendOk, sendInfo }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // both failed
    return new Response(JSON.stringify({ error: 'Failed to deliver booking', webhookOk, webhookInfo, sendOk, sendInfo }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  // Fallback: send via SendGrid if configured
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
          subject: `New booking request: ${payload.tourType} on ${payload.date}`,
          content: [{ type: 'text/plain', value: `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nTour: ${payload.tourType}\nDate: ${payload.date}\nGuests: ${payload.guests}\nSpecial Requests: ${payload.specialRequests}\nSource: ${payload.source}` }]
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

  return new Response(JSON.stringify({ error: 'No booking webhook or SendGrid configured' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
