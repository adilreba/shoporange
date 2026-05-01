import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article' | 'organization';
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'pre_order';
  brand?: string;
  rating?: number;
  reviewCount?: number;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  noindex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
  canonicalUrl?: string;
}

export function SEO({ 
  title = 'AtusHome - Modern E-Ticaret Platformu',
  description = 'Turuncu temalı, modern, tam donanımlı e-ticaret platformu. 8 kategori, binlerce ürün, uygun fiyatlar ve hızlı teslimat.',
  keywords = 'e-ticaret, alışveriş, online mağaza, elektronik, moda, ev yaşam, kozmetik',
  image = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
  url = typeof window !== 'undefined' ? window.location.href : 'https://atushome.com',
  type = 'website',
  price,
  currency = 'TRY',
  availability,
  brand,
  rating,
  reviewCount,
  publishedAt,
  modifiedAt,
  author,
  noindex = false,
  breadcrumbs = [],
  canonicalUrl,
}: SEOProps) {
  const fullTitle = title.includes('AtusHome') ? title : `${title} | AtusHome`;
  const siteUrl = 'https://atushome.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const canonical = canonicalUrl || fullUrl;

  // Schema.org JSON-LD yapıları
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AtusHome',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AtusHome',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://facebook.com/atushome',
      'https://instagram.com/atushome',
      'https://twitter.com/atushome',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-850-123-4567',
      contactType: 'customer service',
      availableLanguage: 'Turkish',
    },
  };

  const productSchema = type === 'product' && price !== undefined ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title.replace(' | AtusHome', ''),
    image,
    description,
    brand: brand ? {
      '@type': 'Brand',
      name: brand,
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: fullUrl,
      priceCurrency: currency,
      price: price.toString(),
      availability: availability === 'in_stock' 
        ? 'https://schema.org/InStock' 
        : availability === 'out_of_stock' 
          ? 'https://schema.org/OutOfStock' 
          : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: 'AtusHome',
      },
    },
    aggregateRating: rating && reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: reviewCount.toString(),
    } : undefined,
  } : null;

  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    url: fullUrl,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    author: author ? {
      '@type': 'Person',
      name: author,
    } : {
      '@type': 'Organization',
      name: 'AtusHome',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AtusHome',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  } : null;

  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${siteUrl}${crumb.url}`,
    })),
  } : null;

  // Schema'ları birleştir
  const schemas = [
    websiteSchema,
    organizationSchema,
    productSchema,
    articleSchema,
    breadcrumbSchema,
  ].filter(Boolean);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AtusHome" />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'article' ? 'article' : type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AtusHome" />
      <meta property="og:locale" content="tr_TR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@atushome" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="tr" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#f97316" />
      <meta name="msapplication-TileColor" content="#f97316" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      
      {/* Schema.org JSON-LD */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

// Yardımcı fonksiyonlar
export function generateProductSEO(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  brand: string;
  rating: number;
  reviewCount: number;
  category: string;
  stock: number;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  canonicalUrl?: string;
}) {
  const title = product.seoTitle || `${product.name} - ${product.brand}`;
  const description = product.seoDescription || product.description.slice(0, 160);
  const slug = product.seoSlug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return {
    title,
    description,
    keywords: `${product.name}, ${product.brand}, ${product.category}, satın al, fiyat`,
    image: product.images[0],
    type: 'product' as const,
    price: product.price,
    currency: 'TRY',
    availability: product.stock > 0 ? 'in_stock' as const : 'out_of_stock' as const,
    brand: product.brand,
    rating: product.rating,
    reviewCount: product.reviewCount,
    slug,
    canonicalUrl: product.canonicalUrl,
  };
}

export function generateCategorySEO(category: {
  name: string;
  description?: string;
  productCount: number;
}) {
  return {
    title: `${category.name} Ürünleri`,
    description: category.description || `${category.name} kategorisinde ${category.productCount} ürün bulunuyor. En uygun fiyatlarla ${category.name} ürünleri AtusHome'da!`,
    keywords: `${category.name}, ${category.name} ürünleri, ${category.name} fiyatları, online satın al`,
    type: 'website' as const,
  };
}

export function generateBreadcrumbs(items: Array<{ name: string; url: string }>) {
  return [
    { name: 'Ana Sayfa', url: '/' },
    ...items,
  ];
}
