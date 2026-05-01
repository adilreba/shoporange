/**
 * Admin — Müşteri Yolculuğu Otomasyonu
 * =====================================
 * Email/SMS otomasyonlarını yönetin:
 * - Şablonları görüntüleyin ve önizleyin
 * - Manuel tetikleme yapın
 * - Gönderim loglarını izleyin
 */

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Smartphone,
  Zap,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { automationApi, type EmailTemplate, type AutomationLog } from '@/services/automationApi';
import { toast } from 'sonner';
import { isMockMode } from '@/services/api';

// Mock templates for development
const MOCK_TEMPLATES: EmailTemplate[] = [
  { id: 'welcome', name: 'Hoş Geldin', description: 'Yeni kayıt olan kullanıcıya', subject: '{{name}}, AtusHome\'a Hoş Geldiniz!', category: 'automation', variables: ['name', 'email'] },
  { id: 'welcome_series_2', name: 'Hoş Geldin #2', description: 'Kayıttan 1 gün sonra', subject: 'Sizin İçin Seçtiklerimiz', category: 'automation', variables: ['name', 'products'] },
  { id: 'welcome_series_3', name: 'Hoş Geldin #3', description: 'Kayıttan 3 gün sonra', subject: 'Size Özel İlk Alışveriş İndirimi!', category: 'automation', variables: ['name', 'couponCode'] },
  { id: 'cart_abandonment_1', name: 'Sepet Terk #1', description: '1 saat sonra hatırlatma', subject: 'Sepetiniz Sizi Bekliyor', category: 'automation', variables: ['name', 'items', 'cartTotal'] },
  { id: 'cart_abandonment_2', name: 'Sepet Terk #2', description: '24 saat sonra indirim', subject: 'Sepetinize %5 İndirim Kodu!', category: 'automation', variables: ['name', 'items', 'couponCode'] },
  { id: 'cart_abandonment_3', name: 'Sepet Terk #3', description: '72 saat sonra son hatırlatma', subject: 'Son Şans: Sepetinizdeki Ürünler', category: 'automation', variables: ['name', 'items'] },
  { id: 'order_confirmation', name: 'Sipariş Onayı', description: 'Sipariş alındığında', subject: 'Siparişiniz Alındı', category: 'transactional', variables: ['name', 'orderNumber', 'total'] },
  { id: 'order_shipped', name: 'Kargoya Verildi', description: 'Sipariş kargoya verildiğinde', subject: 'Siparişiniz Yolda!', category: 'transactional', variables: ['name', 'orderNumber', 'trackingNumber'] },
  { id: 'order_delivered', name: 'Teslim Edildi', description: 'Sipariş teslim edildiğinde', subject: 'Siparişiniz Teslim Edildi', category: 'transactional', variables: ['name', 'orderNumber'] },
  { id: 'review_request', name: 'Yorum İsteği', description: 'Teslimattan 7 gün sonra', subject: 'Siparişiniz Nasıldı?', category: 'automation', variables: ['name', 'orderNumber', 'products'] },
  { id: 'birthday', name: 'Doğum Günü', description: 'Doğum günü indirimi', subject: 'İyi Ki Doğdunuz!', category: 'automation', variables: ['name', 'couponCode'] },
  { id: 'win_back', name: 'Geri Kazanım', description: '60 gün aktif olmayan', subject: 'Sizi Özledik!', category: 'automation', variables: ['name', 'couponCode'] },
  { id: 'stock_alert', name: 'Stok Alarmı', description: 'Stoka girdiğinde', subject: 'İstediğiniz Ürün Stokta!', category: 'automation', variables: ['name', 'productName', 'price'] },
  { id: 'price_drop', name: 'Fiyat Düşüşü', description: 'Favori ürün fiyatı düştüğünde', subject: 'Fiyat Düştü!', category: 'automation', variables: ['name', 'productName', 'oldPrice', 'newPrice'] },
  { id: 'vip_special', name: 'VIP Özel', description: 'VIP müşteriye özel', subject: 'VIP Ayrıcalıklarınız', category: 'marketing', variables: ['name', 'couponCode'] },
  { id: 'first_purchase_thank_you', name: 'İlk Sipariş Teşekkür', description: 'İlk sipariş sonrası', subject: 'Teşekkürler!', category: 'automation', variables: ['name', 'orderNumber'] },
  { id: 'password_reset', name: 'Şifre Sıfırlama', description: 'Şifre sıfırlama', subject: 'Şifre Sıfırlama', category: 'transactional', variables: ['name', 'resetUrl'] },
];

const MOCK_LOGS: AutomationLog[] = [
  { logId: 'auto-123', userId: 'user-1', email: 'demo@example.com', templateId: 'welcome', triggerType: 'immediate', status: 'sent', channel: 'email', timestamp: new Date().toISOString() },
  { logId: 'auto-124', userId: 'user-2', email: 'test@example.com', templateId: 'cart_abandonment_1', triggerType: 'immediate', status: 'sent', channel: 'email', timestamp: new Date(Date.now() - 3600000).toISOString() },
];

const categoryColors: Record<string, string> = {
  transactional: 'bg-blue-500',
  marketing: 'bg-purple-500',
  automation: 'bg-orange-500',
};

const categoryLabels: Record<string, string> = {
  transactional: 'İşlem',
  marketing: 'Pazarlama',
  automation: 'Otomasyon',
};

const statusIcons = {
  sent: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-amber-500" />,
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Trigger dialog
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerTemplate, setTriggerTemplate] = useState<EmailTemplate | null>(null);
  const [triggerData, setTriggerData] = useState<Record<string, string>>({});
  const [triggerEmail, setTriggerEmail] = useState('');
  const [triggerLoading, setTriggerLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadLogs();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (isMockMode()) {
        setTemplates(MOCK_TEMPLATES);
        return;
      }
      const result = await automationApi.getTemplates();
      setTemplates(result.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates(MOCK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      if (isMockMode()) {
        setLogs(MOCK_LOGS);
        return;
      }
      const result = await automationApi.getLogs();
      setLogs(result.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs(MOCK_LOGS);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
    setPreviewLoading(true);

    // Default sample data
    const sampleData: Record<string, any> = {
      name: 'Ali Veli',
      email: 'ali@example.com',
      orderNumber: 'ORD-12345',
      orderId: 'ORD-12345',
      total: 1250.00,
      cartTotal: 450.00,
      couponCode: 'INDIRIM5',
      productName: 'iPhone 15 Pro',
      price: 54999.00,
      oldPrice: 59999.00,
      newPrice: 54999.00,
      trackingNumber: 'YT123456789',
      shippingAddress: 'Kadıköy, İstanbul',
      items: [
        { name: 'iPhone 15 Pro', price: 54999, quantity: 1, productId: '1', image: 'https://via.placeholder.com/80' },
      ],
    };

    try {
      if (!isMockMode()) {
        const result = await automationApi.previewTemplate({
          templateId: template.id,
          templateData: sampleData,
        });
        setPreviewHtml(result.html);
      } else {
        setPreviewHtml('<p>Mock mode: Önizleme mevcut değil</p>');
      }
    } catch (error) {
      toast.error('Önizleme yüklenemedi');
      setPreviewHtml('<p>Önizleme yüklenemedi</p>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTrigger = async () => {
    if (!triggerTemplate || !triggerEmail) return;

    setTriggerLoading(true);
    try {
      if (!isMockMode()) {
        await automationApi.trigger({
          userId: 'manual-' + Date.now(),
          email: triggerEmail,
          templateId: triggerTemplate.id,
          templateData: triggerData,
          channel: 'email',
        });
      }
      toast.success('Email gönderildi!');
      setTriggerOpen(false);
      loadLogs();
    } catch (error) {
      toast.error('Gönderim başarısız');
    } finally {
      setTriggerLoading(false);
    }
  };

  const openTrigger = (template: EmailTemplate) => {
    setTriggerTemplate(template);
    setTriggerData({});
    setTriggerEmail('');
    setTriggerOpen(true);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-orange-500" />
          Müşteri Yolculuğu Otomasyonu
        </h1>
        <p className="text-muted-foreground mt-1">
          Email/SMS otomasyonlarını yönetin, şablonları önizleyin ve manuel gönderim yapın.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground">Şablon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'sent').length}</p>
                <p className="text-xs text-muted-foreground">Gönderilen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.filter(t => t.category === 'automation').length}</p>
                <p className="text-xs text-muted-foreground">Otomasyon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Toplam Log</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Şablonlar
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Gönderim Logları
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Şablon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="transactional">İşlem</SelectItem>
                <SelectItem value="marketing">Pazarlama</SelectItem>
                <SelectItem value="automation">Otomasyon</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadTemplates} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <Badge className={`${categoryColors[template.category]} text-white text-xs`}>
                          {categoryLabels[template.category]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{template.id}</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        Konu: <span className="italic">{template.subject}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables.map((v) => (
                          <span key={v} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        Önizle
                      </Button>
                      <Button size="sm" onClick={() => openTrigger(template)}>
                        <Send className="h-4 w-4 mr-1.5" />
                        Gönder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Gönderim Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz gönderim logu bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.logId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {statusIcons[log.status]}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.templateId} • {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <Badge variant={log.channel === 'email' ? 'default' : 'secondary'} className="text-xs">
                        {log.channel === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <Smartphone className="h-3 w-3 mr-1" />}
                        {log.channel}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {previewTemplate?.name} — Önizleme
            </DialogTitle>
            <DialogDescription>
              Konu: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full min-h-[400px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trigger Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Manuel Gönderim
            </DialogTitle>
            <DialogDescription>
              {triggerTemplate?.name} şablonunu test amaçlı gönderin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Alıcı Email</label>
              <Input
                type="email"
                placeholder="ornek@email.com"
                value={triggerEmail}
                onChange={(e) => setTriggerEmail(e.target.value)}
              />
            </div>
            {triggerTemplate?.variables.map((variable) => (
              <div key={variable}>
                <label className="text-sm font-medium capitalize">{variable}</label>
                <Input
                  placeholder={`${variable} değeri`}
                  value={triggerData[variable] || ''}
                  onChange={(e) => setTriggerData(prev => ({ ...prev, [variable]: e.target.value }))}
                />
              </div>
            ))}
            <Button 
              className="w-full" 
              onClick={handleTrigger} 
              disabled={triggerLoading || !triggerEmail}
            >
              {triggerLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
