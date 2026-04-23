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
          .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 24px; }
          .inv-brand  { font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
          .inv-sub    { font-size: 11px; color: #888; margin-top: 4px; letter-spacing: 1px; }
          .inv-meta p { margin-bottom: 4px; font-size: 13px; }
          .inv-section { margin-bottom: 24px; }
          .inv-section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; }
          .inv-row    { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
          .inv-row span:first-child { color: #666; }
          .inv-total  { display: flex; justify-content: space-between; align-items: center; background: #f9f6ef; border: 1px solid #D4AF37; padding: 16px 20px; margin-top: 24px; }
          .inv-footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="inv-header">
          <div>
            <p class="inv-brand">The Auction House</p>
            <p class="inv-sub">الكويت · تأسست 2018</p>
          </div>
          <div class="inv-meta" style="text-align:left">
            <p>رقم الفاتورة: <strong style="color:#b8960c">${invNum}</strong></p>
            <p>التاريخ: <strong>${today}</strong></p>
            <p>نوع البيع: <strong>${typeAr}</strong></p>
          </div>
        </div>
        ${buyerRows ? `<div class="inv-section"><h3>بيانات المشتري</h3>${buyerRows}</div>` : ''}
        <div class="inv-section"><h3>تفاصيل السلعة</h3>${itemRows}</div>
        <div class="inv-total">
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">إجمالي المبلغ</span>
          <strong style="font-size:26px">${price.toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${cur}</strong>
        </div>
        <div class="inv-footer">
          <p>شكراً لتعاملكم مع The Auction House</p>
          <p style="margin-top:4px">هذه الفاتورة مُصدَرة إلكترونياً ولا تحتاج إلى توقيع</p>
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

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-yellow-500 pb-5 mb-6">
            <div>
              <p className="text-2xl font-bold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                The Auction House
              </p>
              <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">الكويت · تأسست 2018</p>
            </div>
            <div className="text-left text-sm space-y-1">
              <p className="text-gray-500">رقم الفاتورة: <strong className="text-yellow-600">{invNum}</strong></p>
              <p className="text-gray-500">التاريخ: <strong className="text-gray-800">{today}</strong></p>
              <p className="text-gray-500">نوع البيع: <strong className="text-gray-800">{typeAr}</strong></p>
            </div>
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

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center text-xs text-gray-400">
            <p>شكراً لتعاملكم مع The Auction House</p>
            <p className="mt-1">هذه الفاتورة مُصدَرة إلكترونياً ولا تحتاج إلى توقيع</p>
          </div>
        </div>
      </div>
    </div>
  );
};
