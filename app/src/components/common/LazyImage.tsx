/**
 * LazyImage - Amazon/Trendyol tarzı akıllı resim yükleme
 * 
 * Özellikler:
 * - Intersection Observer ile viewport'a yaklaşınca yükleme
 * - Blur-up efekti (önce blur, sonra net)
 * - Fade-in geçişi
 * - Layout shift koruması (aspect-ratio)
 * - srcset desteği (responsive)
 * - fetchpriority desteği
 * - Hata durumunda fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // "1/1", "4/3", "16/9" vb.
  sizes?: string; // srcset için: "(max-width: 768px) 50vw, 25vw"
  srcSet?: string; // farklı boyutlar: "/img-300.jpg 300w, /img-600.jpg 600w"
  priority?: boolean; // İlk ekrandaki resimler için true
  placeholderColor?: string; // Arka plan rengi
  blurSrc?: string; // Küçük blur placeholder resim URL
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = '1/1',
  sizes,
  srcSet,
  priority = false,
  placeholderColor = '#f3f4f6',
  blurSrc,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority ise hence yükle
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - viewport'a yaklaşınca yükle
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // Bir kez tetiklendikten sonra izlemeyi bırak
          }
        });
      },
      {
        rootMargin: '200px 0px', // 200px önceden yükleme başlat (Amazon tarzı)
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Fallback SVG (hata durumunda)
  const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="${encodeURIComponent(placeholderColor)}"/%3E%3Ctext x="50%25" y="50%25" font-family="system-ui, sans-serif" font-size="16" fill="%239ca3af" text-anchor="middle" dy=".3em"%3E${encodeURIComponent(alt || 'Ürün')}%3C/text%3E%3C/svg%3E`;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio,
        backgroundColor: placeholderColor,
      }}
    >
      {/* 1. Blur placeholder (eğer varsa) - LQIP */}
      {blurSrc && !isLoaded && !hasError && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-md scale-110 transition-opacity duration-500"
          style={{ opacity: isLoaded ? 0 : 1 }}
        />
      )}

      {/* 2. Skeleton/placeholder blur efekti (blurSrc yoksa) */}
      {!blurSrc && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}

      {/* 3. Ana resim */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? fallbackSvg : src}
          alt={alt}
          sizes={sizes}
          srcSet={srcSet}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{
            willChange: 'opacity, transform',
          }}
        />
      )}

      {/* 4. Hata durumunda fallback gösterimi */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <span className="text-xs text-gray-400 text-center px-2">{alt}</span>
        </div>
      )}
    </div>
  );
}

export default LazyImage;
