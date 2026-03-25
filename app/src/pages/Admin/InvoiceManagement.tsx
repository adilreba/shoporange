import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  User,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { toast } from 'sonner';
import {
  useInvoiceStore,
  type Invoice,
  type InvoiceType,
  type InvoiceStatus,
} from '@/stores/invoiceStore';
import { useOrderStore } from '@/stores/orderStore';

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Beklemede', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'İşleniyor', color: 'bg-blue-500', icon: RefreshCw },
  sent: { label: 'Gönderildi', color: 'bg-green-500', icon: CheckCircle },
  error: { label: 'Hata', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'İptal Edildi', color: 'bg-gray-500', icon: XCircle },
};

const typeConfig: Record<InvoiceType, { label: string; badge: string }> = {
  EFATURA: { label: 'e-Fatura', badge: 'bg-purple-100 text-purple-700' },
  EARSIV: { label: 'e-Arşiv', badge: 'bg-blue-100 text-blue-700' },
};

export default function InvoiceManagement() {
  const { invoices, getInvoiceStats, createInvoiceFromOrder, cancelInvoice, downloadPDF, sendEmail } = useInvoiceStore();
  const { orders } = useOrderStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = getInvoiceStats();

  // Filtrelenmiş faturalar
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Faturasız siparişler
  const ordersWithoutInvoice = orders.filter(
    (order) => !invoices.some((inv) => inv.orderId === order.id && inv.status !== 'cancelled')
  );

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) {
      toast.error('Lütfen bir sipariş seçin');
      return;
    }

    setIsGenerating(true);
    const order = orders.find((o) => o.id === selectedOrderId);
    
    if (!order) {
      toast.error('Sipariş bulunamadı');
      setIsGenerating(false);
      return;
    }

    try {
      const invoice = createInvoiceFromOrder(order);
      if (invoice) {
        toast.success(`Fatura oluşturuldu: ${invoice.invoiceNumber}`);
        setIsCreateOpen(false);
        setSelectedOrderId('');
      } else {
        toast.error('Fatura oluşturulamadı');
      }
    } catch (error) {
      toast.error('Fatura oluşturulurken hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    toast.promise(downloadPDF(invoice.id), {
      loading: 'PDF indiriliyor...',
      success: 'PDF indirildi',
      error: 'PDF indirilemedi',
    });
  };

  const handleSendEmail = async (invoice: Invoice) => {
    toast.promise(sendEmail(invoice.id, invoice.recipient.email), {
      loading: 'E-posta gönderiliyor...',
      success: 'Fatura e-posta ile gönderildi',
      error: 'E-posta gönderilemedi',
    });
  };

  const handleCancelInvoice = (invoice: Invoice) => {
    const reason = window.prompt('İptal nedeni:');
    if (reason) {
      cancelInvoice(invoice.id, reason);
      toast.success('Fatura iptal edildi');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fatura Yönetimi</h1>
          <p className="text-gray-500 mt-1">e-Fatura ve e-Arşiv faturalarınızı yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Manuel Fatura
          </Button>
          <Button className="gradient-orange" onClick={() => setIsCreateOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Otomatik Fatura
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Toplam Fatura</p>
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
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-sm text-gray-500">Gönderildi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{formatPrice(stats.totalAmount)}</p>
            <p className="text-sm text-gray-500">Toplam Tutar</p>
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
                placeholder="Fatura no, müşteri veya sipariş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="processing">İşleniyor</SelectItem>
                <SelectItem value="sent">Gönderildi</SelectItem>
                <SelectItem value="error">Hata</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="EFATURA">e-Fatura</SelectItem>
                <SelectItem value="EARSIV">e-Arşiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Sipariş</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Fatura bulunmuyor</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status].icon;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.recipient.name}</p>
                          <p className="text-xs text-gray-500">{invoice.recipient.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">{invoice.orderId}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(invoice.invoiceDate)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig[invoice.type].badge}>
                          {typeConfig[invoice.type].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatPrice(invoice.total)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${statusConfig[invoice.status].color.replace('bg-', 'text-')}`} />
                          <Badge className={statusConfig[invoice.status].color}>
                            {statusConfig[invoice.status].label}
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
                            <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setIsDetailOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Detay Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="w-4 h-4 mr-2" />
                              PDF İndir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(invoice)}>
                              <Mail className="w-4 h-4 mr-2" />
                              E-posta Gönder
                            </DropdownMenuItem>
                            {invoice.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleCancelInvoice(invoice)} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                İptal Et
                              </DropdownMenuItem>
                            )}
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

      {/* Create Invoice Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
            <DialogDescription>
              Siparişten otomatik fatura oluşturun
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Sipariş Seçin *</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Faturasız sipariş seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ordersWithoutInvoice.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      Tüm siparişlerin faturası var
                    </div>
                  ) : (
                    ordersWithoutInvoice.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.id}</span>
                          <span className="text-xs text-gray-500">
                            {order.customer} - {formatPrice(order.total)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {ordersWithoutInvoice.length === 0 && (
                <p className="text-sm text-orange-600">
                  Faturasız sipariş bulunmuyor.
                </p>
              )}
            </div>

            {selectedOrderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {(() => {
                  const order = orders.find((o) => o.id === selectedOrderId);
                  if (!order) return null;
                  return (
                    <div className="space-y-2 text-sm">
                      <p><strong>Müşteri:</strong> {order.customer}</p>
                      <p><strong>E-posta:</strong> {order.email}</p>
                      <p><strong>Telefon:</strong> {order.phone}</p>
                      <p><strong>Tutar:</strong> {formatPrice(order.total)}</p>
                      <p><strong>Ürün:</strong> {order.items?.length} adet</p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                İptal
              </Button>
              <Button 
                className="flex-1 gradient-orange" 
                onClick={handleCreateInvoice}
                disabled={isGenerating || !selectedOrderId || ordersWithoutInvoice.length === 0}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Fatura Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fatura Detayı - {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 mt-4">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <Badge className={typeConfig[selectedInvoice.type].badge}>
                    {typeConfig[selectedInvoice.type].label}
                  </Badge>
                  <Badge className={`ml-2 ${statusConfig[selectedInvoice.status].color}`}>
                    {statusConfig[selectedInvoice.status].label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Fatura Tarihi</p>
                  <p className="font-medium">{formatDate(selectedInvoice.invoiceDate)}</p>
                </div>
              </div>

              {/* Sender & Recipient */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Gönderici (Satıcı)
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedInvoice.sender.companyName}</p>
                    <p>VKN: {selectedInvoice.sender.taxNumber}</p>
                    <p>{selectedInvoice.sender.taxOffice}</p>
                    <p>{selectedInvoice.sender.address}</p>
                    <p>{selectedInvoice.sender.city} / {selectedInvoice.sender.district}</p>
                    <p>Tel: {selectedInvoice.sender.phone}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Alıcı (Müşteri)
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedInvoice.recipient.name}</p>
                    {selectedInvoice.recipient.taxNumber && (
                      <p>VKN/TCKN: {selectedInvoice.recipient.taxNumber}</p>
                    )}
                    <p>{selectedInvoice.recipient.address.address}</p>
                    <p>{selectedInvoice.recipient.address.city} / {selectedInvoice.recipient.address.district}</p>
                    <p>Tel: {selectedInvoice.recipient.phone}</p>
                    <p>E-posta: {selectedInvoice.recipient.email}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold mb-3">Fatura Kalemleri</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Adet</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">KDV %</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">%{item.kdvRate}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ara Toplam</span>
                    <span>{formatPrice(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam KDV</span>
                    <span>{formatPrice(selectedInvoice.totalKDV)}</span>
                  </div>
                  {selectedInvoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim</span>
                      <span>-{formatPrice(selectedInvoice.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Genel Toplam</span>
                    <span className="text-orange-600">{formatPrice(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => handleDownloadPDF(selectedInvoice)}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF İndir
                </Button>
                <Button variant="outline" onClick={() => handleSendEmail(selectedInvoice)}>
                  <Mail className="w-4 h-4 mr-2" />
                  E-posta Gönder
                </Button>
                {selectedInvoice.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={() => handleCancelInvoice(selectedInvoice)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    İptal Et
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
