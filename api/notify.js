module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, name, email, trip, stop } = req.body;

  const RESEND_KEY = 're_PskD2U1k_4aGh4mKNJwvciw6UhpUjfTsX';
  const SUPABASE_URL = 'https://prprijriekyrxdygmxho.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycHJpanJpZWt5cnhkeWdteGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODAyNTIsImV4cCI6MjA5MjI1NjI1Mn0.ItZnC9Am4CroYtl11d8KVW7yTY8FYcPnZVVh_cacHb0';

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Stripe Shuttle <onboarding@resend.dev>',
        to: [email],
        subject: 'Good news — a seat opened up on your shuttle!',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Hi ${name} 👋</h2>
            <p style="color:#444;line-height:1.6;">A seat has opened up on the <strong>${trip}</strong> shuttle departure at the <strong>${stop}</strong> stop.</p>
            <p style="color:#444;line-height:1.6;">Please reply to this email or contact your shuttle coordinator to confirm your spot before it fills up again.</p>
            <p style="color:#888;font-size:13px;margin-top:24px;">— Stripe Shuttle Team</p>
          </div>`
      })
    });
    if (!emailRes.ok) return res.status(500).json({ error: 'email: ' + await emailRes.text() });
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
    } catch(e) { /* non-critical */ }
  }

  return res.status(200).json({ success: true });
}
