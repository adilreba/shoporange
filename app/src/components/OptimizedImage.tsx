import { useState, useEffect, useRef } from 'react';

const CDN_URL = import.meta.env.VITE_CDN_URL || '';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const SIZES = [320, 640, 960, 1280, 1920];

function getImageUrl(src: string, width?: number, format?: string): string {
  let url = src;
  
  // Eğer src relative ise CDN prefix ekle
  if (CDN_URL && !url.startsWith('http') && !url.startsWith('data:')) {
    url = `${CDN_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  
  // CloudFront Image Optimization query params
  const params = new URLSearchParams();
  if (width) params.set('w', String(width));
  if (format) params.set('f', format);
  
  if (params.toString()) {
    url += (url.includes('?') ? '&' : '?') + params.toString();
  }
  
  return url;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  priority = false,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // Lazy loading için IntersectionObserver
  useEffect(() => {
    if (priority || isInView) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // 200px önceden yükle
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [priority]);
  
  // srcSet oluştur
  const srcSet = isInView
    ? SIZES.filter((w) => !width || w <= width * 2)
        .map((w) => `${getImageUrl(src, w, 'webp')} ${w}w`)
        .join(', ')
    : undefined;
  
  const imgSrc = isInView ? getImageUrl(src, width) : undefined;
  
  if (error) {
    return (
      <div
        ref={imgRef}
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width, height, objectFit }}
      >
        <span className="text-muted-foreground text-sm">{alt}</span>
      </div>
    );
  }
  
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder blur efekti */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {isInView && (
        <picture>
          {/* WebP fallback */}
          <source
            type="image/webp"
            srcSet={srcSet}
            sizes={sizes}
          />
          <img
            src={imgSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: '100%', height: '100%', objectFit }}
          />
        </picture>
      )}
    </div>
  );
}
