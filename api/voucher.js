module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, voucherLink } = req.body;

  const RESEND_KEY = 're_PskD2U1k_4aGh4mKNJwvciw6UhpUjfTsX';

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Stripe Shuttle <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Uber voucher from Stripe Shuttle',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Hi ${name} 👋</h2>
            <p style="color:#444;line-height:1.6;">As an alternative to the shuttle, here's an Uber voucher for you:</p>
            <a href="${voucherLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#185FA5;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;">Redeem Uber Voucher</a>
            <p style="color:#888;font-size:12px;margin-top:8px;">Or copy this link: ${voucherLink}</p>
            <p style="color:#888;font-size:13px;margin-top:24px;">— Stripe Shuttle Team</p>
          </div>`
      })
    });
    if (!emailRes.ok) return res.status(500).json({ error: 'email: ' + await emailRes.text() });
  } catch(e) {
    return res.status(500).json({ error: 'email: ' + e.message });
  }

  return res.status(200).json({ success: true });
}
