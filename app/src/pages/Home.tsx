import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { HeroSection } from '@/sections/HeroSection';
import { CategoriesSection } from '@/sections/CategoriesSection';
import { FeaturedProductsSection } from '@/sections/FeaturedProductsSection';
import { PromoSection } from '@/sections/PromoSection';
import { TestimonialsSection } from '@/sections/TestimonialsSection';
import { NewsletterSection } from '@/sections/NewsletterSection';

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="AtusHome - Modern E-Ticaret Platformu"
        description="Turuncu temalı, modern, tam donanımlı e-ticaret platformu. 8 kategori, binlerce ürün, uygun fiyatlar ve hızlı teslimat."
        keywords="e-ticaret, alışveriş, online mağaza, elektronik, moda, ev yaşam, kozmetik, spor, kitap"
      />
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProductsSection />
        <PromoSection />
        <TestimonialsSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
