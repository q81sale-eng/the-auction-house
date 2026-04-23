import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useT } from '../i18n/useLanguage';

const process = [
  {
    num: '01',
    title: 'الفحص الخارجي',
    desc: 'يُفحص الهيكل والتاج والزجاج والأزرار وجميع العناصر الخارجية بدقة للتحقق من مطابقتها لمواصفات الموديل الأصلي.',
  },
  {
    num: '02',
    title: 'التحقق من الحركة',
    desc: 'تُفحص الحركة الداخلية من قِبل خبرائنا للتأكد من أصالتها وعملها بشكل صحيح، ومطابقتها للرقم التسلسلي.',
  },
  {
    num: '03',
    title: 'مراجعة الأوراق والوثائق',
    desc: 'يُتحقق من صحة بطاقة الضمان والفاتورة وبطاقة الهوية إن وُجدت، مع التأكد من تطابق الأرقام التسلسلية.',
  },
  {
    num: '04',
    title: 'توثيق الحالة',
    desc: 'تُصنَّف الساعة وفق معايير واضحة (لم تستخدم / مستخدم / مستخدم يوجد آثار) وتُوثَّق بصور تفصيلية عالية الدقة.',
  },
  {
    num: '05',
    title: 'إصدار شهادة الأصالة',
    desc: 'كل قطعة تجتاز عملية الفحص تحصل على تأكيد الأصالة من فريقنا قبل إدراجها للبيع أو المزاد.',
  },
];

const standards = [
  { icon: '◈', title: 'خبراء متخصصون', desc: 'فريق من خبراء الساعات ذوي خبرة عقود في تقييم ومصادقة الساعات الفاخرة.' },
  { icon: '◈', title: 'فحص دقيق لكل قطعة', desc: 'لا تُقبل أي ساعة للعرض دون اجتياز جميع مراحل الفحص والتحقق.' },
  { icon: '◈', title: 'شفافية كاملة', desc: 'نوفر صوراً تفصيلية لكل جزء من الساعة وتوثيقاً لأي علامات استخدام.' },
  { icon: '◈', title: 'ضمان رد المبلغ', desc: 'إذا لم تتطابق الساعة مع وصفها، نضمن لك استرداد مبلغك كاملاً.' },
];

export const AuthenticationPage: React.FC = () => {
  const { lang } = useT();
  return (
    <Layout>
      <Breadcrumb items={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
        { label: lang === 'ar' ? 'التحقق والمصادقة' : 'Authentication' },
      ]} />

      {/* Hero */}
      <section className="relative bg-obsidian-950 overflow-hidden py-28 px-4 flex items-center justify-center text-center">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="absolute top-10 start-10 w-14 h-14 border-t border-s border-gold-500/20" />
        <div className="absolute top-10 end-10 w-14 h-14 border-t border-e border-gold-500/20" />
        <div className="relative">
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-4">الجودة والثقة</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            {lang === 'ar' ? 'التحقق والمصادقة' : 'Authentication'}
          </h1>
          <p className="text-obsidian-400 text-base max-w-xl mx-auto">
            كل ساعة تمر بعملية فحص صارمة قبل أن تصل إليك — هذا وعدنا
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-2 text-center">عملية الفحص</p>
        <h2 className="font-serif text-3xl text-white mb-12 text-center">خطوات المصادقة</h2>
        <div className="space-y-0">
          {process.map((s, i) => (
            <div key={i} className="relative flex gap-6 md:gap-10 pb-12 last:pb-0">
              {i < process.length - 1 && (
                <div className="absolute start-[27px] top-14 bottom-0 w-px bg-obsidian-800" />
              )}
              <div className="flex-shrink-0 w-14 h-14 border border-gold-500/40 bg-obsidian-900 flex flex-col items-center justify-center">
                <span className="text-gold-500 text-[10px] tracking-widest">{s.num}</span>
              </div>
              <div className="pt-3">
                <h3 className="font-serif text-white text-xl mb-2">{s.title}</h3>
                <p className="text-obsidian-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Standards grid */}
      <section className="bg-obsidian-950 border-t border-obsidian-800 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-2 text-center">معاييرنا</p>
          <h2 className="font-serif text-3xl text-white mb-12 text-center">ما يميز منصتنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map((s, i) => (
              <div key={i} className="border border-obsidian-800 bg-obsidian-900 p-6">
                <span className="text-gold-500 text-lg mb-3 block">{s.icon}</span>
                <h4 className="text-white font-serif text-lg mb-2">{s.title}</h4>
                <p className="text-obsidian-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <p className="text-obsidian-400 text-sm mb-2">هل لديك ساعة تريد تقييمها؟</p>
        <p className="text-obsidian-500 text-xs mb-6">فريقنا يقدم خدمة تقييم احترافية لساعتك</p>
        <Link to="/contact" className="btn-gold px-10">طلب تقييم</Link>
      </section>
    </Layout>
  );
};
