import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Clock, CheckCircle, XCircle, 
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatSession {
  sessionId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderType: string;
  };
  unreadCount?: number;
}

interface ChatMessage {
  messageId: string;
  sessionId: string;
  senderId: string;
  senderType: 'customer' | 'agent';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { agentRequests, activeSessions, acceptRequest, completeRequest } = useChatStore();
  const [activeTab, setActiveTab] = useState('waiting');
  const [waitingChats, setWaitingChats] = useState<ChatSession[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notifiedRequestsRef = useRef<Set<string>>(new Set());
  const disconnectedNotifiedRef = useRef<Set<string>>(new Set());

  // Check if user is admin/agent
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
    if (!isAdmin) {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Subscribe to chat store changes
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state) => {
      console.log('Subscribe - state changed:', state);
      const pendingRequests = state.agentRequests.filter((req: any) => req.status === 'pending');
      
      // Show toast for new requests
      pendingRequests.forEach((request: any) => {
        if (!notifiedRequestsRef.current.has(request.id)) {
          toast.info(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">🔔 Yeni Canlı Destek Talebi!</span>
              <span className="text-sm">{request.userName} ({request.userEmail})</span>
            </div>,
            { duration: 8000 }
          );
          notifiedRequestsRef.current.add(request.id);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  // AWS API'den bekleyen talepleri çek
  const fetchWaitingFromAWS = async () => {
    try {
      const response = await chatApi.getWaitingSessions();
      if (response.success && response.data) {
        // AWS'den gelen verileri ChatSession formatına çevir
        const awsWaitingChats: ChatSession[] = response.data.map((session: any) => ({
          sessionId: session.sessionId,
          customerId: session.customerId,
          customerName: session.customerName,
          customerEmail: session.customerEmail,
          status: 'waiting',
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          lastMessage: session.lastMessage,
          unreadCount: 1
        }));
        
        // Local state ile birleştir
        setWaitingChats(prev => {
          const existingIds = new Set(prev.map(c => c.sessionId));
          const newChats = awsWaitingChats.filter((c: ChatSession) => !existingIds.has(c.sessionId));
          
          // Yeni talepler için bildirim göster
          newChats.forEach((chat: ChatSession) => {
            if (!notifiedRequestsRef.current.has(chat.sessionId)) {
              toast.info(
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">🔔 Yeni Canlı Destek Talebi!</span>
                  <span className="text-sm">{chat.customerName} ({chat.customerEmail})</span>
                </div>,
                { duration: 8000 }
              );
              notifiedRequestsRef.current.add(chat.sessionId);
            }
          });
          
          return [...prev, ...newChats];
        });
      }
    } catch (error) {
      console.log('AWS fetch error:', error);
    }
  };

  // Düzenli olarak AWS'den veri çek
  useEffect(() => {
    fetchWaitingFromAWS();
    const interval = setInterval(fetchWaitingFromAWS, 3000); // Her 3 saniyede bir
    return () => clearInterval(interval);
  }, []);

  // Update waiting and active chats when store changes (local mock data)
  useEffect(() => {
    const pendingRequests = agentRequests.filter(req => req.status === 'pending');
    
    // Convert agentRequests to waitingChats format
    const mockWaitingChats: ChatSession[] = pendingRequests.map(req => ({
      sessionId: req.id,
      customerId: req.userId,
      customerName: req.userName,
      customerEmail: req.userEmail,
      status: 'waiting' as const,
      createdAt: req.timestamp,
      updatedAt: req.timestamp,
      lastMessage: req.messages.length > 0 ? {
        content: req.messages[req.messages.length - 1].text,
        timestamp: req.messages[req.messages.length - 1].timestamp,
        senderType: req.messages[req.messages.length - 1].sender
      } : undefined,
      unreadCount: 1
    }));

    // Local verileri de ekle (AWS'den gelenlerle birleştir)
    setWaitingChats(prev => {
      const existingIds = new Set(prev.map(c => c.sessionId));
      const newLocalChats = mockWaitingChats.filter(c => !existingIds.has(c.sessionId));
      
      newLocalChats.forEach(chat => {
        if (!notifiedRequestsRef.current.has(chat.sessionId)) {
          toast.info(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">🔔 Yeni Canlı Destek Talebi!</span>
              <span className="text-sm">{chat.customerName} ({chat.customerEmail})</span>
            </div>,
            { duration: 8000 }
          );
          notifiedRequestsRef.current.add(chat.sessionId);
        }
      });
      
      return [...prev, ...newLocalChats];
    });

    // Convert activeSessions to activeChats format (disconnected olanları filtrele)
    const mockActiveChats: ChatSession[] = activeSessions
      .filter(req => req.status !== 'disconnected')
      .map(req => ({
        sessionId: req.id,
        customerId: req.userId,
        customerName: req.userName,
        customerEmail: req.userEmail,
        status: req.status === 'disconnected' ? 'closed' as const : 'active' as const,
        createdAt: req.timestamp,
        updatedAt: req.timestamp,
        lastMessage: req.messages.length > 0 ? {
          content: req.messages[req.messages.length - 1].text,
          timestamp: req.messages[req.messages.length - 1].timestamp,
          senderType: req.messages[req.messages.length - 1].sender
        } : undefined,
        unreadCount: 0
      }));

    setActiveChats(mockActiveChats);
    
    // Eğer seçili session disconnected olduysa bildirim göster
    if (selectedSession) {
      const disconnectedSession = activeSessions.find(
        req => req.id === selectedSession.sessionId && req.status === 'disconnected'
      );
      if (disconnectedSession && !disconnectedNotifiedRef.current.has(selectedSession.sessionId)) {
        toast.warning('⚠️ Müşteri bağlantıyı kesti', {
          description: 'Müşteri sayfayı kapattı veya bağlantısı kesildi.',
          duration: 5000,
        });
        disconnectedNotifiedRef.current.add(selectedSession.sessionId);
        // Seçili session'ı kapat
        setSelectedSession(null);
      }
    }
  }, [agentRequests, activeSessions, selectedSession]);

  const acceptChat = async (session: ChatSession) => {
    if (!user?.id) return;

    try {
      // Önce AWS'de kabul et
      await chatApi.assignAgent(session.sessionId, user.id);
      
      // Local store'a da ekle (eğer yoksa)
      const localRequest = agentRequests.find(req => req.id === session.sessionId);
      if (!localRequest) {
        // AWS'den gelen session'ı local store'a ekle
        const newRequest = {
          id: session.sessionId,
          userId: session.customerId,
          userName: session.customerName || 'Misafir',
          userEmail: session.customerEmail || '',
          timestamp: session.createdAt,
          status: 'pending' as const,
          messages: [{
            id: `msg_${Date.now()}`,
            text: 'Canlı destek talebi oluşturuldu',
            sender: 'user' as const,
            timestamp: session.createdAt,
          }],
        };
        // Store'a ekle
        const currentRequests = useChatStore.getState().agentRequests;
        useChatStore.setState({ 
          agentRequests: [...currentRequests, newRequest],
        });
      }
      
      // Local store'da kabul et (status: active yap) - bu fonksiyon zaten activeSessions'a da ekliyor
      acceptRequest(session.sessionId);
      
      // Listeden kaldır
      setWaitingChats(prev => prev.filter(c => c.sessionId !== session.sessionId));
      
      toast.success('Müşteri kabul edildi');
      setSelectedSession({ ...session, agentId: user.id, status: 'active' });
      setActiveTab('active');
    } catch (error) {
      console.error('Accept chat error:', error);
      toast.error('Müşteri kabul edilemedi');
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedSession || !user) return;
    
    // Yeni mesaj oluştur
    const newMessage: ChatMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: selectedSession.sessionId,
      senderId: user.id,
      senderType: 'agent',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    // Mesajı state'e ekle
    setMessages(prev => [...prev, newMessage]);
    
    // Input'u temizle
    setInputMessage('');
    
    // Toast bildirimi
    toast.success('Mesaj gönderildi');
  };

  const closeChat = async () => {
    if (!selectedSession) return;

    try {
      completeRequest(selectedSession.sessionId);
      toast.success('Sohbet sonlandırıldı');
      setSelectedSession(null);
    } catch (error) {
      toast.error('Sohbet sonlandırılamadı');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string) => {
    const diff = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}s ${minutes % 60}dk`;
    return `${minutes}dk`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - Profesyonel Tasarım */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Sol: Başlık ve Durum */}
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Canlı Destek Paneli</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  Çevrimiçi
                </span>
              </div>
            </div>
          </div>
          
          {/* Orta: İstatistikler */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">{waitingChats.length} Bekleyen</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{activeChats.length} Aktif</span>
            </div>
          </div>
          
          {/* Sağ: Test Butonu */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const { requestAgent } = useChatStore.getState();
              requestAgent({
                userId: `test_${Date.now()}`,
                userName: 'Test Müşteri',
                userEmail: 'test@musteri.com'
              });
              toast.success('Test talebi oluşturuldu!');
            }}
            className="hidden sm:flex items-center gap-1.5 border-gray-300 hover:bg-gray-50"
          >
            + Test Talebi
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className={cn(
          "w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col absolute lg:relative z-10 h-full transition-transform",
          selectedSession ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}>
          {/* Profesyonel Tab Tasarımı */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex gap-1 bg-gray-200/60 dark:bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('waiting')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'waiting'
                    ? "bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Clock className="w-4 h-4" />
                Bekleyen
                {waitingChats.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {waitingChats.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'active'
                    ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <MessageCircle className="w-4 h-4" />
                Aktif
                {activeChats.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {activeChats.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bekleyen Liste */}
          {activeTab === 'waiting' && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-3 space-y-2">
                  {waitingChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Bekleyen müşteri yok</p>
                      <p className="text-sm mt-1">Yeni talepler burada görünecek</p>
                    </div>
                  ) : (
                    waitingChats.map((chat) => (
                      <div 
                        key={chat.sessionId}
                        className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-red-400 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => acceptChat(chat)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                              {(chat.customerName || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {chat.customerName || 'Misafir Kullanıcı'}
                              </p>
                              <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                {formatDuration(chat.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {chat.customerEmail || 'E-posta belirtilmemiş'}
                            </p>
                          </div>
                          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shadow-md">
                            Kabul Et
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Aktif Liste */}
          {activeTab === 'active' && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-3 space-y-2">
                  {activeChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Aktif sohbet yok</p>
                      <p className="text-sm mt-1">Kabul ettiğiniz müşteriler burada görünecek</p>
                    </div>
                  ) : (
                    activeChats.map((chat) => (
                      <div 
                        key={chat.sessionId}
                        className={cn(
                          "group bg-white dark:bg-gray-800 border rounded-xl p-4 cursor-pointer transition-all",
                          selectedSession?.sessionId === chat.sessionId 
                            ? "border-orange-500 shadow-md ring-1 ring-orange-500/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:shadow-sm"
                        )}
                        onClick={() => setSelectedSession(chat)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {(chat.customerName || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {chat.customerName || 'Misafir Kullanıcı'}
                              </p>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Aktif
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {formatDuration(chat.createdAt)} süredir bağlı
                            </p>
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1 font-medium">
                                {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col absolute lg:relative z-20 bg-gray-50 dark:bg-gray-900 h-full w-full lg:w-auto transition-transform",
          selectedSession ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden -ml-2"
                    onClick={() => setSelectedSession(null)}
                  >
                    ←
                  </Button>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {(selectedSession.customerName || 'M').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedSession.customerName || 'Misafir Kullanıcı'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {formatDuration(selectedSession.createdAt)} süredir bağlı
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={closeChat}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Sonlandır
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-12 h-12 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Henüz mesaj yok</p>
                      <p className="text-sm mt-1">Sohbete başlamak için mesaj gönderin</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.messageId}
                        className={cn(
                          'flex gap-3',
                          message.senderType === 'agent' ? 'flex-row-reverse' : ''
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            message.senderType === 'agent'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-200 text-gray-600'
                          )}
                        >
                          <span className="text-sm font-bold">
                            {message.senderType === 'agent' ? 'A' : 'M'}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-5 py-3',
                            message.senderType === 'agent'
                              ? 'bg-orange-500 text-white rounded-br-none shadow-md'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-600'
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={cn(
                            'text-xs mt-2',
                            message.senderType === 'agent' ? 'text-orange-100' : 'text-gray-400'
                          )}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') sendMessage();
                    }}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
                  />
                  <Button onClick={sendMessage} className="gradient-orange">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center px-4">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <MessageCircle className="w-16 h-16 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Canlı Destek Paneli
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  Sohbet başlatmak için soldaki listeden bir müşteri seçin veya bekleyen bir talebi kabul edin.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>{waitingChats.length} Bekleyen</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span>{activeChats.length} Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
