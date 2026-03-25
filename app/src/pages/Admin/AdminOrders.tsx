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
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useOrderStore, type Order } from '@/stores/orderStore';
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
  const { orders, updateOrderStatus, updatePaymentStatus } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Refresh orders from store
  useEffect(() => {
    setLoading(true);
    // Load orders from store
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Sipariş durumu güncellendi: ${statusConfig[newStatus].label}`);
  };

  const handlePaymentStatusChange = (orderId: string, newStatus: Order['paymentStatus']) => {
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

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
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
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                              <Truck className="w-4 h-4 mr-2" />
                              Kargoya Ver
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
              {/* Status & Payment */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-500">Sipariş Durumu</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(v) => handleStatusChange(selectedOrder.id, v as Order['status'])}
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
                    onValueChange={(v) => handlePaymentStatusChange(selectedOrder.id, v as Order['paymentStatus'])}
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
    </div>
  );
}
