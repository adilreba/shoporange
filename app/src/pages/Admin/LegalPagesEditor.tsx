import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { legalPagesAdminApi, type LegalPage } from '@/services/legalPagesApi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Quill editör modülleri
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'link'
];

export function LegalPagesEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  
  const [formData, setFormData] = useState<Partial<LegalPage>>({
    title: '',
    slug: '',
    content: '',
    summary: '',
    isPublished: false,
    order: 0,
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    if (!isNew && id) {
      loadPage(id);
    }
  }, [id, isNew]);

  const loadPage = async (pageId: string) => {
    try {
      const page = await legalPagesAdminApi.getById(pageId);
      setFormData(page);
    } catch (error) {
      toast.error('Sayfa yüklenemedi');
      navigate('/admin/legal-pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validasyon
    if (!formData.title?.trim()) {
      toast.error('Başlık gerekli');
      return;
    }
    if (!formData.slug?.trim()) {
      toast.error('Slug gerekli');
      return;
    }
    if (!formData.content?.trim()) {
      toast.error('İçerik gerekli');
      return;
    }

    // Slug formatını kontrol et
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Slug sadece küçük harf, rakam ve tire içerebilir');
      return;
    }

    try {
      setSaving(true);
      
      if (isNew) {
        await legalPagesAdminApi.create(formData);
        toast.success('Sayfa oluşturuldu');
      } else if (id) {
        await legalPagesAdminApi.update(id, formData);
        toast.success('Sayfa güncellendi');
      }
      
      navigate('/admin/legal-pages');
    } catch (error) {
      toast.error(isNew ? 'Oluşturulamadı' : 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/legal-pages')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Yeni Yasal Sayfa' : 'Sayfayı Düzenle'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            {preview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {preview ? 'Düzenle' : 'Önizle'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Kaydet
          </Button>
        </div>
      </div>

      {preview ? (
        // Önizleme Modu
        <div className="bg-white rounded-lg border p-8 max-w-4xl mx-auto">
          <div className="prose prose-orange max-w-none">
            <h1>{formData.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: formData.content || '' }} />
          </div>
        </div>
      ) : (
        // Düzenleme Modu
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Ana İçerik */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Sayfa Başlığı *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      title,
                      slug: isNew && !prev.slug ? generateSlug(title) : prev.slug,
                    }));
                  }}
                  placeholder="örn: Gizlilik Politikası"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="gizlilik-politikasi"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sadece küçük harf, rakam ve tire kullanın
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Sayfa İçeriği *</Label>
                <div className="border rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[400px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Ayarlar */}
          <div className="space-y-6">
            {/* Yayın Durumu */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Yayın Ayarları
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published" className="cursor-pointer">Yayında</Label>
                  <p className="text-xs text-muted-foreground">
                    Sayfayı herkese açık yap
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Sıralama</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h3 className="font-medium">SEO Ayarları</h3>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Özet</Label>
                <Input
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Sayfanın kısa özeti..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Başlık</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO başlığı..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Açıklama</Label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO açıklaması..."
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>

            {/* Bilgi Kartı */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">💡 İpuçları</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Başlık ve içerik zorunludur</li>
                <li>Slug benzersiz olmalıdır</li>
                <li>Yayınlamadan önce önizleyin</li>
                <li>SEO alanları boş bırakılırsa başlık kullanılır</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
