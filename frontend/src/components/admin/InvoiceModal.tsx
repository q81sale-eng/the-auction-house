import React, { useEffect } from 'react';

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

const CONDITIONS: Record<string, string> = {
  unworn:          'لم تستخدم',
  used:            'مستخدم',
  used_marks:      'مستخدم يوجد آثار',
  unworn_storage:  'لم تستخدم آثار سوء تخزين',
  new:             'جديد',
  excellent:       'ممتاز',
  good:            'جيد',
  fair:            'مقبول',
};

const pad = (n: number) => String(n).padStart(2, '0');

function formatInvoiceDate(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function invoiceNumber(id: string) {
  return `TAH-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
}

interface Props {
  item: InvoiceItem;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({ item, onClose }) => {
  const invNum  = invoiceNumber(item.id);
  const today   = formatInvoiceDate();
  const price   = parseFloat(String(item.price)) || 0;
  const cur     = item.currency ?? 'د.ك';
  const typeAr  = item.type === 'auction' ? 'مزاد' : 'سوق مباشر';
  const cond    = item.condition ? (CONDITIONS[item.condition] ?? item.condition) : '—';

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePrint = () => {
    const printContent = document.getElementById('tah-invoice')?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>فاتورة ${invNum}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; background: #fff; color: #111; padding: 40px; }
          .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 24px; }
          .inv-brand  { font-size: 22px; font-weight: bold; color: #111; letter-spacing: 2px; text-transform: uppercase; }
          .inv-sub    { font-size: 11px; color: #888; margin-top: 4px; letter-spacing: 1px; }
          .inv-meta   { text-align: left; font-size: 13px; }
          .inv-meta p { margin-bottom: 4px; }
          .inv-meta strong { color: #D4AF37; }
          .inv-section { margin-bottom: 24px; }
          .inv-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; }
          .inv-row    { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
          .inv-row span:first-child { color: #666; }
          .inv-total  { display: flex; justify-content: space-between; align-items: center; background: #f9f6ef; border: 1px solid #D4AF37; padding: 16px 20px; margin-top: 24px; }
          .inv-total-label { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
          .inv-total-price { font-size: 26px; font-weight: bold; color: #111; }
          .inv-footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-obsidian-950 border-b border-obsidian-800">
            <p className="text-white font-medium text-sm">معاينة الفاتورة</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="bg-gold-500 text-obsidian-950 text-xs font-semibold px-5 py-2 hover:bg-gold-400 transition-colors uppercase tracking-wider"
              >
                طباعة / PDF
              </button>
              <button onClick={onClose} className="text-obsidian-400 hover:text-white text-xl leading-none">✕</button>
            </div>
          </div>

          {/* Invoice content */}
          <div id="tah-invoice" className="p-8 bg-white text-gray-900" dir="rtl">

            {/* Header */}
            <div className="inv-header flex justify-between items-start border-b-2 border-yellow-500 pb-5 mb-6">
              <div>
                <p className="inv-brand text-2xl font-bold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                  The Auction House
                </p>
                <p className="inv-sub text-xs text-gray-500 mt-1 tracking-widest uppercase">الكويت · تأسست 2018</p>
              </div>
              <div className="text-left text-sm space-y-1">
                <p className="text-gray-500">رقم الفاتورة: <strong className="text-yellow-600 font-bold">{invNum}</strong></p>
                <p className="text-gray-500">التاريخ: <strong className="text-gray-800">{today}</strong></p>
                <p className="text-gray-500">نوع البيع: <strong className="text-gray-800">{typeAr}</strong></p>
              </div>
            </div>

            {/* Item details */}
            <div className="inv-section mb-6">
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
            <div className="flex justify-between items-center bg-yellow-50 border border-yellow-400 px-5 py-4 mt-6">
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
    </>
  );
};
