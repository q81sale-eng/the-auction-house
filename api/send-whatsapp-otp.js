module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'Phone number required' });

  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

  // Check cooldown
  const checkResp = await fetch(
    `${SUPABASE_URL}/rest/v1/phone_otps?phone=eq.${encodeURIComponent(phone)}&verified_at=is.null&order=created_at.desc&limit=1`,
    { headers }
  );
  const existing = await checkResp.json();
  if (Array.isArray(existing) && existing.length > 0) {
    const secondsAgo = (Date.now() - new Date(existing[0].created_at).getTime()) / 1000;
    if (secondsAgo < 60) {
      return res.status(429).json({ message: 'يرجى الانتظار قبل طلب رمز جديد', retry_after: Math.ceil(60 - secondsAgo) });
    }
  }

  // Delete old OTPs for this phone
  await fetch(
    `${SUPABASE_URL}/rest/v1/phone_otps?phone=eq.${encodeURIComponent(phone)}&verified_at=is.null`,
    { method: 'DELETE', headers }
  );

  // Generate and store OTP
  const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/phone_otps`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ phone, otp, expires_at }),
  });

  if (!insertResp.ok) {
    const insertErr = await insertResp.text();
    console.error('Supabase insert error:', insertErr);
    return res.status(500).json({ message: 'خطأ في قاعدة البيانات: ' + insertErr });
  }

  // Send via Ultramsg
  const message = `رمز التحقق الخاص بك في *The Auction House*:\n\n*${otp}*\n\nصالح لمدة 10 دقائق.\nلا تشارك هذا الرمز مع أحد.`;
  const ultraResp = await fetch(
    `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: process.env.ULTRAMSG_TOKEN, to: phone, body: message }).toString(),
    }
  );

  if (!ultraResp.ok) {
    return res.status(503).json({ message: 'تعذّر إرسال الرمز عبر واتساب، يرجى المحاولة لاحقاً' });
  }

  return res.status(200).json({ message: 'تم إرسال رمز التحقق عبر واتساب', expires_in: 600 });
};
