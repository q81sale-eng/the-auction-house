import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface InvoiceItem {
  brand:            string;
  model:            string;
  reference_number?: string | null;
  condition?:       string | null;
  price:            number | string;
  currency?:        string;
  type:             'auction' | 'listing';
  id:               string;
}

interface Buyer {
  name:  string;
  email: string;
  phone: string;
}

const CONDITIONS: Record<string, string> = {
  unworn:         'لم تستخدم',
  used:           'مستخدم',
  used_marks:     'مستخدم يوجد آثار',
  unworn_storage: 'لم تستخدم آثار سوء تخزين',
  new:            'جديد',
  excellent:      'ممتاز',
  good:           'جيد',
  fair:           'مقبول',
};

const pad = (n: number) => String(n).padStart(2, '0');
const formatInvoiceDate = (d = new Date()) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const invoiceNumber = (id: string) =>
  `TAH-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;

interface Props {
  item:    InvoiceItem;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({ item, onClose }) => {
  const invNum = invoiceNumber(item.id);
  const today  = formatInvoiceDate();
  const price  = parseFloat(String(item.price)) || 0;
  const cur    = item.currency ?? 'د.ك';
  const typeAr = item.type === 'auction' ? 'مزاد' : 'سوق مباشر';
  const cond   = item.condition ? (CONDITIONS[item.condition] ?? item.condition) : '—';

  const [buyer, setBuyer]         = useState<Buyer>({ name: '', email: '', phone: '' });
  const [loadingBuyer, setLoading] = useState(item.type === 'auction');
  const [notes, setNotes]          = useState('');

  // For auctions: fetch the top bidder's profile
  useEffect(() => {
    if (item.type !== 'auction') return;
    (async () => {
      try {
        const { data } = await supabase
          .from('bids')
          .select('user_id, amount, profiles(name, email, phone)')
          .eq('auction_id', item.id)
          .order('amount', { ascending: false })
          .limit(1)
          .single();

        if (data?.profiles) {
          const p = data.profiles as any;
          setBuyer({
            name:  p.name  ?? '',
            email: p.email ?? '',
            phone: p.phone ?? '',
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [item.id, item.type]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePrint = () => {
    const buyerRows = [
      buyer.name  && `<div class="inv-row"><span>اسم المشتري</span><span>${buyer.name}</span></div>`,
      buyer.email && `<div class="inv-row"><span>البريد الإلكتروني</span><span>${buyer.email}</span></div>`,
      buyer.phone && `<div class="inv-row"><span>رقم الهاتف</span><span>${buyer.phone}</span></div>`,
    ].filter(Boolean).join('');

    const itemRows = [
      ['الماركة',       item.brand],
      ['الموديل',       item.model],
      ['الرقم المرجعي', item.reference_number || '—'],
      ['الحالة',        cond],
    ].map(([l, v]) => `<div class="inv-row"><span>${l}</span><span>${v}</span></div>`).join('');

    const html = `
      <!DOCTYPE html><html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>فاتورة ${invNum}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; background: #fff; color: #111; padding: 40px; }
          .inv-top { border-bottom: 2px solid #D4AF37; padding-bottom: 14px; margin-bottom: 20px; }
          .inv-top-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
          .inv-brand { font-size: 18px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #111; }
          .inv-tagline { font-size: 10px; color: #888; letter-spacing: 1px; }
          .inv-contact { font-size: 10px; color: #666; display: flex; gap: 14px; flex-wrap: wrap; }
          .inv-meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 14px; }
          .inv-meta-row strong { color: #b8960c; }
          .inv-section { margin-bottom: 20px; }
          .inv-section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; }
          .inv-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
          .inv-row span:first-child { color: #666; }
          .inv-total { display: flex; justify-content: space-between; align-items: center; background: #f9f6ef; border: 1px solid #D4AF37; padding: 16px 20px; margin-top: 20px; }
          .inv-footer { margin-top: 28px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 14px; line-height: 1.8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="inv-top">
          <div class="inv-top-row">
            <div>
              <p class="inv-brand">The Auction House</p>
              <p class="inv-tagline">شركة دار المزادات لتنظيم المزادات العلنية</p>
            </div>
            <div class="inv-contact">
              <span>📞 98933393</span>
              <span>📷 saadalkaaldy_1@</span>
              <span>📍 العاصمة · القبلة · ق002 · قسيمة 000004 · شارع مبارك الكبير</span>
            </div>
          </div>
        </div>
        <div class="inv-meta-row">
          <span>رقم الفاتورة: <strong>${invNum}</strong></span>
          <span>التاريخ: <strong style="color:#333">${today}</strong></span>
          <span>نوع البيع: <strong style="color:#333">${typeAr}</strong></span>
          <span>رقم الترخيص: <strong style="color:#333">2019/22418</strong></span>
        </div>
        ${buyerRows ? `<div class="inv-section"><h3>بيانات المشتري</h3>${buyerRows}</div>` : ''}
        <div class="inv-section"><h3>تفاصيل السلعة</h3>${itemRows}</div>
        <div class="inv-total">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888">إجمالي المبلغ</span>
          <strong style="font-size:26px">${price.toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${cur}</strong>
        </div>
        ${notes ? `<div class="inv-section" style="margin-top:20px"><h3>ملاحظات</h3><p style="font-size:13px;color:#444;line-height:1.7;padding:8px 0">${notes}</p></div>` : ''}
        <div class="inv-footer">
          <p>شكراً لتعاملكم مع The Auction House</p>
          <p>هذه الفاتورة مُصدَرة إلكترونياً ولا تحتاج إلى توقيع</p>
          <p style="margin-top:6px;color:#ccc">رقم السجل التجاري: 412370 &nbsp;|&nbsp; رقم الترخيص: 2019/22418</p>
        </div>
      </body></html>
    `;

    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-obsidian-950 border-b border-obsidian-800 flex-shrink-0">
          <p className="text-white font-medium text-sm">معاينة الفاتورة</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={loadingBuyer}
              className="bg-gold-500 text-obsidian-950 text-xs font-semibold px-5 py-2 hover:bg-gold-400 transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              طباعة / PDF
            </button>
            <button onClick={onClose} className="text-obsidian-400 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Invoice preview */}
        <div className="p-8 bg-white text-gray-900 flex-1" dir="rtl">

          {/* Header — one line */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b-2 border-yellow-500 pb-4 mb-5">
            <div>
              <p className="text-lg font-bold tracking-[0.18em] uppercase text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                The Auction House
              </p>
              <p className="text-[10px] text-gray-400 tracking-wider">شركة دار المزادات لتنظيم المزادات العلنية</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
              <span>📞 98933393</span>
              <span>📷 saadalkaaldy_1@</span>
              <span>📍 العاصمة · القبلة · ق002 · قسيمة 000004</span>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500 border-b border-gray-100 pb-4 mb-5">
            <span>رقم الفاتورة: <strong className="text-yellow-600">{invNum}</strong></span>
            <span>التاريخ: <strong className="text-gray-800">{today}</strong></span>
            <span>نوع البيع: <strong className="text-gray-800">{typeAr}</strong></span>
            <span>رقم الترخيص: <strong className="text-gray-800">2019/22418</strong></span>
          </div>

          {/* Buyer section */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3">
              بيانات المشتري
              {item.type === 'listing' && (
                <span className="normal-case tracking-normal ms-2 text-gray-300 text-[10px]">(يمكنك التعديل)</span>
              )}
            </h3>

            {loadingBuyer ? (
              <p className="text-xs text-gray-400 animate-pulse py-2">جارٍ تحميل بيانات الفائز…</p>
            ) : item.type === 'auction' && !buyer.name && !buyer.email ? (
              <p className="text-xs text-gray-400 py-2">لا توجد مزايدات مسجلة لهذا المزاد</p>
            ) : (
              <div className="space-y-2">
                {[
                  { key: 'name',  label: 'الاسم',                 placeholder: 'اسم المشتري' },
                  { key: 'email', label: 'البريد الإلكتروني',     placeholder: 'example@email.com' },
                  { key: 'phone', label: 'رقم الهاتف',            placeholder: '+965 XXXX XXXX' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-3 py-1.5 border-b border-gray-50">
                    <span className="text-gray-500 text-sm w-36 flex-shrink-0">{label}</span>
                    <input
                      type="text"
                      value={buyer[key as keyof Buyer]}
                      onChange={e => setBuyer(b => ({ ...b, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 text-sm text-gray-800 bg-transparent border-0 outline-none border-b border-transparent focus:border-yellow-400 py-0.5 transition-colors placeholder-gray-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item details */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3">تفاصيل السلعة</h3>
            {[
              ['الماركة',       item.brand],
              ['الموديل',       item.model],
              ['الرقم المرجعي', item.reference_number || '—'],
              ['الحالة',        cond],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-yellow-50 border border-yellow-400 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-gray-500">إجمالي المبلغ</p>
            <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              {price.toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {cur}
            </p>
          </div>

          {/* Notes */}
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-2">ملاحظات</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات إضافية هنا..."
              rows={3}
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 outline-none focus:border-yellow-400 p-3 resize-none transition-colors placeholder-gray-300"
            />
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
            <p>شكراً لتعاملكم مع The Auction House</p>
            <p>هذه الفاتورة مُصدَرة إلكترونياً ولا تحتاج إلى توقيع</p>
            <p className="text-gray-300">رقم السجل التجاري: 412370 &nbsp;|&nbsp; رقم الترخيص: 2019/22418</p>
          </div>
        </div>
      </div>
    </div>
  );
};
