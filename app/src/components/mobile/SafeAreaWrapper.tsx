/**
 * SafeAreaWrapper
 * ===============
 * iOS notch / dynamic island / home indicator için güvenli alan desteği.
 * CSS env(safe-area-inset-*) değişkenlerini kullanır.
 */

import { type ReactNode } from 'react';
import { isNative, isIOS } from '@/lib/capacitor';
import { cn } from '@/lib/utils';

interface SafeAreaWrapperProps {
  children: ReactNode;
  className?: string;
  /** Üst safe area padding'i ekle (notch için) */
  top?: boolean;
  /** Alt safe area padding'i ekle (home indicator için) */
  bottom?: boolean;
  /** Yatay safe area padding'i ekle */
  horizontal?: boolean;
  /** Sadece native'de uygula */
  nativeOnly?: boolean;
}

/**
 * SafeAreaWrapper
 * 
 * Kullanım:
 * <SafeAreaWrapper top bottom>
 *   <div>İçerik</div>
 * </SafeAreaWrapper>
 */
export function SafeAreaWrapper({
  children,
  className,
  top = false,
  bottom = false,
  horizontal = false,
  nativeOnly = true,
}: SafeAreaWrapperProps) {
  // Web'de ve nativeOnly true ise, sadece temel padding
  if (nativeOnly && !isNative()) {
    return <div className={className}>{children}</div>;
  }

  const paddingStyles: React.CSSProperties = {};

  if (top) {
    paddingStyles.paddingTop = 'env(safe-area-inset-top)';
  }
  if (bottom) {
    paddingStyles.paddingBottom = 'env(safe-area-inset-bottom)';
  }
  if (horizontal) {
    paddingStyles.paddingLeft = 'env(safe-area-inset-left)';
    paddingStyles.paddingRight = 'env(safe-area-inset-right)';
  }

  return (
    <div
      className={cn(
        // iOS momentum scroll
        isIOS() && 'ios-momentum-scroll',
        className
      )}
      style={paddingStyles}
    >
      {children}
    </div>
  );
}

/**
 * SafeAreaView
 * Tam ekran sayfalar için (top + bottom + horizontal)
 */
export function SafeAreaView({
  children,
  className,
  nativeOnly = true,
}: Omit<SafeAreaWrapperProps, 'top' | 'bottom' | 'horizontal'>) {
  return (
    <SafeAreaWrapper
      top
      bottom
      horizontal
      className={className}
      nativeOnly={nativeOnly}
    >
      {children}
    </SafeAreaWrapper>
  );
}

export default SafeAreaWrapper;
