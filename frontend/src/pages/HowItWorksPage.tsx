import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useT } from '../i18n/useLanguage';

const steps = [
  {
    num: '01',
    icon: '◈',
    title: 'إنشاء حساب',
    desc: 'سجّل بريدك الإلكتروني وأنشئ حسابك في دقائق. يراجع فريقنا جميع الأعضاء الجدد للحفاظ على مجتمع موثوق من هواة الساعات.',
  },
  {
    num: '02',
    icon: '◈',
    title: 'تصفح المزادات والسوق',
    desc: 'اكتشف مزادات الساعات النادرة والقطع المختارة في سوق الشراء الفوري. كل قطعة موثقة ومتحقق منها قبل عرضها.',
  },
  {
    num: '03',
    icon: '◈',
    title: 'إيداع مبلغ التأمين',
    desc: 'للمشاركة في المزادات، يُطلب منك إيداع مبلغ تأمين مسبق. وديعتك آمنة ومحفوظة، وتُستردّ كاملةً في حال عدم الفوز.',
  },
  {
    num: '04',
    icon: '◈',
    title: 'زايد وافز',
    desc: 'زايد على الساعات التي تعجبك بكل ثقة. تتيح المزادات المباشرة تجربة مثيرة وشفافة، وتُعلن النتائج فور انتهاء المزاد.',
  },
  {
    num: '05',
    icon: '◈',
    title: 'إتمام الشراء والاستلام',
    desc: 'بعد الفوز، يتواصل معك فريقنا لإتمام الدفع وترتيب التسليم. نضمن وصول ساعتك بأمان تام.',
  },
];

const faqs = [
  {
    q: 'من يمكنه المشاركة في المزادات؟',
    a: 'يمكن لأي شخص بالغ التسجيل في المنصة. للمزايدة، يجب إيداع مبلغ التأمين المطلوب ومراجعة الحساب من قِبل فريقنا.',
  },
  {
    q: 'هل يمكنني بيع ساعتي على المنصة؟',
    a: 'نعم. تواصل معنا عبر صفحة التواصل أو قدّم طلب تقييم لساعتك. بعد المراجعة، نساعدك في إدراجها للبيع أو في مزاد.',
  },
  {
    q: 'ما وسائل الدفع المتاحة؟',
    a: 'نقبل التحويل البنكي وبطاقات الائتمان. التفاصيل الكاملة تُقدَّم عند إتمام كل عملية.',
  },
  {
    q: 'هل التوصيل متاح خارج الكويت؟',
    a: 'نعم، نشحن إلى معظم دول الخليج والعالم. تكاليف الشحن وشروطه تُحدَّد حسب الوجهة.',
  },
];

export const HowItWorksPage: React.FC = () => {
  const { lang } = useT();
  return (
    <Layout>
      <Breadcrumb items={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
        { label: lang === 'ar' ? 'كيف تعمل المنصة' : 'How It Works' },
      ]} />

      {/* Hero */}
      <section className="relative bg-obsidian-950 overflow-hidden py-28 px-4 flex items-center justify-center text-center">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="absolute top-10 start-10 w-14 h-14 border-t border-s border-gold-500/20" />
        <div className="absolute top-10 end-10 w-14 h-14 border-t border-e border-gold-500/20" />
        <div className="relative">
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-4">دليل المنصة</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            {lang === 'ar' ? 'كيف تعمل المنصة' : 'How It Works'}
          </h1>
          <p className="text-obsidian-400 text-base max-w-xl mx-auto">
            من التسجيل حتى استلام ساعتك — دليل خطوة بخطوة
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={i} className="relative flex gap-6 md:gap-10 pb-12 last:pb-0">
              {/* Line */}
              {i < steps.length - 1 && (
                <div className="absolute start-[27px] top-14 bottom-0 w-px bg-obsidian-800" />
              )}
              {/* Number circle */}
              <div className="flex-shrink-0 w-14 h-14 border border-gold-500/40 bg-obsidian-900 flex flex-col items-center justify-center">
                <span className="text-gold-500 text-[10px] tracking-widest">{s.num}</span>
              </div>
              {/* Content */}
              <div className="pt-3">
                <h3 className="font-serif text-white text-xl mb-2">{s.title}</h3>
                <p className="text-obsidian-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-obsidian-950 border-t border-obsidian-800 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-2 text-center">أسئلة شائعة</p>
          <h2 className="font-serif text-3xl text-white mb-10 text-center">الأسئلة المتكررة</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="border border-obsidian-800 bg-obsidian-900 p-6">
                <h4 className="text-white font-medium mb-2">{f.q}</h4>
                <p className="text-obsidian-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <p className="text-obsidian-400 text-sm mb-6">هل لديك استفسار؟ فريقنا جاهز لمساعدتك</p>
        <Link to="/contact" className="btn-gold px-10">تواصل معنا</Link>
      </section>
    </Layout>
  );
};
