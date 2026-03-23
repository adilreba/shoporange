import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  Target,
  Users,
  ShoppingBag,
  MoreHorizontal,
  Play,
  Pause,
  Zap,
  Tag
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

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'flash_sale' | 'seasonal' | 'clearance' | 'bundle' | 'member_exclusive';
  discountType: 'percentage' | 'fixed' | 'buy_x_get_y';
  discountValue: number;
  minPurchase?: number;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'paused' | 'ended';
  target: 'all' | 'category' | 'product' | 'customer_group';
  targetIds?: string[];
  salesTarget?: number;
  currentSales: number;
  orderCount: number;
  customerCount: number;
  banner?: string;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: 'CMP-001',
    name: 'Mart Fırsatları',
    description: 'Tüm oturma odası ürünlerinde %30\'a varan indirimler',
    type: 'seasonal',
    discountType: 'percentage',
    discountValue: 30,
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    status: 'active',
    target: 'category',
    targetIds: ['living-room'],
    salesTarget: 1000000,
    currentSales: 750000,
    orderCount: 156,
    customerCount: 89,
    createdAt: '2024-02-25'
  },
  {
    id: 'CMP-002',
    name: 'Flash Sale - 24 Saat',
    description: 'Seçili ürünlerde sınırlı süreli süper fiyatlar',
    type: 'flash_sale',
    discountType: 'percentage',
    discountValue: 50,
    startDate: '2024-03-23',
    endDate: '2024-03-24',
    status: 'ended',
    target: 'product',
    salesTarget: 500000,
    currentSales: 680000,
    orderCount: 234,
    customerCount: 156,
    createdAt: '2024-03-20'
  },
  {
    id: 'CMP-003',
    name: 'VIP Müşterilere Özel',
    description: 'Sadık müşterilerimize özel %25 indirim',
    type: 'member_exclusive',
    discountType: 'percentage',
    discountValue: 25,
    minPurchase: 1000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    target: 'customer_group',
    targetIds: ['vip'],
    salesTarget: 2000000,
    currentSales: 1250000,
    orderCount: 456,
    customerCount: 123,
    createdAt: '2024-01-01'
  },
  {
    id: 'CMP-004',
    name: '2 Al 1 Öde',
    description: 'Tüm aydınlatma ürünlerinde geçerli',
    type: 'bundle',
    discountType: 'buy_x_get_y',
    discountValue: 0,
    buyQuantity: 2,
    getQuantity: 1,
    startDate: '2024-03-15',
    endDate: '2024-04-15',
    status: 'active',
    target: 'category',
    targetIds: ['lighting'],
    salesTarget: 300000,
    currentSales: 180000,
    orderCount: 89,
    customerCount: 67,
    createdAt: '2024-03-10'
  },
  {
    id: 'CMP-005',
    name: 'Sezon Sonu Temizliği',
    description: 'Kış koleksiyonunda %60\'a varan indirimler',
    type: 'clearance',
    discountType: 'percentage',
    discountValue: 60,
    startDate: '2024-04-01',
    endDate: '2024-04-30',
    status: 'scheduled',
    target: 'all',
    salesTarget: 800000,
    currentSales: 0,
    orderCount: 0,
    customerCount: 0,
    createdAt: '2024-03-20'
  }
];

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'seasonal' as 'flash_sale' | 'seasonal' | 'clearance' | 'bundle' | 'member_exclusive',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'buy_x_get_y',
    discountValue: '',
    minPurchase: '',
    buyQuantity: '2',
    getQuantity: '1',
    startDate: '',
    endDate: '',
    target: 'all' as 'all' | 'category' | 'product' | 'customer_group',
    salesTarget: ''
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || campaign.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDelete = (id: string) => {
    if (confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success('Kampanya silindi');
    }
  };

  const handleToggleStatus = (id: string, newStatus: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: newStatus as Campaign['status'] } : c
    ));
    toast.success('Durum güncellendi');
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue.toString(),
      minPurchase: campaign.minPurchase?.toString() || '',
      buyQuantity: campaign.buyQuantity?.toString() || '2',
      getQuantity: campaign.getQuantity?.toString() || '1',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      target: campaign.target,
      salesTarget: campaign.salesTarget?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      type: 'seasonal',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '',
      buyQuantity: '2',
      getQuantity: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      target: 'all',
      salesTarget: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.discountValue) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const campaignData: Campaign = {
      id: editingCampaign?.id || `CMP-${String(campaigns.length + 1).padStart(3, '0')}`,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
      buyQuantity: formData.discountType === 'buy_x_get_y' ? parseInt(formData.buyQuantity) : undefined,
      getQuantity: formData.discountType === 'buy_x_get_y' ? parseInt(formData.getQuantity) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: editingCampaign?.status || 'scheduled',
      target: formData.target,
      salesTarget: formData.salesTarget ? parseFloat(formData.salesTarget) : undefined,
      currentSales: editingCampaign?.currentSales || 0,
      orderCount: editingCampaign?.orderCount || 0,
      customerCount: editingCampaign?.customerCount || 0,
      createdAt: editingCampaign?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? campaignData : c));
      toast.success('Kampanya güncellendi');
    } else {
      setCampaigns([campaignData, ...campaigns]);
      toast.success('Kampanya oluşturuldu');
    }

    setIsModalOpen(false);
  };

  const getCampaignTypeIcon = (type: string) => {
    const icons = {
      flash_sale: Zap,
      seasonal: Calendar,
      clearance: Tag,
      bundle: ShoppingBag,
      member_exclusive: Users
    };
    return icons[type as keyof typeof icons] || Target;
  };

  const getCampaignTypeLabel = (type: string) => {
    const labels = {
      flash_sale: 'Flash Sale',
      seasonal: 'Sezonsal',
      clearance: 'Sezon Sonu',
      bundle: 'Paket',
      member_exclusive: 'Üye Özel'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      ended: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      scheduled: 'Planlandı',
      active: 'Aktif',
      paused: 'Duraklatıldı',
      ended: 'Bitti'
    };
    return <Badge variant="secondary" className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const getDiscountText = (campaign: Campaign) => {
    if (campaign.discountType === 'buy_x_get_y') {
      return `${campaign.buyQuantity} Al ${campaign.getQuantity} Öde`;
    }
    if (campaign.discountType === 'percentage') {
      return `%${campaign.discountValue} İndirim`;
    }
    return `₺${campaign.discountValue} İndirim`;
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    totalRevenue: campaigns.reduce((acc, c) => acc + c.currentSales, 0),
    totalOrders: campaigns.reduce((acc, c) => acc + c.orderCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kampanya Yönetimi</h1>
          <p className="text-sm text-gray-500">Satış kampanyalarınızı oluşturun ve takip edin</p>
        </div>
        <Button onClick={openCreateModal} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Toplam Kampanya</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Aktif Kampanya</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">₺{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-gray-500">Kampanya Geliri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm text-gray-500">Kampanya Siparişi</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.filter(c => c.status === 'active').slice(0, 3).map(campaign => {
          const Icon = getCampaignTypeIcon(campaign.type);
          const progress = campaign.salesTarget ? (campaign.currentSales / campaign.salesTarget) * 100 : 0;
          
          return (
            <Card key={campaign.id} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{getCampaignTypeLabel(campaign.type)}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Aktif</Badge>
                </div>
                
                <div className="mb-3">
                  <Badge className="bg-orange-100 text-orange-700 mb-2">{getDiscountText(campaign)}</Badge>
                  <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                </div>

                {campaign.salesTarget && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hedef: ₺{campaign.salesTarget.toLocaleString()}</span>
                      <span>%{Math.round(progress)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-500">
                  <span>{campaign.orderCount} sipariş</span>
                  <span>{campaign.customerCount} müşteri</span>
                </div>

                <p className="text-xs text-gray-400 mt-2">Bitiş: {campaign.endDate}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaigns List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">Tümü ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Aktif ({stats.active})</TabsTrigger>
            <TabsTrigger value="scheduled">Planlanan ({stats.scheduled})</TabsTrigger>
            <TabsTrigger value="ended">Biten</TabsTrigger>
          </TabsList>
          
          <Input
            placeholder="Kampanya ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Performans</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Kampanya bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const Icon = getCampaignTypeIcon(campaign.type);
                    const progress = campaign.salesTarget ? (campaign.currentSales / campaign.salesTarget) * 100 : 0;
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-gray-500">{getCampaignTypeLabel(campaign.type)} • {campaign.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-700">
                            {getDiscountText(campaign)}
                          </Badge>
                          {campaign.minPurchase && (
                            <p className="text-xs text-gray-500 mt-1">Min: ₺{campaign.minPurchase}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.salesTarget ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">₺{campaign.currentSales.toLocaleString()}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-sm text-gray-500">₺{campaign.salesTarget.toLocaleString()}</span>
                              </div>
                              <Progress value={progress} className="w-24 h-2 mt-1" />
                              <p className="text-xs text-gray-500 mt-1">{campaign.orderCount} sipariş</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">₺{campaign.currentSales.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{campaign.orderCount} sipariş</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{campaign.startDate}</p>
                            <p className="text-gray-500">{campaign.endDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(campaign)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              {campaign.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(campaign.id, 'paused')}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Duraklat
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'paused' && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(campaign.id, 'active')}>
                                  <Play className="w-4 h-4 mr-2 text-green-500" />
                                  Devam Et
                                </DropdownMenuItem>
                              )}
                              {(campaign.status === 'scheduled' || campaign.status === 'ended') && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(campaign.id, 'active')}>
                                  <Play className="w-4 h-4 mr-2 text-green-500" />
                                  Başlat
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(campaign.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            <DialogTitle>{editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}</DialogTitle>
            <DialogDescription>
              Kampanya detaylarını girin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="Kampanya Adı"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            
            <textarea
              placeholder="Kampanya Açıklaması"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-md min-h-[80px]"
            />

            <Select 
              value={formData.type} 
              onValueChange={(v: any) => setFormData({...formData, type: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kampanya Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flash_sale">⚡ Flash Sale</SelectItem>
                <SelectItem value="seasonal">📅 Sezonsal</SelectItem>
                <SelectItem value="clearance">🏷️ Sezon Sonu</SelectItem>
                <SelectItem value="bundle">🛍️ Paket Kampanya</SelectItem>
                <SelectItem value="member_exclusive">👤 Üye Özel</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={formData.discountType} 
              onValueChange={(v: any) => setFormData({...formData, discountType: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="İndirim Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Yüzde (%)</SelectItem>
                <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                <SelectItem value="buy_x_get_y">X Al Y Öde</SelectItem>
              </SelectContent>
            </Select>

            {formData.discountType === 'buy_x_get_y' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Alınacak"
                  value={formData.buyQuantity}
                  onChange={(e) => setFormData({...formData, buyQuantity: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Ödenecek"
                  value={formData.getQuantity}
                  onChange={(e) => setFormData({...formData, getQuantity: e.target.value})}
                />
              </div>
            ) : (
              <Input
                type="number"
                placeholder={formData.discountType === 'percentage' ? 'İndirim Oranı (%)' : 'İndirim Tutarı (₺)'}
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
              />
            )}

            <Input
              type="number"
              placeholder="Min. Alışveriş (Opsiyonel)"
              value={formData.minPurchase}
              onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                placeholder="Başlangıç"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
              <Input
                type="date"
                placeholder="Bitiş"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>

            <Select 
              value={formData.target} 
              onValueChange={(v: any) => setFormData({...formData, target: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hedef Kitle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Müşteriler</SelectItem>
                <SelectItem value="category">Belirli Kategoriler</SelectItem>
                <SelectItem value="product">Belirli Ürünler</SelectItem>
                <SelectItem value="customer_group">Müşteri Grubu</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Satış Hedefi (Opsiyonel)"
              value={formData.salesTarget}
              onChange={(e) => setFormData({...formData, salesTarget: e.target.value})}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              {editingCampaign ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
