import React from 'react';

interface Props {
  title: string;
  lang?: string;
}

export const WhatsAppShare: React.FC<Props> = ({ title, lang = 'ar' }) => {
  const handleShare = () => {
    const url = window.location.href;
    const text = lang === 'ar'
      ? `${title}\n\nاطلع على هذا العرض في The Auction House:\n${url}`
      : `${title}\n\nCheck this out on The Auction House:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 text-xs uppercase tracking-wider py-2.5 transition-colors"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L.057 23.486a.5.5 0 00.609.61l5.748-1.505A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.938a9.935 9.935 0 01-5.058-1.378l-.36-.214-3.742.979.999-3.645-.235-.375A9.938 9.938 0 012.062 12C2.062 6.511 6.511 2.062 12 2.062c5.488 0 9.938 4.449 9.938 9.938 0 5.488-4.45 9.938-9.938 9.938z"/>
      </svg>
      {lang === 'ar' ? 'شارك على واتساب' : 'Share on WhatsApp'}
    </button>
  );
};
