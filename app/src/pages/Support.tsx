import { useState } from 'react';

import { 
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastReply: string;
  messages: number;
}

const mockTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    subject: 'Siparişim henüz kargoya verilmedi',
    category: 'Sipariş',
    status: 'open',
    priority: 'high',
    createdAt: '2024-03-20 14:30',
    lastReply: '2024-03-20 16:45',
    messages: 3
  },
  {
    id: 'TKT-002',
    subject: 'Ürün iadesi hakkında bilgi',
    category: 'İade',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-03-18 09:15',
    lastReply: '2024-03-19 11:20',
    messages: 5
  },
  {
    id: 'TKT-003',
    subject: 'Hesap şifremi unuttum',
    category: 'Hesap',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-03-15 22:00',
    lastReply: '2024-03-16 08:30',
    messages: 2
  },
  {
    id: 'TKT-004',
    subject: 'Kupon kodum çalışmıyor',
    category: 'Kampanya',
    status: 'closed',
    priority: 'medium',
    createdAt: '2024-03-10 16:20',
    lastReply: '2024-03-12 10:15',
    messages: 4
  }
];

const getStatusBadge = (status: SupportTicket['status']) => {
  const styles = {
    open: 'bg-green-500 hover:bg-green-600',
    pending: 'bg-yellow-500 hover:bg-yellow-600',
    resolved: 'bg-blue-500 hover:bg-blue-600',
    closed: 'bg-gray-500 hover:bg-gray-600'
  };
  const labels = {
    open: 'Açık',
    pending: 'Beklemede',
    resolved: 'Çözüldü',
    closed: 'Kapalı'
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
};

const getPriorityBadge = (priority: SupportTicket['priority']) => {
  const styles = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700'
  };
  const labels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek'
  };
  return <Badge variant="secondary" className={styles[priority]}>{labels[priority]}</Badge>;
};

export function Support() {

  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', message: '' });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    
    const ticket: SupportTicket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newTicket.subject,
      category: newTicket.category || 'Genel',
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toLocaleString('tr-TR'),
      lastReply: new Date().toLocaleString('tr-TR'),
      messages: 1
    };
    
    setTickets([ticket, ...tickets]);
    setIsNewTicketOpen(false);
    setNewTicket({ subject: '', category: '', message: '' });
    toast.success('Talebiniz oluşturuldu');
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    total: tickets.length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Soru ve Taleplerim</h1>
          <p className="text-gray-600 dark:text-gray-400">Destek taleplerinizi buradan takip edebilirsiniz</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-sm text-gray-500">Açık Talep</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Beklemede</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-gray-500">Çözüldü</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-500">Toplam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Ticket Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Talep ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
            >
              <option value="all">Tümü</option>
              <option value="open">Açık</option>
              <option value="pending">Beklemede</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>
          <Button onClick={() => setIsNewTicketOpen(true)} className="bg-orange-500 hover:bg-orange-600 ml-4">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Talep
          </Button>
        </div>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Taleplerim</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Henüz talebiniz bulunmuyor</p>
                <Button onClick={() => setIsNewTicketOpen(true)} variant="outline" className="mt-4">
                  İlk Talebinizi Oluşturun
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => toast.info(`${ticket.id} detayları görüntüleniyor...`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">{ticket.id}</span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500">{ticket.category} • {ticket.messages} mesaj</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Oluşturulma: {ticket.createdAt}</p>
                      <p>Son yanıt: {ticket.lastReply}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Ticket Modal */}
        {isNewTicketOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Yeni Destek Talebi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Konu</label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Talebinizin konusu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Kategori</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Sipariş">Sipariş</option>
                    <option value="İade">İade</option>
                    <option value="Hesap">Hesap</option>
                    <option value="Kampanya">Kampanya</option>
                    <option value="Genel">Genel</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Mesajınız</label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    placeholder="Sorununuzu detaylı açıklayın..."
                    className="w-full px-3 py-2 border rounded-md min-h-[120px]"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleCreateTicket} className="bg-orange-500 hover:bg-orange-600">
                    Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
