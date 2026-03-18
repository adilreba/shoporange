import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({ 
  title = 'AtusHome - Modern E-Ticaret Platformu',
  description = 'Turuncu temalı, modern, tam donanımlı e-ticaret platformu. 8 kategori, binlerce ürün, uygun fiyatlar ve hızlı teslimat.',
  keywords = 'e-ticaret, alışveriş, online mağaza, elektronik, moda, ev yaşam, kozmetik',
  image = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
  url = 'https://atushome.com',
  type = 'website'
}: SEOProps) {
  const fullTitle = title.includes('AtusHome') ? title : `${title} | AtusHome`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AtusHome" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AtusHome" />
      <meta property="og:locale" content="tr_TR" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#f97316" />
      <meta name="msapplication-TileColor" content="#f97316" />
    </Helmet>
  );
}
