module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { name, phone, email, brand, model, reference_number, condition, year, notes } = req.body || {};

    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
    if (!adminPhone) {
      return res.status(200).json({ message: 'No admin phone configured' });
    }

    const lines = [
      `⌚ *طلب ساعة جديد — The Auction House*`,
      ``,
      `👤 *العميل:* ${name || '—'}`,
      `📱 *الهاتف:* ${phone || '—'}`,
      email ? `📧 *الإيميل:* ${email}` : null,
      ``,
      `🕐 *الساعة:* ${[brand, model].filter(Boolean).join(' ') || '—'}`,
      reference_number ? `🔢 *الريفرنس:* ${reference_number}` : null,
      condition ? `✨ *الحالة:* ${condition}` : null,
      year ? `📅 *السنة:* ${year}` : null,
      notes ? `📝 *ملاحظات:* ${notes}` : null,
    ].filter(Boolean).join('\n');

    const ultraResp = await fetch(
      `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${process.env.ULTRAMSG_TOKEN}&to=${encodeURIComponent(adminPhone)}&body=${encodeURIComponent(lines)}`,
      }
    );

    if (!ultraResp.ok) {
      console.error('[notify-watch-request] WhatsApp failed:', await ultraResp.text());
    }

    return res.status(200).json({ message: 'ok' });
  } catch (e) {
    console.error('[notify-watch-request] error:', e);
    return res.status(500).json({ message: 'خطأ: ' + e.message });
  }
};
