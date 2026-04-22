import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

const services = [
  { icon: '⟡', text: 'مزادات متخصصة للساعات الفاخرة' },
  { icon: '⟡', text: 'عرض وبيع القطع المختارة' },
  { icon: '⟡', text: 'خزنة رقمية خاصة للعملاء لإدارة مجموعاتهم' },
  { icon: '⟡', text: 'طلب تقييم احترافي للساعات' },
  { icon: '⟡', text: 'تجربة منظمة وآمنة لإدارة المقتنيات' },
];

export const AboutPage: React.FC = () => {
  return (
    <Layout>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-obsidian-950 overflow-hidden py-32 px-4 flex items-center justify-center text-center">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="absolute top-10 start-10 w-14 h-14 border-t border-s border-gold-500/20" />
        <div className="absolute top-10 end-10 w-14 h-14 border-t border-e border-gold-500/20" />
        <div className="absolute bottom-10 start-10 w-14 h-14 border-b border-s border-gold-500/20" />
        <div className="absolute bottom-10 end-10 w-14 h-14 border-b border-e border-gold-500/20" />

        <div className="relative max-w-2xl">
          <p className="text-gold-500 text-[10px] uppercase tracking-[0.5em] mb-6">The Auction House</p>
          <div className="w-16 h-px bg-gold-500/40 mx-auto mb-8" />
          <h1 className="font-serif text-5xl sm:text-7xl text-white leading-none mb-8">من نحن</h1>
          <div className="w-16 h-px bg-gold-500/40 mx-auto mb-8" />
          <p className="text-obsidian-300 text-sm sm:text-base leading-loose">
            منصة متخصصة في الساعات الفاخرة، أسسها سعد الخالدي،<br className="hidden sm:block" />
            تجمع بين الخبرة، الثقة، والطرح الاحترافي.
          </p>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-500 text-[10px] uppercase tracking-[0.4em] mb-6">من نحن</p>
          <p className="text-obsidian-200 text-sm sm:text-base leading-[2.2] font-light">
            The Auction House منصة متخصصة في الساعات الفاخرة، أسسها سعد الخالدي، تجمع بين الخبرة، الثقة،
            والطرح الاحترافي في عالم الوقت والمقتنيات النادرة. نعمل على تقديم تجربة متكاملة لعشاق الساعات
            من خلال المزادات، العرض الخاص، إدارة المقتنيات، وخدمات التقييم.
          </p>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-950 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-gold-500 text-[10px] uppercase tracking-[0.4em] mb-5">قصتنا</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white mb-10 leading-tight">
              منذ ٢٠١٨
            </h2>
            <p className="text-obsidian-300 text-sm leading-[2.2] mb-6 font-light">
              انطلقت The Auction House في 28 فبراير 2018 برؤية واضحة تقوم على بناء اسم يعتمد على المصداقية،
              المهنية، والاحترافية في سوق الساعات الفاخرة. منذ البداية، كان الهدف تقديم تجربة مختلفة ترتكز
              على الأمانة والاهتمام بقيمة كل قطعة، وما تمثله لمالكها.
            </p>
            <p className="text-obsidian-300 text-sm leading-[2.2] font-light">
              ومع تطور السوق وازدياد اهتمام العملاء بالمقتنيات الراقية، توسعت المنصة لتشمل خدمات متكاملة،
              تجمع بين المزاد، العرض، وإدارة المقتنيات ضمن بيئة منظمة وآمنة تعكس مستوى الفخامة الذي
              يستحقه هذا المجال.
            </p>
          </div>

          {/* Editorial graphic */}
          <div className="relative border border-obsidian-800 p-12">
            <div className="absolute top-4 start-4 w-8 h-8 border-t border-s border-gold-500/30" />
            <div className="absolute bottom-4 end-4 w-8 h-8 border-b border-e border-gold-500/30" />
            <div className="text-center space-y-4">
              <p className="font-serif text-gold-500/15 text-[7rem] leading-none select-none">٢٠١٨</p>
              <div className="w-12 h-px bg-gold-500/30 mx-auto" />
              <p className="text-obsidian-500 text-[10px] uppercase tracking-[0.4em]">28 فبراير</p>
              <p className="text-obsidian-600 text-[10px] uppercase tracking-[0.3em]">The Auction House</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vision ───────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-500 text-[10px] uppercase tracking-[0.4em] mb-6">رؤيتنا</p>
          <div className="w-10 h-px bg-gold-500/30 mx-auto mb-8" />
          <p className="text-obsidian-200 text-sm sm:text-base leading-[2.2] font-light">
            نسعى لأن تكون The Auction House المرجع الموثوق في المنطقة لعالم الساعات الفاخرة،
            وأن نقدم تجربة حديثة تواكب تطلعات الجامعين والمستثمرين والمهتمين بالقطع النادرة.
          </p>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-950 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 text-[10px] uppercase tracking-[0.4em] mb-3">ماذا نقدم</p>
            <div className="w-10 h-px bg-gold-500/30 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-obsidian-800">
            {services.map((s, i) => (
              <div key={i} className="bg-obsidian-950 p-8 text-center group hover:bg-obsidian-900 transition-colors">
                <p className="text-gold-500/40 text-2xl mb-4 group-hover:text-gold-500/70 transition-colors">◆</p>
                <p className="text-obsidian-300 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
            {/* Fill to complete the grid row */}
            {services.length % 3 !== 0 && (
              <div className="hidden lg:block bg-obsidian-950 p-8" />
            )}
          </div>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-t border-obsidian-800 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-500 text-[10px] uppercase tracking-[0.4em] mb-6">لماذا نحن</p>
          <div className="w-10 h-px bg-gold-500/30 mx-auto mb-10" />
          <p className="text-obsidian-200 text-sm sm:text-base leading-[2.4] font-light mb-14">
            لأننا نؤمن أن الساعة ليست مجرد منتج، بل قيمة، وقصة، وقطعة تستحق أن تُعرض وتُدار باحتراف.
            لذلك نبني تجربتنا على الأمانة، الخبرة، والاهتمام بالتفاصيل، لنقدم تجربة تليق بثقة عملائنا.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auctions" className="btn-gold px-10">تصفح المزادات</Link>
            <Link to="/marketplace" className="btn-outline px-10">السوق</Link>
          </div>
        </div>
      </section>

    </Layout>
  );
};
