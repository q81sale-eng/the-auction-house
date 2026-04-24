module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
    const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const sbHeaders = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

    // Delete old OTPs for this phone
    await fetch(
      `${SUPABASE_URL}/rest/v1/phone_otps?phone=eq.${encodeURIComponent(phone)}&verified_at=is.null`,
      { method: 'DELETE', headers: sbHeaders }
    );

    // Generate and store OTP
    const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/phone_otps`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ phone, otp, expires_at }),
    });

    if (!insertResp.ok) {
      const err = await insertResp.text();
      return res.status(500).json({ message: 'خطأ في قاعدة البيانات: ' + err });
    }

    // Send via Ultramsg
    const message = `رمز التحقق الخاص بك في *The Auction House*:\n\n*${otp}*\n\nصالح لمدة 10 دقائق.\nلا تشارك هذا الرمز مع أحد.`;
    const ultraResp = await fetch(
      `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${process.env.ULTRAMSG_TOKEN}&to=${encodeURIComponent(phone)}&body=${encodeURIComponent(message)}`,
      }
    );

    if (!ultraResp.ok) {
      return res.status(503).json({ message: 'تعذّر إرسال الرمز عبر واتساب' });
    }

    return res.status(200).json({ message: 'تم إرسال رمز التحقق عبر واتساب' });
  } catch (e) {
    return res.status(500).json({ message: 'خطأ: ' + e.message });
  }
};
