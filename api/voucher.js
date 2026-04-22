module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, voucherLink } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const SENDGRID_KEY = process.env.sendgrid_production;

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
        subject: 'Your Uber voucher from Swoop Shuttle',
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Hi ${name || 'there'} 👋</h2>
              <p style="color:#444;line-height:1.6;">As an alternative to the shuttle, here's an Uber voucher for you:</p>
              <a href="${voucherLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#185FA5;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;">Redeem Uber Voucher</a>
              <p style="color:#888;font-size:12px;margin-top:8px;">Or copy this link: ${voucherLink}</p>
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

  return res.status(200).json({ success: true });
}
