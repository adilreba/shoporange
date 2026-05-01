import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Sayfa Bulunamadı - AtusHome"
        description="Aradığınız sayfa bulunamadı. Ana sayfaya dönün veya başka bir arama yapın."
        noindex
      />
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Illustration */}
          <div className="mb-8 relative">
            <div className="text-[120px] sm:text-[150px] font-bold text-orange-100 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
            Sayfa Bulunamadı
          </h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir.
            Lütfen adresi kontrol edin veya ana sayfaya dönün.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="gap-2 gradient-orange"
            >
              <Home className="w-4 h-4" />
              Ana Sayfa
            </Button>
            <Button 
              onClick={() => navigate('/products')}
              variant="outline"
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Ürünleri Keşfet
            </Button>
          </div>

          {/* Popular Links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Popüler Sayfalar
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Elektronik', 'Moda', 'Ev & Yaşam', 'Kozmetik', 'Spor'].map((cat) => (
                <Button
                  key={cat}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/products?category=${cat.toLowerCase().replace(' & ', '-').replace(' ', '-')}`)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}
