import { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck,
  Eye,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  Building2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrderStore, type StoreOrder } from '@/stores/orderStore';
import { useShippingStore, shippingCompanyInfo } from '@/stores/shippingStore';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Beklemede', color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: Clock },
  processing: { label: 'İşleniyor', color: 'bg-blue-500', textColor: 'text-blue-700', icon: Package },
  shipped: { label: 'Kargoda', color: 'bg-purple-500', textColor: 'text-purple-700', icon: Truck },
  completed: { label: 'Tamamlandı', color: 'bg-green-500', textColor: 'text-green-700', icon: CheckCircle },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-500', textColor: 'text-red-700', icon: XCircle },
  refunded: { label: 'İade Edildi', color: 'bg-gray-500', textColor: 'text-gray-700', icon: RotateCcw }
};

const paymentStatusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Ödendi', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Başarısız', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'İade Edildi', color: 'bg-gray-100 text-gray-700' }
};

export default function AdminOrders() {
  const { orders, updateOrderStatus, updatePaymentStatus, updateTrackingInfo } = useOrderStore();
  const { companies, getActiveCompanies, getDefaultCompany, findBestCompanyForCity } = useShippingStore();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<StoreOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedShippingCompany, setSelectedShippingCompany] = useState('');
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [autoAssignedCompany, setAutoAssignedCompany] = useState<{id: string; name: string; branchName: string} | null>(null);

  // Refresh orders from store
  useEffect(() => {
    setLoading(true);
    // Load orders from store
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: StoreOrder['status']) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Sipariş durumu güncellendi: ${statusConfig[newStatus].label}`);
  };

  const handlePaymentStatusChange = (orderId: string, newStatus: StoreOrder['paymentStatus']) => {
    updatePaymentStatus(orderId, newStatus);
    toast.success(`Ödeme durumu güncellendi`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openOrderDetail = (order: StoreOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openShippingModal = (order: StoreOrder) => {
    setShippingOrder(order);
    setTrackingNumber(order.trackingNumber || '');
    
    // Müşteri şehrine göre en uygun şubeyi bul
    const customerCity = order.address?.city || '';
    const bestCompany = findBestCompanyForCity(customerCity);
    
    if (bestCompany) {
      setSelectedShippingCompany(order.shippingCompany || bestCompany.id);
      setAutoAssignedCompany({
        id: bestCompany.id,
        name: bestCompany.name,
        branchName: bestCompany.branchInfo.branchName
      });
    } else {
      const defaultCompany = getDefaultCompany();
      setSelectedShippingCompany(order.shippingCompany || defaultCompany?.id || '');
      setAutoAssignedCompany(null);
    }
    
    setIsShippingModalOpen(true);
  };

  // Otomatik takip numarası oluştur
  const generateTrackingNumber = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return '';
    
    const prefix = company.type.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  };

  const handleCreateShipment = async () => {
    if (!shippingOrder || !selectedShippingCompany) {
      toast.error('Lütfen kargo şirketi seçin');
      return;
    }

    setIsCreatingShipment(true);

    try {
      // Kargo oluşturma simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Takip numarası yoksa otomatik oluştur
      const finalTrackingNumber = trackingNumber.trim() || generateTrackingNumber(selectedShippingCompany);
      
      await updateTrackingInfo(shippingOrder.id, finalTrackingNumber, selectedShippingCompany);
      
      toast.success(`Kargo oluşturuldu. Takip No: ${finalTrackingNumber}`);
      setIsShippingModalOpen(false);
      setShippingOrder(null);
      setTrackingNumber('');
    } catch (error) {
      toast.error('Kargo oluşturulurken bir hata oluştu');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const getTrackingUrl = (order: StoreOrder) => {
    if (!order.shippingCompany || !order.trackingNumber) return null;
    
    const company = companies.find(c => c.id === order.shippingCompany);
    if (!company) return null;
    
    const info = shippingCompanyInfo[company.type];
    return info?.trackingUrl?.replace('{trackingNumber}', order.trackingNumber) || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sipariş Yönetimi</h1>
          <p className="text-sm text-gray-500">{filteredOrders.length} sipariş</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Toplam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Beklemede</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            <p className="text-sm text-gray-500">İşleniyor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
            <p className="text-sm text-gray-500">Kargoda</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-500">Tamamlandı</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Toplam Gelir</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sipariş no, müşteri adı veya e-posta ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Durum Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="processing">İşleniyor</SelectItem>
                <SelectItem value="shipped">Kargoda</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Ürünler</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz sipariş bulunmuyor</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-mono font-medium">{order.id}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-xs text-gray-500">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{order.items.length} ürün</p>
                        <p className="text-xs text-gray-500">
                          {order.items.slice(0, 2).map(i => i.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold">₺{order.total.toLocaleString()}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(order.createdAt)}</p>
                        {order.trackingNumber && order.shippingCompany && (
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Building2 className="w-3 h-3" />
                              {(() => {
                                const company = companies.find(c => c.id === order.shippingCompany);
                                return company ? company.branchInfo.branchName : order.shippingCompany;
                              })()}
                            </div>
                            <a 
                              href={getTrackingUrl(order) || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {order.trackingNumber}
                            </a>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={paymentStatusConfig[order.paymentStatus].color}>
                          {paymentStatusConfig[order.paymentStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${statusConfig[order.status].textColor}`} />
                          <Badge className={statusConfig[order.status].color}>
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openOrderDetail(order)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Detay Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                              <Package className="w-4 h-4 mr-2" />
                              İşleme Al
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShippingModal(order)}>
                              <Truck className="w-4 h-4 mr-2" />
                              Kargo Oluştur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')}>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Tamamlandı
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                              <XCircle className="w-4 h-4 mr-2 text-red-500" />
                              İptal Et
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

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Shipping Info */}
              {selectedOrder.shippingCompany && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Kargo Bilgileri
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const company = companies.find(c => c.id === selectedOrder.shippingCompany);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Kargo Firması</span>
                            <span className="font-medium">
                              {company?.name || selectedOrder.shippingCompany}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Şube</span>
                            <span className="font-medium">
                              {company?.branchInfo.branchName || 'Bilinmiyor'}
                              {company?.branchInfo.branchCity && (
                                <span className="text-gray-500 text-sm"> ({company.branchInfo.branchCity})</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Şube Kodu</span>
                            <span className="font-mono text-sm">{company?.branchInfo.branchCode || '-'}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Takip Numarası</span>
                      <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span>
                    </div>
                    {getTrackingUrl(selectedOrder) && (
                      <a 
                        href={getTrackingUrl(selectedOrder) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Kargoyu Takip Et
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Payment */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Sipariş Durumu</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(v) => handleStatusChange(selectedOrder.id, v as StoreOrder['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="processing">İşleniyor</SelectItem>
                      <SelectItem value="shipped">Kargoda</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Ödeme Durumu</label>
                  <Select 
                    value={selectedOrder.paymentStatus} 
                    onValueChange={(v) => handlePaymentStatusChange(selectedOrder.id, v as StoreOrder['paymentStatus'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Bekliyor</SelectItem>
                      <SelectItem value="completed">Ödendi</SelectItem>
                      <SelectItem value="failed">Başarısız</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Müşteri Bilgileri</h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">{selectedOrder.customer}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {selectedOrder.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {selectedOrder.phone}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {selectedOrder.address.street}, {selectedOrder.address.city} {selectedOrder.address.postalCode}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Sipariş Ürünleri</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold">₺{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ödeme Yöntemi</span>
                  <span className="font-medium">
                    {selectedOrder.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 
                     selectedOrder.paymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kapıda Ödeme'}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Not</span>
                    <span className="font-medium">{selectedOrder.notes}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-xl font-bold">Toplam</span>
                  <span className="text-2xl font-bold text-orange-600">₺{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Modal */}
      <Dialog open={isShippingModalOpen} onOpenChange={setIsShippingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kargo Oluştur</DialogTitle>
          </DialogHeader>
          
          {shippingOrder && (
            <div className="space-y-4 mt-4">
              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{shippingOrder.customer}</p>
                    <p className="text-xs text-gray-500">{shippingOrder.id}</p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {shippingOrder.address?.city}
                    </p>
                  </div>
                  <p className="text-sm font-bold">₺{shippingOrder.total.toLocaleString()}</p>
                </div>
              </div>

              {/* Auto Assignment Info */}
              {autoAssignedCompany && selectedShippingCompany === autoAssignedCompany.id && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>
                      <strong>{autoAssignedCompany.branchName}</strong> şubesi otomatik atandı
                      ({shippingOrder.address?.city} için en uygun şube)
                    </span>
                  </p>
                </div>
              )}

              {/* Shipping Company Selection */}
              <div className="space-y-2">
                <Label>Gönderim Yapılacak Şube *</Label>
                <Select 
                  value={selectedShippingCompany} 
                  onValueChange={setSelectedShippingCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {/* Şehre göre önerilen şubeler */}
                    {shippingOrder.address?.city && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          {shippingOrder.address.city} İçin Önerilen
                        </div>
                        {companies
                          .filter(c => c.isActive && (
                            c.branchInfo.branchCity === shippingOrder.address?.city ||
                            c.settings.serviceCities.includes(shippingOrder.address?.city || '')
                          ))
                          .map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              <span className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-green-500" />
                                <span className="font-medium">{company.branchInfo.branchName}</span>
                                <span className="text-gray-400">-</span>
                                <span>{company.name}</span>
                                {company.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Varsayılan</Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        <div className="border-t my-2" />
                      </>
                    )}
                    
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                      Tüm Aktif Şubeler
                    </div>
                    {getActiveCompanies().map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{company.branchInfo.branchName}</span>
                          <span className="text-gray-400">-</span>
                          <span>{company.name}</span>
                          <span className="text-xs text-gray-400">({company.branchInfo.branchCity})</span>
                          {company.credentials.testMode && (
                            <span className="text-xs text-orange-500">[Test]</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedShippingCompany && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {(() => {
                      const company = companies.find(c => c.id === selectedShippingCompany);
                      if (!company) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.branchInfo.branchName}</span>
                          <span>•</span>
                          <span>{company.branchInfo.branchCity}</span>
                          <span>•</span>
                          <span className="font-mono">Şube: {company.branchInfo.branchCode}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {companies.length === 0 && (
                  <p className="text-xs text-orange-600">
                    Henüz kargo şubesi eklenmemiş.{' '}
                    <a href="/admin/shipping" className="underline">Ayarlara git</a>
                  </p>
                )}
              </div>

              {/* Tracking Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Takip Numarası</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTrackingNumber(generateTrackingNumber(selectedShippingCompany))}
                    disabled={!selectedShippingCompany}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Otomatik Oluştur
                  </Button>
                </div>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Boş bırakırsanız otomatik oluşturulur"
                />
                <p className="text-xs text-gray-500">
                  Manuel girebilir veya otomatik oluşturabilirsiniz
                </p>
              </div>

              {/* Warning for test mode */}
              {selectedShippingCompany && companies.find(c => c.id === selectedShippingCompany)?.credentials.testMode && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Test modu aktif. Gerçek kargo gönderimi yapılmayacak.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsShippingModalOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  className="flex-1 gradient-orange"
                  onClick={handleCreateShipment}
                  disabled={isCreatingShipment || !selectedShippingCompany || companies.length === 0}
                >
                  {isCreatingShipment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 mr-2" />
                      Kargo Oluştur
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
