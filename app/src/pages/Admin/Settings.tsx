import { useState } from 'react';
import { 
  Save, 
  Store, 
  Truck, 
  CreditCard, 
  Shield, 
  Building2,
  MapPin,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settingsStore';

export default function AdminSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      updateSettings(settings);
      setLoading(false);
      toast.success('Tüm ayarlar kaydedildi');
    }, 800);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı`);
  };

  const updateField = (field: string, value: string | number) => {
    updateSettings({ [field]: value });
  };

  const isFieldEmpty = (value?: string) => !value || value.trim() === '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
          <p className="text-sm text-gray-500 mt-1">Mağaza ve şirket ayarlarınızı buradan yönetin</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Şirket</span>
          </TabsTrigger>
          <TabsTrigger value="address" className="gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Adres</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Kargo</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Ödeme</span>
          </TabsTrigger>
        </TabsList>

        {/* Genel Ayarlar */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Mağaza Bilgileri
              </CardTitle>
              <CardDescription>Mağaza adı ve temel iletişim bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mağaza Adı <span className="text-red-500">*</span></label>
                  <Input 
                    value={settings.storeName}
                    onChange={(e) => updateField('storeName', e.target.value)}
                    placeholder="AtusHome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta Adresi <span className="text-red-500">*</span></label>
                  <Input 
                    type="email"
                    value={settings.storeEmail}
                    onChange={(e) => updateField('storeEmail', e.target.value)}
                    placeholder="info@atushome.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Müşteri Hizmetleri Telefonu</label>
                  <Input 
                    value={settings.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="0850 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cep Telefonu</label>
                  <Input 
                    value={settings.mobilePhone || ''}
                    onChange={(e) => updateField('mobilePhone', e.target.value)}
                    placeholder="0532 123 45 67"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Şirket Bilgileri - ETBİS */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Şirket Bilgileri
                  </CardTitle>
                  <CardDescription>ETBİS ve resmi kayıt bilgileri</CardDescription>
                </div>
                <Badge variant={isFieldEmpty(settings.etbisNo) ? "destructive" : "default"} className="gap-1">
                  {isFieldEmpty(settings.etbisNo) ? (
                    <><AlertCircle className="w-3 h-3" /> ETBİS No Eksik</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3" /> ETBİS Kayıtlı</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Şirket Unvanı <span className="text-red-500">*</span></label>
                  <Input 
                    value={settings.companyTitle}
                    onChange={(e) => updateField('companyTitle', e.target.value)}
                    placeholder="AtusHome E-Ticaret Ltd. Şti."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ticaret Sicil No</label>
                  <div className="flex gap-2">
                    <Input 
                      value={settings.tradeRegistryNo}
                      onChange={(e) => updateField('tradeRegistryNo', e.target.value)}
                      placeholder="123456"
                      className="flex-1"
                    />
                    {settings.tradeRegistryNo && (
                      <Button variant="outline" size="icon" onClick={() => handleCopy(settings.tradeRegistryNo, 'Ticaret Sicil No')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">MERSİS No</label>
                  <div className="flex gap-2">
                    <Input 
                      value={settings.mersisNo}
                      onChange={(e) => updateField('mersisNo', e.target.value)}
                      placeholder="0123456789012345"
                      className="flex-1"
                    />
                    {settings.mersisNo && (
                      <Button variant="outline" size="icon" onClick={() => handleCopy(settings.mersisNo, 'MERSİS No')}>
                        <Copy className="h-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ETBİS Kayıt No</label>
                  <div className="flex gap-2">
                    <Input 
                      value={settings.etbisNo}
                      onChange={(e) => updateField('etbisNo', e.target.value)}
                      placeholder="ETB-2024-XXXXXXX"
                      className="flex-1"
                    />
                    {settings.etbisNo && (
                      <Button variant="outline" size="icon" onClick={() => handleCopy(settings.etbisNo, 'ETBİS No')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">eticaret.gov.tr üzerinden alınan kayıt numarası</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vergi No</label>
                  <Input 
                    value={settings.taxNo}
                    onChange={(e) => updateField('taxNo', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vergi Dairesi</label>
                  <Input 
                    value={settings.taxOffice}
                    onChange={(e) => updateField('taxOffice', e.target.value)}
                    placeholder="Kadıköy V.D."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adres Bilgileri */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Merkez Adres
              </CardTitle>
              <CardDescription>Resmi merkez adresi (ETBİS ve fatura için)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Açık Adres <span className="text-red-500">*</span></label>
                <textarea
                  value={settings.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Caferağa Mah. Moda Cad. No:123 D:5"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">İlçe</label>
                  <Input 
                    value={settings.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="Kadıköy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Şehir</label>
                  <Input 
                    value={settings.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="İstanbul"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Posta Kodu</label>
                  <Input 
                    value={settings.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="34710"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ülke</label>
                  <Input 
                    value={settings.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="Türkiye"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="text-sm font-medium mb-2 block">Tam Adres Önizleme</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.address}, {settings.district}, {settings.city} {settings.postalCode}, {settings.country}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kargo Ayarları */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Kargo Ayarları
              </CardTitle>
              <CardDescription>Kargo ücretleri ve teslimat ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ücretsiz Kargo Limiti (₺)</label>
                  <Input 
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => updateField('freeShippingThreshold', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Standart Kargo Ücreti (₺)</label>
                  <Input 
                    type="number"
                    value={settings.defaultShippingCost}
                    onChange={(e) => updateField('defaultShippingCost', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Express Kargo Ücreti (₺)</label>
                  <Input 
                    type="number"
                    value={settings.expressShippingCost}
                    onChange={(e) => updateField('expressShippingCost', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tahmini Teslimat (Gün)</label>
                  <Input 
                    type="number"
                    value={settings.estimatedDeliveryDays}
                    onChange={(e) => updateField('estimatedDeliveryDays', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ödeme Ayarları */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Ödeme Yöntemleri
              </CardTitle>
              <CardDescription>Aktif ödeme yöntemlerini yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kredi Kartı</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">Aktif</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Havale/EFT</p>
                    <p className="text-sm text-gray-500">Banka transferi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">Aktif</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
