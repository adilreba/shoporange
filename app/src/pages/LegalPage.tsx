import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { legalPagesPublicApi, type LegalPage } from '@/services/legalPagesApi';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/ui/button';

export function LegalPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPage(slug);
    }
  }, [slug]);

  const loadPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      const data = await legalPagesPublicApi.getBySlug(pageSlug);
      setPage(data);
      // Sayfa başlığını güncelle
      document.title = `${data.title} | AtusHome`;
    } catch (error) {
      toast.error('Sayfa bulunamadı');
      setPage(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sayfa Bulunamadı</h1>
            <p className="text-muted-foreground mb-6">
              Aradığınız yasal sayfa mevcut değil veya kaldırılmış.
            </p>
            <Button asChild>
              <Link to="/">Ana Sayfaya Dön</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-orange-600">Ana Sayfa</Link>
              <span>/</span>
              <span className="text-foreground">{page.title}</span>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
              {/* Başlık */}
              <div className="mb-8 pb-8 border-b">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {page.title}
                </h1>
                {page.summary && (
                  <p className="text-lg text-gray-600">{page.summary}</p>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Son güncelleme: {new Date(page.lastUpdated).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* İçerik */}
              <div 
                className="prose prose-orange prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />

              {/* Alt Bilgi */}
              <div className="mt-12 pt-8 border-t">
                <Button variant="outline" asChild>
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Ana Sayfaya Dön
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
