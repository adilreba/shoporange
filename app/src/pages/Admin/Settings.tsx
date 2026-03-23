import { useState } from 'react';
import { Save, Store, Truck, CreditCard, Bell, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [general, setGeneral] = useState({
    storeName: 'AtusHome',
    storeEmail: 'info@atushome.com',
    phone: '+90 212 123 45 67',
    address: 'İstanbul, Türkiye',
    currency: 'TRY',
    language: 'tr'
  });

  const [shipping, setShipping] = useState({
    freeShippingThreshold: 500,
    defaultShippingCost: 50,
    expressShippingCost: 100,
    estimatedDeliveryDays: 3
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newUser: false,
    newsletter: true,
    orderStatus: true
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Ayarlar kaydedildi');
    }, 1000);
  };

  // Switch component
  const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-1">Mağaza ayarlarınızı buradan yönetin</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Kargo</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Ödeme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Bildirimler</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Mağaza Bilgileri
              </CardTitle>
              <CardDescription>Mağaza adı, iletişim bilgileri ve temel ayarlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mağaza Adı</label>
                  <Input 
                    value={general.storeName} 
                    onChange={(e) => setGeneral({...general, storeName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input 
                    type="email"
                    value={general.storeEmail} 
                    onChange={(e) => setGeneral({...general, storeEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input 
                    value={general.phone} 
                    onChange={(e) => setGeneral({...general, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adres</label>
                  <Input 
                    value={general.address} 
                    onChange={(e) => setGeneral({...general, address: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Güvenlik
              </CardTitle>
              <CardDescription>Güvenlik ayarları ve şifre değiştirme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mevcut Şifre</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Yeni Şifre</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                    value={shipping.freeShippingThreshold}
                    onChange={(e) => setShipping({...shipping, freeShippingThreshold: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Standart Kargo Ücreti (₺)</label>
                  <Input 
                    type="number" 
                    value={shipping.defaultShippingCost}
                    onChange={(e) => setShipping({...shipping, defaultShippingCost: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Express Kargo Ücreti (₺)</label>
                  <Input 
                    type="number" 
                    value={shipping.expressShippingCost}
                    onChange={(e) => setShipping({...shipping, expressShippingCost: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tahmini Teslimat (Gün)</label>
                  <Input 
                    type="number" 
                    value={shipping.estimatedDeliveryDays}
                    onChange={(e) => setShipping({...shipping, estimatedDeliveryDays: Number(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Havale/EFT</p>
                    <p className="text-sm text-gray-500">Banka transferi</p>
                  </div>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-green-600">C</span>
                  </div>
                  <div>
                    <p className="font-medium">Kapıda Ödeme</p>
                    <p className="text-sm text-gray-500">Nakit veya kart</p>
                  </div>
                </div>
                <Switch checked={false} onCheckedChange={() => {}} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Bildirim Ayarları
              </CardTitle>
              <CardDescription>Hangi durumlarda bildirim almak istediğinizi seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Yeni Sipariş</p>
                  <p className="text-sm text-gray-500">Yeni bir sipariş geldiğinde bildirim al</p>
                </div>
                <Switch 
                  checked={notifications.newOrder}
                  onCheckedChange={(checked) => setNotifications({...notifications, newOrder: checked})}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Düşük Stok</p>
                  <p className="text-sm text-gray-500">Ürün stoğu azaldığında bildirim al</p>
                </div>
                <Switch 
                  checked={notifications.lowStock}
                  onCheckedChange={(checked) => setNotifications({...notifications, lowStock: checked})}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Yeni Kullanıcı</p>
                  <p className="text-sm text-gray-500">Yeni kayıt olan kullanıcılar hakkında bildirim al</p>
                </div>
                <Switch 
                  checked={notifications.newUser}
                  onCheckedChange={(checked) => setNotifications({...notifications, newUser: checked})}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Sipariş Durumu</p>
                  <p className="text-sm text-gray-500">Sipariş durumu değiştiğinde bildirim al</p>
                </div>
                <Switch 
                  checked={notifications.orderStatus}
                  onCheckedChange={(checked) => setNotifications({...notifications, orderStatus: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </div>
  );
}
