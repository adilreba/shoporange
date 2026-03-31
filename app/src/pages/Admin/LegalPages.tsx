import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { legalPagesAdminApi, type LegalPage } from '@/services/legalPagesApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AdminLegalPages() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await legalPagesAdminApi.getAll();
      setPages(data);
    } catch (error) {
      console.error('Load pages error:', error);
      toast.error('Sayfalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await legalPagesAdminApi.seed();
      toast.success('Varsayılan sayfalar oluşturuldu');
      await loadPages();
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Sayfalar oluşturulamadi');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await legalPagesAdminApi.delete(deleteId);
      toast.success('Sayfa silindi');
      setPages(pages.filter(p => p.id !== deleteId));
    } catch (error) {
      toast.error('Silinemedi');
    } finally {
      setDeleteId(null);
    }
  };

  const handleTogglePublish = async (page: LegalPage) => {
    try {
      await legalPagesAdminApi.update(page.id, { 
        isPublished: !page.isPublished 
      });
      toast.success(page.isPublished ? 'Yayından kaldırıldı' : 'Yayınlandı');
      await loadPages();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Yasal Sayfalar</h1>
          <p className="text-muted-foreground">
            KVKK, Gizlilik Politikası ve diğer yasal sayfaları yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Varsayılanları Yükle
          </Button>
          <Button 
            onClick={() => {
              console.log('Navigating to new page...');
              navigate('/admin/legal-pages/new');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sayfa
          </Button>
        </div>
      </div>

      {/* Uyarı Kartı */}
      {pages.filter(p => p.isPublished).length < 4 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Eksik Yasal Sayfalar</h3>
            <p className="text-sm text-amber-700">
              E-ticaret için en az KVKK, Gizlilik Politikası, Mesafeli Satış Sözleşmesi ve 
              İade Politikası sayfalarının yayinda olmasi gerekli.
            </p>
          </div>
        </div>
      )}

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sayfa ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Sıra</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sayfa</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Son Güncelleme</th>
                <th className="px-4 py-3 text-right text-sm font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {searchTerm ? 'Sonuç bulunamadı' : 'Henüz sayfa yok'}
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{page.order || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{page.title}</p>
                          {page.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {page.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      /{page.slug}
                    </td>
                    <td className="px-4 py-3">
                      {page.isPublished ? (
                        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3" />
                          Yayında
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Taslak
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(page.lastUpdated).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublish(page)}
                          title={page.isPublished ? 'Yayından kaldır' : 'Yayınla'}
                        >
                          {page.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/legal-pages/edit/${page.id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(page.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Silme Onay Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sayfayi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Sayfa kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
