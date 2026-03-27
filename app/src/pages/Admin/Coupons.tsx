import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Copy,
  Percent,
  Tag,
  ShoppingCart,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Gift,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  userLimit: number;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired' | 'disabled';
  applicableTo: 'all' | 'category' | 'product';
  applicableIds?: string[];
  createdAt: string;
}

const mockCoupons: Coupon[] = [
  {
    id: 'CPN-001',
    code: 'WELCOME20',
    description: 'İlk alışverişe özel %20 indirim',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 500,
    maxDiscount: 500,
    usageLimit: 1000,
    usageCount: 456,
    userLimit: 1,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'active',
    applicableTo: 'all',
    createdAt: '2024-01-01'
  },
  {
    id: 'CPN-002',
    code: 'SUMMER100',
    description: 'Yaz sezonuna özel 100 TL indirim',
    discountType: 'fixed',
    discountValue: 100,
    minPurchase: 1000,
    usageLimit: 500,
    usageCount: 234,
    userLimit: 3,
    validFrom: '2024-03-01',
    validUntil: '2024-08-31',
    status: 'active',
    applicableTo: 'category',
    applicableIds: ['outdoor', 'lighting'],
    createdAt: '2024-03-01'
  },
  {
    id: 'CPN-003',
    code: 'FREESHIP',
    description: 'Ücretsiz kargo',
    discountType: 'free_shipping',
    discountValue: 50,
    minPurchase: 300,
    usageLimit: 2000,
    usageCount: 1890,
    userLimit: 10,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'active',
    applicableTo: 'all',
    createdAt: '2024-01-01'
  },
  {
    id: 'CPN-004',
    code: 'BLACK50',
    description: 'Black Friday %50 indirim',
    discountType: 'percentage',
    discountValue: 50,
    minPurchase: 2000,
    maxDiscount: 1000,
    usageLimit: 100,
    usageCount: 100,
    userLimit: 1,
    validFrom: '2023-11-24',
    validUntil: '2023-11-27',
    status: 'expired',
    applicableTo: 'all',
    createdAt: '2023-11-01'
  },
  {
    id: 'CPN-005',
    code: 'VIP30',
    description: 'VIP müşterilere özel %30',
    discountType: 'percentage',
    discountValue: 30,
    minPurchase: 0,
    maxDiscount: 2000,
    usageLimit: 100,
    usageCount: 45,
    userLimit: 5,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'disabled',
    applicableTo: 'all',
    createdAt: '2024-01-01'
  }
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: '',
    minPurchase: '0',
    maxDiscount: '',
    usageLimit: '',
    userLimit: '1',
    validFrom: '',
    validUntil: '',
    applicableTo: 'all' as 'all' | 'category' | 'product'
  });

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || coupon.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Kupon kodu kopyalandı');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Kupon silindi');
    }
  };

  const handleToggleStatus = (id: string) => {
    setCoupons(coupons.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'active' ? 'disabled' : 'active' as const };
      }
      return c;
    }));
    toast.success('Durum güncellendi');
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchase: coupon.minPurchase.toString(),
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit.toString(),
      userLimit: coupon.userLimit.toString(),
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      applicableTo: coupon.applicableTo
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '0',
      maxDiscount: '',
      usageLimit: '',
      userLimit: '1',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      applicableTo: 'all'
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.discountValue) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const couponData: Coupon = {
      id: editingCoupon?.id || `CPN-${String(coupons.length + 1).padStart(3, '0')}`,
      code: formData.code.toUpperCase(),
      description: formData.description,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchase: parseFloat(formData.minPurchase) || 0,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      usageLimit: parseInt(formData.usageLimit) || 100,
      usageCount: editingCoupon?.usageCount || 0,
      userLimit: parseInt(formData.userLimit) || 1,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      status: 'active',
      applicableTo: formData.applicableTo,
      createdAt: editingCoupon?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (editingCoupon) {
      setCoupons(coupons.map(c => c.id === editingCoupon.id ? couponData : c));
      toast.success('Kupon güncellendi');
    } else {
      setCoupons([couponData, ...coupons]);
      toast.success('Kupon oluşturuldu');
    }

    setIsModalOpen(false);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discountType === 'free_shipping') return 'Ücretsiz Kargo';
    if (coupon.discountType === 'percentage') return `%${coupon.discountValue} İndirim`;
    return `₺${coupon.discountValue} İndirim`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500',
      expired: 'bg-gray-500',
      disabled: 'bg-red-500'
    };
    const labels = {
      active: 'Aktif',
      expired: 'Süresi Doldu',
      disabled: 'Pasif'
    };
    return <Badge className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.status === 'active').length,
    expired: coupons.filter(c => c.status === 'expired').length,
    totalUsage: coupons.reduce((acc, c) => acc + c.usageCount, 0),
    totalValue: coupons.reduce((acc, c) => {
      if (c.discountType === 'fixed') return acc + (c.discountValue * c.usageCount);
      return acc;
    }, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kupon Yönetimi</h1>
          <p className="text-sm text-gray-500">İndirim kuponlarınızı oluşturun ve yönetin</p>
        </div>
        <Button onClick={openCreateModal} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Toplam Kupon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-500">Aktif Kupon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-sm text-gray-500">Toplam Kullanım</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₺{stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Toplam İndirim</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Tümü ({stats.total})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Aktif ({stats.active})</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Süresi Dolan ({stats.expired})</TabsTrigger>
            <TabsTrigger value="disabled" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">Pasif</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Kupon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kupon Kodu</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Kupon bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-lg">{coupon.code}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              {copiedCode === coupon.code ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">{coupon.description}</p>
                          {coupon.minPurchase > 0 && (
                            <p className="text-xs text-gray-400">Min. alışveriş: ₺{coupon.minPurchase}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className="bg-orange-100 text-orange-700 mb-1">
                            {getDiscountText(coupon)}
                          </Badge>
                          {coupon.maxDiscount && (
                            <p className="text-xs text-gray-500">Max: ₺{coupon.maxDiscount}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{coupon.usageCount}</span>
                            <span className="text-gray-400">/</span>
                            <span>{coupon.usageLimit}</span>
                          </div>
                          <Progress value={(coupon.usageCount / coupon.usageLimit) * 100} className="w-24 h-2 mt-1" />
                          <p className="text-xs text-gray-500 mt-1">Kullanıcı başına: {coupon.userLimit}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{coupon.validFrom}</p>
                          <p className="text-gray-500">{coupon.validUntil}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(coupon)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(coupon.id)}>
                              {coupon.status === 'active' ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                  Devre Dışı Bırak
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                  Aktifleştir
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon Oluştur'}</DialogTitle>
            <DialogDescription>
              Kupon detaylarını girin. Boş bıraktığınız alanlar için varsayılan değerler kullanılacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Code */}
            <div>
              <label className="text-sm font-medium mb-2 block">Kupon Kodu *</label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="ÖRN: INDIRIM20"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={generateRandomCode}>
                  Otomatik
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Açıklama</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Kupon açıklaması"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">İndirim Türü</label>
              <div className="grid grid-cols-3 gap-2">
                {(['percentage', 'fixed', 'free_shipping'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.discountType === type ? 'default' : 'outline'}
                    onClick={() => setFormData({...formData, discountType: type})}
                    className={formData.discountType === type ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    {type === 'percentage' && <Percent className="w-4 h-4 mr-1" />}
                    {type === 'fixed' && <Tag className="w-4 h-4 mr-1" />}
                    {type === 'free_shipping' && <Gift className="w-4 h-4 mr-1" />}
                    {type === 'percentage' ? 'Yüzde' : type === 'fixed' ? 'Sabit' : 'Kargo'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Discount Value */}
            {formData.discountType !== 'free_shipping' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  İndirim {formData.discountType === 'percentage' ? 'Oranı (%)' : 'Tutarı (₺)'}
                </label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  placeholder={formData.discountType === 'percentage' ? 'Örn: 20' : 'Örn: 100'}
                />
              </div>
            )}

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Min. Alışveriş (₺)</label>
                <Input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                  placeholder="0"
                />
              </div>
              {formData.discountType === 'percentage' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Max. İndirim (₺)</label>
                  <Input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="Sınırsız"
                  />
                </div>
              )}
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Toplam Kullanım Limiti</label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Kullanıcı Başı Limit</label>
                <Input
                  type="number"
                  value={formData.userLimit}
                  onChange={(e) => setFormData({...formData, userLimit: e.target.value})}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                />
              </div>
            </div>

            {/* Applicable To */}
            <div>
              <label className="text-sm font-medium mb-2 block">Geçerli Olduğu Yer</label>
              <Select 
                value={formData.applicableTo} 
                onValueChange={(v: any) => setFormData({...formData, applicableTo: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Ürünler</SelectItem>
                  <SelectItem value="category">Belirli Kategoriler</SelectItem>
                  <SelectItem value="product">Belirli Ürünler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              {editingCoupon ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
