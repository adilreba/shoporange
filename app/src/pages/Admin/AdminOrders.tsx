import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';

interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress?: any;
}

const statusConfig = {
  pending: { label: 'Beklemede', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'İşleniyor', color: 'bg-blue-500', icon: Package },
  shipped: { label: 'Kargoda', color: 'bg-purple-500', icon: Package },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-500', icon: XCircle }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Sipariş güncellenirken hata oluştu');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Sipariş ID veya kullanıcı ID ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş ID</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Sipariş bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="font-mono text-sm">{order.userId}</TableCell>
                      <TableCell className="font-medium">₺{order.total?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                Detay
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Sipariş Detayı #{order.id}</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Sipariş Tarihi</p>
                                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Toplam Tutar</p>
                                    <p className="font-medium text-lg">₺{order.total?.toLocaleString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 mb-2">Durum Güncelle</p>
                                  <Select
                                    value={order.status}
                                    onValueChange={(value) => handleStatusChange(order.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Beklemede</SelectItem>
                                      <SelectItem value="processing">İşleniyor</SelectItem>
                                      <SelectItem value="shipped">Kargoda</SelectItem>
                                      <SelectItem value="delivered">Teslim Edildi</SelectItem>
                                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 mb-2">Ürünler</p>
                                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {order.items?.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>₺{(item.price * item.quantity)?.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {order.shippingAddress && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Teslimat Adresi</p>
                                    <p className="text-sm">{order.shippingAddress.fullName}</p>
                                    <p className="text-sm">{order.shippingAddress.address}</p>
                                    <p className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
