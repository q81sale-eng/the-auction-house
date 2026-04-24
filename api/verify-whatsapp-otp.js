module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

  const now = new Date().toISOString();
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/phone_otps?phone=eq.${encodeURIComponent(phone)}&verified_at=is.null&expires_at=gte.${encodeURIComponent(now)}&order=created_at.desc&limit=1`,
    { headers }
  );
  const records = await resp.json();

  if (!Array.isArray(records) || !records.length) {
    return res.status(422).json({ message: 'الرمز منتهي الصلاحية، يرجى طلب رمز جديد' });
  }

  const record = records[0];

  if (record.attempts >= 5) {
    await fetch(`${SUPABASE_URL}/rest/v1/phone_otps?id=eq.${record.id}`, { method: 'DELETE', headers });
    return res.status(422).json({ message: 'تجاوزت الحد المسموح من المحاولات، يرجى طلب رمز جديد' });
  }

  if (record.otp !== otp) {
    await fetch(`${SUPABASE_URL}/rest/v1/phone_otps?id=eq.${record.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts: record.attempts + 1 }),
    });
    return res.status(422).json({ message: 'رمز التحقق غير صحيح' });
  }

  await fetch(`${SUPABASE_URL}/rest/v1/phone_otps?id=eq.${record.id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified_at: new Date().toISOString() }),
  });

  return res.status(200).json({ verified: true, phone });
};
