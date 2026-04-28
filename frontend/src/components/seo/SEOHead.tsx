import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useT } from '../../i18n/useLanguage';

const SITE_NAME = 'The Auction House';
const SITE_URL  = 'https://www.pavewatch.com';
const OG_IMAGE  = '/og-image.jpg';

interface SEOHeadProps {
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  path?: string;
  image?: string;
  ogType?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  titleEn,
  titleAr,
  descEn,
  descAr,
  path = '',
  image = OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) => {
  const { lang } = useT();
  const title       = lang === 'ar' ? titleAr : titleEn;
  const description = lang === 'ar' ? descAr  : descEn;
  const canonical   = `${SITE_URL}${path}`;
  const ogImg       = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="ar" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={ogImg} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:locale"      content={lang === 'ar' ? 'ar_KW' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImg} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
