/**
 * PullToRefresh
 * =============
 * Native benzeri pull-to-refresh bileşeni.
 * Sadece native app'te görünür, web'de gizlenir.
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';

import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  /** Minimum çekme mesafesi (px) */
  threshold?: number;
  /** Maksimum çekme mesafesi (px) */
  maxPull?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  className = '',
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  // Web'de veya istemci dışında gösterme
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Sadece sayfa en üstteyse çalışsın
    if (window.scrollY > 5) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || refreshing || window.scrollY > 5) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Direnç ekle (daha çekince zorlansın)
        const resistance = diff * 0.4;
        setPullDistance(Math.min(resistance, maxPull));
        // Touch scroll'u engelle
        if (diff > 10) {
          e.preventDefault();
        }
      }
    },
    [pulling, refreshing, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, threshold, refreshing, onRefresh]);



  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pulling ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform duration-200 z-10"
        style={{
          top: 0,
          height: pullDistance,
          transform: `translateY(${-maxPull + pullDistance}px)`,
          opacity: Math.min(pullDistance / threshold, 1),
        }}
      >
        {refreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        ) : (
          <div
            className="h-6 w-6 rounded-full border-2 border-orange-500 border-t-transparent transition-transform"
            style={{
              transform: `rotate(${(pullDistance / threshold) * 360}deg)`,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
