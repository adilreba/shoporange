import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Settings, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2,
  Check,
  Truck,

  Camera,
  Mail,
  Phone,
  Calendar,
  Star,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { adminMockOrders } from '@/data/mockData';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });

  const [newAddress, setNewAddress] = useState({
    title: '',
    fullName: '',
    phone: '',
    city: '',
    district: '',
    neighborhood: '',
    addressLine: '',
    zipCode: ''
  });

  const [addresses, setAddresses] = useState(user?.address || []);

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <main className="container-custom pt-[42px] pb-12 sm:pt-[42px] sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Giriş Yapın</h1>
            <p className="text-muted-foreground mb-6">Profilinizi görüntülemek için giriş yapın.</p>
            <Button className="gradient-orange" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // User's orders
  const userOrders = adminMockOrders.filter(order => 
    order.email === user.email || order.customer === user.name
  );

  const handleSaveProfile = () => {
    updateUser({
      name: profileData.name,
      phone: profileData.phone
    });
    setIsEditing(false);
    toast.success('Profil bilgileriniz güncellendi!');
  };

  const handleAddAddress = () => {
    const address = {
      ...newAddress,
      id: `addr_${Date.now()}`,
      isDefault: addresses.length === 0
    };
    setAddresses([...addresses, address]);
    setNewAddress({
      title: '',
      fullName: '',
      phone: '',
      city: '',
      district: '',
      neighborhood: '',
      addressLine: '',
      zipCode: ''
    });
    setIsAddressDialogOpen(false);
    toast.success('Adres başarıyla eklendi!');
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
    toast.success('Adres silindi');
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    toast.success('Varsayılan adres güncellendi');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Çıkış yapıldı');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'shipped': 'bg-purple-100 text-purple-700 border-purple-200',
      'pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    const labels: Record<string, string> = {
      'completed': 'Tamamlandı',
      'processing': 'Hazırlanıyor',
      'shipped': 'Kargoda',
      'pending': 'Beklemede',
      'cancelled': 'İptal Edildi'
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72">
            {/* User Card */}
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="gradient-orange text-white text-2xl">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'admin' ? 'Admin' : 'Üye'}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      Aktif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === 'profile' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profil Bilgileri</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === 'orders' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="font-medium">Siparişlerim</span>
                    {userOrders.length > 0 && (
                      <Badge className="ml-auto bg-orange-500">{userOrders.length}</Badge>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === 'addresses' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Adreslerim</span>
                    <Badge className="ml-auto bg-muted text-foreground">{addresses.length}</Badge>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === 'wishlist' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Favorilerim</span>
                    {wishlistItems.length > 0 && (
                      <Badge className="ml-auto bg-red-500">{wishlistItems.length}</Badge>
                    )}
                  </button>
                  
                  <Separator className="my-2" />
                  
                  <Link
                    to="/settings"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Ayarlar</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Çıkış Yap</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Profil Bilgileri</CardTitle>
                    <p className="text-muted-foreground mt-1">Kişisel bilgilerinizi görüntüleyin ve düzenleyin</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditing ? 'İptal' : 'Düzenle'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ad Soyad</Label>
                          <Input 
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-posta</Label>
                          <Input 
                            value={profileData.email}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefon</Label>
                          <Input 
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="05XX XXX XX XX"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          İptal
                        </Button>
                        <Button className="gradient-orange" onClick={handleSaveProfile}>
                          <Check className="w-4 h-4 mr-2" />
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <User className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ad Soyad</p>
                            <p className="font-medium">{user.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">E-posta</p>
                            <p className="font-medium">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Phone className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Telefon</p>
                            <p className="font-medium">{user.phone || 'Belirtilmemiş'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Üyelik Tarihi</p>
                            <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '15 Ocak 2024'}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <ShoppingBag className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{userOrders.length}</p>
                          <p className="text-sm text-muted-foreground">Sipariş</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{wishlistItems.length}</p>
                          <p className="text-sm text-muted-foreground">Favori</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{addresses.length}</p>
                          <p className="text-sm text-muted-foreground">Adres</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Star className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Yorum</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Siparişlerim</CardTitle>
                  <p className="text-muted-foreground mt-1">Tüm siparişlerinizi buradan takip edebilirsiniz</p>
                </CardHeader>
                <CardContent>
                  {userOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Henüz siparişiniz yok</h3>
                      <p className="text-muted-foreground mb-4">İlk siparişinizi vermek için alışverişe başlayın</p>
                      <Button className="gradient-orange" onClick={() => navigate('/products')}>
                        Alışverişe Başla
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-semibold">{order.id}</p>
                                <p className="text-sm text-muted-foreground">{order.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(order.status)}
                              <p className="font-bold text-lg">₺{order.total.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="bg-muted rounded-lg p-3 mb-4">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                  <span className="text-sm">{item.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {order.shippingAddress?.city}, {order.shippingAddress?.district}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/track-order?order=${order.id}`)}
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Takip Et
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Adreslerim</CardTitle>
                    <p className="text-muted-foreground mt-1">Teslimat adreslerinizi yönetin</p>
                  </div>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-orange">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Adres
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Yeni Adres Ekle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Adres Başlığı</Label>
                            <Input 
                              placeholder="Ev, İş yeri..."
                              value={newAddress.title}
                              onChange={(e) => setNewAddress({...newAddress, title: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input 
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input 
                              placeholder="05XX XXX XX XX"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>İl</Label>
                            <Input 
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>İlçe</Label>
                            <Input 
                              value={newAddress.district}
                              onChange={(e) => setNewAddress({...newAddress, district: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mahalle</Label>
                            <Input 
                              value={newAddress.neighborhood}
                              onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Açık Adres</Label>
                          <Input 
                            value={newAddress.addressLine}
                            onChange={(e) => setNewAddress({...newAddress, addressLine: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posta Kodu</Label>
                          <Input 
                            value={newAddress.zipCode}
                            onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                          />
                        </div>
                        <Button className="w-full gradient-orange" onClick={handleAddAddress}>
                          <Check className="w-4 h-4 mr-2" />
                          Adresi Kaydet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Henüz adres eklenmemiş</h3>
                      <p className="text-muted-foreground mb-4">Sipariş vermek için bir adres ekleyin</p>
                      <Button className="gradient-orange" onClick={() => setIsAddressDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adres Ekle
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div key={address.id} className={`border rounded-lg p-4 ${address.isDefault ? 'border-orange-500 bg-orange-50' : ''}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-orange-500" />
                              <span className="font-semibold">{address.title}</span>
                              {address.isDefault && (
                                <Badge className="bg-orange-500">Varsayılan</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {!address.isDefault && (
                                <button 
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                                  title="Varsayılan yap"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteAddress(address.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{address.fullName}</p>
                            <p className="text-muted-foreground">{address.phone}</p>
                            <p className="text-muted-foreground">
                              {address.addressLine}, {address.neighborhood}
                            </p>
                            <p className="text-muted-foreground">
                              {address.district}/{address.city} {address.zipCode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Favorilerim</CardTitle>
                  <p className="text-muted-foreground mt-1">Beğendiğiniz ürünler</p>
                </CardHeader>
                <CardContent>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Henüz favori ürününüz yok</h3>
                      <p className="text-muted-foreground mb-4">Beğendiğiniz ürünleri favorilere ekleyin</p>
                      <Button className="gradient-orange" onClick={() => navigate('/products')}>
                        Ürünleri Keşfet
                      </Button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistItems.map((product) => (
                        <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-40 object-cover"
                          />
                          <div className="p-4">
                            <p className="text-sm text-orange-600">{product.brand}</p>
                            <p className="font-medium line-clamp-2">{product.name}</p>
                            <p className="text-lg font-bold text-orange-600 mt-2">
                              {formatPrice(product.price)}
                            </p>
                            <Button 
                              className="w-full mt-3 gradient-orange"
                              onClick={() => navigate(`/product/${product.id}`)}
                            >
                              Ürüne Git
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
