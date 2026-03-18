import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    // Her navigation'da (aynı sayfaya bile tıklansa) en üste scroll yap
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [pathname, key]); // key değişikliğini de izle (aynı path'e tekrar tıklamalar için)

  return null;
}
