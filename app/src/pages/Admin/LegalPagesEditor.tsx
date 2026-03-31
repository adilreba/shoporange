import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Loader2,
  FileText,
  Bold,
  Italic,
  Heading,
  List,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { legalPagesAdminApi, type LegalPage } from '@/services/legalPagesApi';

const ToolbarButton = ({ 
  icon: Icon, 
  label, 
  onClick,
  active = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-gray-200' : ''}`}
    title={label}
  >
    <Icon className="h-4 w-4" />
  </button>
);

export function LegalPagesEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(false);
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
    console.log('Editor mounted, id:', id, 'isNew:', isNew);
    if (!isNew && id && id !== 'new') {
      loadPage(id);
    } else {
      // Yeni sayfa - varsayılan değerler
      setFormData({
        title: '',
        slug: '',
        content: '',
        summary: '',
        isPublished: false,
        order: 0,
        metaTitle: '',
        metaDescription: '',
      });
      setLoading(false);
    }
  }, [id]);

  const loadPage = async (pageId: string) => {
    try {
      setLoading(true);
      const page = await legalPagesAdminApi.getById(pageId);
      setFormData(page);
    } catch (error) {
      console.error('Load page error:', error);
      toast.error('Sayfa yüklenemedi');
      navigate('/admin/legal-pages');
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = formData.content || '';
    const selected = content.substring(start, end);

    let replacement = '';
    switch (tag) {
      case 'h2':
        replacement = `<h2>${selected || 'Başlık'}</h2>`;
        break;
      case 'h3':
        replacement = `<h3>${selected || 'Alt Başlık'}</h3>`;
        break;
      case 'strong':
        replacement = `<strong>${selected || 'Kalın metin'}</strong>`;
        break;
      case 'em':
        replacement = `<em>${selected || 'İtalik metin'}</em>`;
        break;
      case 'ul':
        replacement = `<ul>\n  <li>${selected || 'Madde 1'}</li>\n  <li>Madde 2</li>\n</ul>`;
        break;
      case 'ol':
        replacement = `<ol>\n  <li>${selected || 'Madde 1'}</li>\n  <li>Madde 2</li>\n</ol>`;
        break;
      case 'a':
        replacement = `<a href="https://">${selected || 'Link metni'}</a>`;
        break;
      default:
        replacement = `<${tag}>${selected}</${tag}>`;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSave = async () => {
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
      console.error('Save error:', error);
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
        <div className="bg-white rounded-lg border p-8 max-w-4xl mx-auto">
          <div className="prose prose-orange max-w-none">
            <h1>{formData.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: formData.content || '' }} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon */}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Sayfa İçeriği *</Label>
                
                <div className="flex items-center gap-1 p-2 bg-gray-50 border rounded-t-lg">
                  <ToolbarButton icon={Heading} label="H2 Başlık" onClick={() => insertTag('h2')} />
                  <ToolbarButton icon={FileText} label="H3 Alt Başlık" onClick={() => insertTag('h3')} />
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <ToolbarButton icon={Bold} label="Kalın" onClick={() => insertTag('strong')} />
                  <ToolbarButton icon={Italic} label="İtalik" onClick={() => insertTag('em')} />
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <ToolbarButton icon={List} label="Liste" onClick={() => insertTag('ul')} />
                  <ToolbarButton icon={LinkIcon} label="Link" onClick={() => insertTag('a')} />
                </div>

                <textarea
                  id="content-editor"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="<h2>Başlık</h2>\n<p>İçerik buraya...</p>"
                  className="w-full min-h-[400px] px-4 py-3 border-x border-b rounded-b-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Yayın Ayarları
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published" className="cursor-pointer">Yayında</Label>
                  <p className="text-xs text-muted-foreground">Sayfayı herkese açık yap</p>
                </div>
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
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
          </div>
        </div>
      )}
    </div>
  );
}
