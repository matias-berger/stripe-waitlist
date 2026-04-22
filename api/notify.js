module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, name, email, trip, stop } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const SENDGRID_KEY = process.env.sendgrid_production;
  const SUPABASE_URL = 'https://prprijriekyrxdygmxho.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycHJpanJpZWt5cnhkeWdteGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODAyNTIsImV4cCI6MjA5MjI1NjI1Mn0.ItZnC9Am4CroYtl11d8KVW7yTY8FYcPnZVVh_cacHb0';

  try {
    const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { email: 'support@swoopapp.com', name: 'Swoop Shuttle' },
        to: [{ email }],
        subject: 'A seat is available on your shuttle!',
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Hi ${name || 'there'} 👋</h2>
              <p style="color:#444;line-height:1.6;font-size:16px;">Hello, this is Swoop team! Quick heads-up, there is a seat available now for your trip!</p>
              <p style="color:#666;line-height:1.6;font-size:14px;margin-top:12px;">Departure: <strong>${trip}</strong> · Stop: <strong>${stop}</strong></p>
              <p style="color:#444;line-height:1.6;font-size:14px;margin-top:12px;">Please contact your shuttle coordinator to confirm your spot before it fills up again.</p>
              <p style="color:#888;font-size:13px;margin-top:24px;">— Swoop Shuttle Team</p>
            </div>`
        }]
      })
    });
    if (!emailRes.ok) {
      const txt = await emailRes.text();
      return res.status(500).json({ error: 'email: ' + txt });
    }
  } catch(e) {
    return res.status(500).json({ error: 'email: ' + e.message });
  }

  // Mark as notified in Supabase
  if (id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/waitlist?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notified_at: new Date().toISOString() })
      });
    } catch(e) {}
  }

  return res.status(200).json({ success: true });
}
