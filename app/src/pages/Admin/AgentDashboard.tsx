import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Clock, CheckCircle, XCircle, 
  Send, Plus, Headphones, Inbox
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
  const { agentRequests, activeSessions, acceptRequest, completeRequest, agentAcceptedChat, sendAgentMessage, getSessionMessages } = useChatStore();
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
      
      // Müşteriye agent'ın bağlandığını bildir ve bot yanıtlarını durdur
      agentAcceptedChat(session.sessionId, user.name || 'Temsilci');
      
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
    
    // Store'a mesaj gönder (bu fonksiyon müşteriye de iletecek)
    sendAgentMessage(selectedSession.sessionId, inputMessage.trim());
    
    // Input'u temizle
    setInputMessage('');
  };
  
  // Seçili session değiştiğinde mesajları yükle ve store'dan dinle
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }
    
    // İlk yükleme
    const loadMessages = () => {
      const sessionMessages = getSessionMessages(selectedSession.sessionId);
      const formattedMessages: ChatMessage[] = sessionMessages.map(msg => ({
        messageId: msg.id,
        sessionId: selectedSession.sessionId,
        senderId: msg.sender === 'agent' ? user?.id || 'agent' : selectedSession.customerId,
        senderType: msg.sender === 'agent' ? 'agent' : 'customer',
        content: msg.text,
        timestamp: msg.timestamp,
        isRead: true,
      }));
      setMessages(formattedMessages);
    };
    
    loadMessages();
    
    // Store değişikliklerini dinle (gerçek zamanlı senkronizasyon)
    const unsubscribe = useChatStore.subscribe((state) => {
      // Aktif session'ın mesajlarını bul
      const session = state.activeSessions.find(s => s.id === selectedSession.sessionId);
      if (session) {
        const formattedMessages: ChatMessage[] = session.messages.map(msg => ({
          messageId: msg.id,
          sessionId: selectedSession.sessionId,
          senderId: msg.sender === 'agent' ? user?.id || 'agent' : selectedSession.customerId,
          senderType: msg.sender === 'agent' ? 'agent' : 'customer',
          content: msg.text,
          timestamp: msg.timestamp,
          isRead: true,
        }));
        setMessages(formattedMessages);
      }
    });
    
    // Cross-tab sync: Diğer sekmelerden/tarayıcılardan gelen mesajları dinle
    const handleChatMessage = (event: CustomEvent) => {
      if (event.detail.requestId === selectedSession.sessionId) {
        loadMessages(); // Mesajları yeniden yükle
      }
    };
    
    window.addEventListener('chat-message', handleChatMessage as EventListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('chat-message', handleChatMessage as EventListener);
    };
  }, [selectedSession, user?.id]);

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
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/25 ring-2 ring-white/20">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Canlı Destek
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Çevrimiçi
                </span>
              </div>
            </div>
          </div>
          
          {/* Orta: Modern İstatistik Kartları */}
          <div className="hidden md:flex items-center gap-4">
            {/* Bekleyen */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Bekleyen</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{waitingChats.length}</span>
              </div>
            </div>
            
            {/* Aktif */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Aktif</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{activeChats.length}</span>
              </div>
            </div>
          </div>
          
          {/* Sağ: Test Butonu */}
          <Button 
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
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4" />
            Test Talebi
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

          {/* Liste Alanı - Sabit Tab + Scrollable Liste */}
          <div className="flex-1 overflow-hidden">
            
            {/* Bekleyen Liste */}
            {activeTab === 'waiting' && (
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2 pb-20">
                  {waitingChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <Inbox className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Bekleyen yok</p>
                      <p className="text-sm text-gray-400 mt-1">Yeni talepler burada görünecek</p>
                    </div>
                  ) : (
                    waitingChats.map((chat) => (
                      <div 
                        key={chat.sessionId}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => acceptChat(chat)}
                      >
                        {/* Üst gradient çizgi */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                            <span className="text-lg font-bold text-white">
                              {(chat.customerName || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {chat.customerName || 'Misafir Kullanıcı'}
                              </p>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {formatDuration(chat.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {chat.customerEmail || 'E-posta belirtilmemiş'}
                            </p>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 border-0 rounded-xl px-4">
                            Kabul Et
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
          )}

          {/* Aktif Liste */}
          {activeTab === 'active' && (
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2 pb-20">
                  {activeChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <CheckCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Aktif sohbet yok</p>
                      <p className="text-sm text-gray-400 mt-1">Müşteriler burada görünecek</p>
                    </div>
                  ) : (
                    activeChats.map((chat) => (
                      <div 
                        key={chat.sessionId}
                        className={cn(
                          "group relative bg-white dark:bg-gray-800 border rounded-2xl p-4 cursor-pointer transition-all duration-300 overflow-hidden",
                          selectedSession?.sessionId === chat.sessionId 
                            ? "border-orange-400 shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/20" 
                            : "border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-md"
                        )}
                        onClick={() => setSelectedSession(chat)}
                      >
                        {/* Seçili göstergesi */}
                        {selectedSession?.sessionId === chat.sessionId && (
                          <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-400 to-amber-400 rounded-r-full"></div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-105",
                            selectedSession?.sessionId === chat.sessionId
                              ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/25"
                              : "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25"
                          )}>
                            <span className="text-lg font-bold text-white">
                              {(chat.customerName || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {chat.customerName || 'Misafir Kullanıcı'}
                              </p>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Aktif
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {formatDuration(chat.createdAt)} süredir bağlı
                            </p>
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1.5 font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
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
          )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col absolute lg:relative z-20 bg-gray-50 dark:bg-gray-900 h-full w-full lg:w-auto transition-transform",
          selectedSession ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSelectedSession(null)}
                  >
                    ←
                  </Button>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <span className="text-2xl font-bold text-white">
                        {(selectedSession.customerName || 'M').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedSession.customerName || 'Misafir Kullanıcı'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="font-medium">{formatDuration(selectedSession.createdAt)} bağlı</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={closeChat}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl px-4"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Sonlandır
                </Button>
              </div>

              {/* Messages - Scrollable Area */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-4 max-w-4xl mx-auto pb-20">
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
              </div>

              {/* Input - Fixed at bottom */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') sendMessage();
                      }}
                      placeholder="Mesajınızı yazın..."
                      className="w-full bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-orange-400 dark:focus:border-orange-500 rounded-xl pr-12 h-12 transition-all"
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 rounded-xl px-6 h-12"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
              {/* Dekoratif arka plan elementleri */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl"></div>
              </div>
              
              <div className="text-center px-4 relative z-10">
                {/* Animasyonlu ikon */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                    <Headphones className="w-12 h-12 text-white" />
                  </div>
                  {/* Dekoratif noktalar */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-75"></div>
                </div>
                
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent mb-3">
                  Destek Paneline Hoş Geldiniz
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  Müşterilerinizle gerçek zamanlı iletişim kurun. Sol panelden bir sohbet seçin veya yeni bir talebi kabul edin.
                </p>
                
                {/* İstatistik kartları */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[120px]">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{waitingChats.length}</span>
                    <span className="text-xs text-gray-400 font-medium">Bekleyen</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[120px]">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-2">
                      <MessageCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{activeChats.length}</span>
                    <span className="text-xs text-gray-400 font-medium">Aktif</span>
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
