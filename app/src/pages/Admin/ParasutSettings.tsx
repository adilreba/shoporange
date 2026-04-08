import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Building2,
  Key,
  User,
  Lock,
  TestTube,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { parasutApi, type ParasutConfig, type ParasutStatus } from '@/services/parasutApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ParasutSettings() {
  const [config, setConfig] = useState<ParasutConfig>({
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    companyId: '',
    isTestMode: true,
  });
  const [status, setStatus] = useState<ParasutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [configData, statusData] = await Promise.all([
        parasutApi.getConfig(),
        parasutApi.getStatus(),
      ]);
      setConfig(configData);
      setStatus(statusData);
    } catch (error) {
      console.error('Config load error:', error);
      toast.error('Yapılandırma yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validasyon
    if (!config.clientId || !config.clientSecret || !config.username || !config.password) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    try {
      setSaving(true);
      const result = await parasutApi.saveConfig(config);
      toast.success(result.message);
      await loadConfig();
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await parasutApi.testConnection();
      
      if (result.success) {
        toast.success(`Bağlantı başarılı! ${result.companyName}`);
      } else {
        toast.error(`Bağlantı hatası: ${result.message}`);
      }
    } catch (error) {
      toast.error('Bağlantı testi başarısız');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Paraşüt e-Fatura Entegrasyonu
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  e-Fatura ve e-Arşiv otomasyon ayarları
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowOnboarding(true)}>
              <Info className="w-4 h-4 mr-2" />
              Nasıl Başlarım?
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  status?.connected 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {status?.connected ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {status?.connected ? 'Bağlı' : 'Bağlı Değil'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {status?.companyName || 'Henüz yapılandırılmamış'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={status?.connected ? 'default' : 'destructive'}>
                  {status?.connected ? 'Aktif' : 'Pasif'}
                </Badge>
                {status?.lastSync && (
                  <p className="text-xs text-gray-400 mt-1">
                    Son senkronizasyon: {new Date(status.lastSync).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Alert */}
        {!status?.connected && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">e-Fatura Entegrasyonu Eksik</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Yasal olarak her satış için fatura düzenlemeniz gerekiyor. 
              Paraşüt entegrasyonu tamamlanmadan satışa başlamamanız önerilir.
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Yapılandırması
            </CardTitle>
            <CardDescription>
              Paraşüt uygulama bilgilerinizi girin. Bu bilgileri{' '}
              <a 
                href="https://apidocs.parasut.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                Paraşüt API sayfasından
              </a>{' '}
              alabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Mode Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label htmlFor="test-mode" className="font-medium">
                  Test Modu
                </Label>
                <p className="text-sm text-gray-500">
                  Test modunda faturalar gerçekten gönderilmez
                </p>
              </div>
              <Switch
                id="test-mode"
                checked={config.isTestMode}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, isTestMode: checked }))
                }
              />
            </div>

            <Separator />

            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="client-id">
                <Building2 className="w-4 h-4 inline mr-1" />
                Client ID (Uygulama ID)
              </Label>
              <Input
                id="client-id"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Örn: 1234567890abcdef"
              />
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="client-secret">
                <Lock className="w-4 h-4 inline mr-1" />
                Client Secret (Uygulama Gizli Anahtarı)
              </Label>
              <div className="relative">
                <Input
                  id="client-secret"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.clientSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  placeholder="Örn: abcdef1234567890..."
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Separator />

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                <User className="w-4 h-4 inline mr-1" />
                Kullanıcı Adı (E-posta)
              </Label>
              <Input
                id="username"
                type="email"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="ornek@firma.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="w-4 h-4 inline mr-1" />
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Paraşüt hesap şifreniz"
                />
              </div>
            </div>

            {/* Company ID */}
            <div className="space-y-2">
              <Label htmlFor="company-id">
                <Building2 className="w-4 h-4 inline mr-1" />
                Şirket ID (İsteğe Bağlı)
              </Label>
              <Input
                id="company-id"
                value={config.companyId}
                onChange={(e) => setConfig(prev => ({ ...prev, companyId: e.target.value }))}
                placeholder="Boş bırakırsanız otomatik algılanır"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Kaydet
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !config.clientId}
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Bağlantı Testi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">e-Fatura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Vergi kimlik numarası olan şirketlere gönderilir. 
                GİB üzerinden alıcıya iletilir.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">e-Arşiv</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Bireysel müşterilere veya e-fatura mükellefi olmayan 
                şirketlere gönderilir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paraşüt Entegrasyonu - Adım Adım Rehber</DialogTitle>
            <DialogDescription>
              e-Fatura entegrasyonunu tamamlamak için izlemeniz gereken adımlar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium">Paraşüt Hesabı Oluşturun</h4>
                <p className="text-sm text-gray-500 mt-1">
                  <a href="https://www.parasut.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                    parasut.com
                  </a>{' '}
                  üzerinden ücretsiz hesap oluşturun. e-Fatura modülünü aktifleştirin.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium">API Erişimi Talep Edin</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Paraşüt destek ekibiyle iletişime geçip API erişimi talep edin. 
                  Size Client ID ve Client Secret verilecek.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium">Bilgileri Girin ve Test Edin</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Yukarıdaki formu doldurun ve "Bağlantı Testi" butonuna tıklayın. 
                  Test modunda deneme yapabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium">Canlıya Geçin</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Testleri tamamladıktan sonra "Test Modu"nu kapatın. 
                  Artık tüm faturalar otomatik olarak GİB'e gönderilecek.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Not:</strong> e-Fatura gönderimi için şirketinizin GİB'e kayıtlı olması gerekir. 
              Paraşüt bu kayıt işlemlerinde size yardımcı olacaktır.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
