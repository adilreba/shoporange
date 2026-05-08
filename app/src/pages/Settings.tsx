import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  CreditCard,
  MapPin,
  Lock,
  Smartphone,
  Mail,
  Save,
  Chrome,
  Apple,
  Link2,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { toast } from 'sonner';

export function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated, user, changePassword, setPassword, unlinkSocial } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    orderUpdates: true,
    twoFactorAuth: false,
    language: 'tr',
    currency: 'TRY'
  });

  const handleSave = () => {
    toast.success('Ayarlarınız kaydedildi!');
  };

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor!');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır!');
      return;
    }
    
    // Social login users without password
    if (user?.auth_provider === 'google' || user?.auth_provider === 'facebook' || user?.auth_provider === 'apple') {
      const success = await setPassword(passwordForm.newPassword);
      if (success) {
        toast.success('Şifreniz belirlendi! Artık email ve şifre ile de giriş yapabilirsiniz.');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
      return;
    }
    
    // Normal users with existing password
    const success = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    if (success) {
      toast.success('Şifreniz başarıyla güncellendi!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleUnlinkSocial = async (provider: 'google' | 'facebook' | 'apple') => {
    const success = await unlinkSocial(provider);
    if (success) {
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} hesabınızın bağlantısı kaldırıldı.`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <div className="container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Giriş Yapın</h1>
            <p className="text-muted-foreground mb-6">Ayarlarınıza erişmek için giriş yapmanız gerekiyor.</p>
            <Button className="gradient-orange" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container-custom pt-20 md:pt-24 pb-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-medium">{user?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </Link>
                  <hr className="my-2" />
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <User className="w-5 h-5" />
                    Profilim
                  </Link>
                  <Link to="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <CreditCard className="w-5 h-5" />
                    Siparişlerim
                  </Link>
                  <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <Bell className="w-5 h-5" />
                    Favorilerim
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium">
                    <Shield className="w-5 h-5" />
                    Ayarlar
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Ayarlar</CardTitle>
                <CardDescription>Hesap ayarlarınızı yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-5 mb-6">
                    <TabsTrigger value="general">Genel</TabsTrigger>
                    <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
                    <TabsTrigger value="security">Güvenlik</TabsTrigger>
                    <TabsTrigger value="connected">Hesaplar</TabsTrigger>
                    <TabsTrigger value="payment">Ödeme</TabsTrigger>
                  </TabsList>

                  {/* General Settings */}
                  <TabsContent value="general" className="space-y-6">
                    {/* Theme */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Moon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Karanlık Mod</p>
                          <p className="text-sm text-muted-foreground">Gece görünümünü etkinleştir</p>
                        </div>
                      </div>
                      <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Dil</p>
                          <p className="text-sm text-muted-foreground">Uygulama dilini seçin</p>
                        </div>
                      </div>
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings({...settings, language: e.target.value})}
                        className="border rounded-lg px-3 py-2 bg-background text-foreground dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Para Birimi</p>
                          <p className="text-sm text-muted-foreground">Fiyat gösterim birimi</p>
                        </div>
                      </div>
                      <select 
                        value={settings.currency}
                        onChange={(e) => setSettings({...settings, currency: e.target.value})}
                        className="border rounded-lg px-3 py-2 bg-background text-foreground dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      >
                        <option value="TRY">TL (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </TabsContent>

                  {/* Notifications */}
                  <TabsContent value="notifications" className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">E-posta Bildirimleri</p>
                          <p className="text-sm text-muted-foreground">Önemli güncellemeleri e-posta ile al</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.emailNotifications}
                        onCheckedChange={(v) => setSettings({...settings, emailNotifications: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">SMS Bildirimleri</p>
                          <p className="text-sm text-muted-foreground">Sipariş güncellemelerini SMS ile al</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.smsNotifications}
                        onCheckedChange={(v) => setSettings({...settings, smsNotifications: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pazarlama E-postaları</p>
                          <p className="text-sm text-muted-foreground">Kampanya ve indirimleri kaçırma</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.marketingEmails}
                        onCheckedChange={(v) => setSettings({...settings, marketingEmails: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Sipariş Güncellemeleri</p>
                          <p className="text-sm text-muted-foreground">Sipariş durumu değişikliklerini bildir</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.orderUpdates}
                        onCheckedChange={(v) => setSettings({...settings, orderUpdates: v})}
                      />
                    </div>
                  </TabsContent>

                  {/* Security */}
                  <TabsContent value="security" className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">İki Faktörlü Doğrulama</p>
                          <p className="text-sm text-muted-foreground">Hesabınızı ekstra güvenlikle koruyun</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(v) => setSettings({...settings, twoFactorAuth: v})}
                      />
                    </div>

                    <Separator />

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Şifre Değiştir</p>
                          <p className="text-sm text-muted-foreground">Hesap şifrenizi güncelleyin</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(user?.auth_provider !== 'google' && user?.auth_provider !== 'facebook' && user?.auth_provider !== 'apple') && (
                          <Input 
                            type="password" 
                            placeholder="Mevcut Şifre" 
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                          />
                        )}
                        <Input 
                          type="password" 
                          placeholder="Yeni Şifre" 
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        />
                        <Input 
                          type="password" 
                          placeholder="Yeni Şifre (Tekrar)" 
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        />
                        <Button onClick={handlePasswordChange} className="w-full gradient-orange">
                          {user?.auth_provider === 'google' || user?.auth_provider === 'facebook' || user?.auth_provider === 'apple' 
                            ? 'Şifre Belirle' 
                            : 'Şifreyi Güncelle'}
                        </Button>
                        {(user?.auth_provider === 'google' || user?.auth_provider === 'facebook' || user?.auth_provider === 'apple') && (
                          <p className="text-xs text-muted-foreground">
                            Sosyal giriş kullanıcısı olarak şifre belirleyebilirsiniz. Böylece email/şifre ile de giriş yapabilirsiniz.
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-red-700">Hesabı Sil</p>
                          <p className="text-sm text-red-500">Bu işlem geri alınamaz</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => toast.error('Hesap silme özelliği yakında!')}
                      >
                        Hesabımı Sil
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Connected Accounts */}
                  <TabsContent value="connected" className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">Bağlı Sosyal Hesaplar</p>
                          <p className="text-sm text-muted-foreground">Hesabınıza bağlı sosyal medya girişlerini yönetin</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {/* Google */}
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <Chrome className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">Google</p>
                              <p className="text-sm text-muted-foreground">
                                {user?.google_sub ? 'Bağlı' : 'Bağlı değil'}
                              </p>
                            </div>
                          </div>
                          {user?.google_sub ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnlinkSocial('google')}
                            >
                              <Unlink className="w-4 h-4 mr-1" />
                              Bağlantıyı Kaldır
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Yakında</Badge>
                          )}
                        </div>

                        {/* Facebook */}
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium">Facebook</p>
                              <p className="text-sm text-muted-foreground">
                                {user?.facebook_id ? 'Bağlı' : 'Bağlı değil'}
                              </p>
                            </div>
                          </div>
                          {user?.facebook_id ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnlinkSocial('facebook')}
                            >
                              <Unlink className="w-4 h-4 mr-1" />
                              Bağlantıyı Kaldır
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Yakında</Badge>
                          )}
                        </div>

                        {/* Apple */}
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Apple className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <p className="font-medium">Apple</p>
                              <p className="text-sm text-muted-foreground">
                                {user?.apple_id ? 'Bağlı' : 'Bağlı değil'}
                              </p>
                            </div>
                          </div>
                          {user?.apple_id ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnlinkSocial('apple')}
                            >
                              <Unlink className="w-4 h-4 mr-1" />
                              Bağlantıyı Kaldır
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Yakında</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-700">Hesap Bağlama Bilgisi</p>
                          <p className="text-sm text-blue-500 mt-1">
                            Birden fazla sosyal hesabı bağlayarak giriş seçeneklerinizi artırabilirsiniz. 
                            Aynı email adresiyle kayıtlı hesaplar otomatik olarak birleştirilir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Payment */}
                  <TabsContent value="payment" className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Kayıtlı Kartlarım</p>
                          <p className="text-sm text-muted-foreground">Ödeme yöntemlerinizi yönetin</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                              Visa
                            </div>
                            <div>
                              <p className="font-medium">**** **** **** 4242</p>
                              <p className="text-sm text-muted-foreground">Son kullanma: 12/25</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Varsayılan</Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => toast.info('Kart ekleme özelliği yakında!')}
                        >
                          + Yeni Kart Ekle
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Fatura Adresleri</p>
                          <p className="text-sm text-muted-foreground">Fatura adreslerinizi yönetin</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/profile')}
                      >
                        Adresleri Yönet
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gradient-orange">
                    <Save className="w-4 h-4 mr-2" />
                    Değişiklikleri Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
