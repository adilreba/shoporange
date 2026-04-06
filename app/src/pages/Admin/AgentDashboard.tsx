/**
 * Agent Dashboard - Admin Live Support Panel
 * Canlı destek taleplerini yönetme ve müşterilerle sohbet etme
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Plus, 
  Headphones, 
  Inbox,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { useLiveChatStore } from '@/stores/liveChatStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/services/liveChatApi';

interface ChatSession {
  sessionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'waiting' | 'active' | 'closed';
  createdAt: string;
  messages: any[];
  unreadCount: number;
  waitingMinutes?: number; // Bekleme süresi (dakika)
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const {
    agentRequests,
    activeSessions,
    isConnected,
    connectionStatus,
    connect,
    acceptRequest,
    completeRequest,
    sendAgentMessage,
    fetchWaitingSessions
  } = useLiveChatStore();

  const [activeTab, setActiveTab] = useState<'waiting' | 'active'>('waiting');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  // Her session için ayrı input state'i - { [sessionId]: message }
  const [sessionInputs, setSessionInputs] = useState<Record<string, string>>({});
  // Her session için okunmamış mesaj sayısı - { [sessionId]: count }
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Her session için son okunan mesaj sayısı - { [sessionId]: lastReadCount }
  const [lastReadCounts, setLastReadCounts] = useState<Record<string, number>>({});
  const [localWaitingChats, setLocalWaitingChats] = useState<ChatSession[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notifiedSessionsRef = useRef<Set<string>>(new Set());

  // Admin kontrolü
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

  // WebSocket bağlantısı (Agent olarak)
  useEffect(() => {
    // user objesi henüz yüklenmemişse bekle
    if (!isAuthenticated || !user) {
      console.log('[AgentDashboard] Waiting for user...');
      return;
    }
    
    console.log('[AgentDashboard] User/auth state:', { 
      isAuthenticated, 
      userExists: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isConnected, 
      connectionStatus 
    });
    
    // user?.id yoksa user?.email kullan
    const userId = user?.id || user?.email;
    
    if (userId && !isConnected && connectionStatus === 'idle') {
      console.log('[AgentDashboard] Connecting as agent:', userId);
      connect(userId, 'agent');
    }
  }, [user?.id, user?.email, isAuthenticated, isConnected, connectionStatus, connect]);
  
  // Connection status değişikliklerini izle
  useEffect(() => {
    console.log('[AgentDashboard] Connection status changed:', connectionStatus);
  }, [connectionStatus]);
  
  // Agent requests değişikliklerini izle
  useEffect(() => {
    console.log('[AgentDashboard] agentRequests changed:', agentRequests);
  }, [agentRequests]);
  
  // Admin paneli açıldığında hemen waiting sessions çek
  useEffect(() => {
    console.log('[AgentDashboard] Initial fetch of waiting sessions');
    fetchWaitingSessions().then(() => {
      console.log('[AgentDashboard] fetchWaitingSessions completed');
    });
  }, []);

  // agentRequests değiştiğinde local waiting list'i güncelle
  useEffect(() => {
    const pendingRequests = agentRequests.filter(req => req.status === 'pending');
    
    const waitingChats: ChatSession[] = pendingRequests.map(req => {
      const createdAt = new Date(req.timestamp);
      const now = new Date();
      const waitingMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      
      return {
        sessionId: req.sessionId,
        customerId: req.customerId,
        customerName: req.customerName || 'Misafir Kullanıcı',
        customerEmail: req.customerEmail || '',
        status: 'waiting',
        createdAt: req.timestamp,
        messages: req.messages || [],
        unreadCount: 1,
        waitingMinutes // Bekleme süresi (dakika)
      };
    });

    setLocalWaitingChats(waitingChats);

    // Yeni talepler için bildirim göster
    waitingChats.forEach(chat => {
      if (!notifiedSessionsRef.current.has(chat.sessionId)) {
        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">🔔 Yeni Canlı Destek Talebi!</span>
            <span className="text-sm">{chat.customerName}</span>
          </div>,
          { duration: 8000 }
        );
        notifiedSessionsRef.current.add(chat.sessionId);
      }
    });
  }, [agentRequests]);

  // Yeni mesaj geldiğinde okunmamış sayısını güncelle
  useEffect(() => {
    activeSessions.forEach(session => {
      const sessionId = session.id || session.sessionId;
      const lastRead = lastReadCounts[sessionId] || 0;
      const totalMessages = session.messages.length;
      
      // Seçili session ise son okunanı güncelle ve okunmamışı sıfırla
      if (selectedSession?.sessionId === sessionId) {
        setLastReadCounts(prev => ({ ...prev, [sessionId]: totalMessages }));
        setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));
        return;
      }
      
      // Seçili değilse, son okunandan sonraki müşteri mesajlarını say
      if (totalMessages > lastRead) {
        // Son okunandan sonraki mesajları kontrol et
        const newMessages = session.messages.slice(lastRead);
        const customerNewMessages = newMessages.filter(m => m.sender !== 'agent').length;
        
        setUnreadCounts(prev => ({ 
          ...prev, 
          [sessionId]: customerNewMessages 
        }));
      }
    });
  }, [activeSessions, selectedSession, lastReadCounts]);

  // Seçili session'ın mesajlarını güncelle
  // NOT: messages dependency array'de YOK çünkü setMessages ile güncelleniyor
  // Bu infinite loop yapar!
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const sessionId = selectedSession.sessionId;
    console.log('[AgentDashboard] Updating messages for session:', sessionId);

    // activeSessions'da id field'i var, selectedSession'da sessionId var
    const session = activeSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
    
    console.log('[AgentDashboard] Found session:', session ? { id: session.id, msgCount: session.messages.length } : null);
    
    // Session'dan gelen mesajları formatla
    let allMessages: any[] = [];
    
    if (session && session.messages.length > 0) {
      const formattedSessionMessages = session.messages.map(msg => ({
        messageId: msg.id,
        sessionId: sessionId,
        senderId: msg.sender === 'agent' ? user?.id : selectedSession.customerId,
        senderType: msg.sender === 'agent' ? 'agent' : 'customer',
        content: msg.text,
        timestamp: msg.timestamp,
        isRead: true
      }));
      allMessages = [...formattedSessionMessages];
    }

    // Tarihe göre sırala
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log('[AgentDashboard] Total messages from session:', allMessages.length);
    setMessages(allMessages);
    
    // Seçili session'ın son okunan mesaj sayısını güncelle ve okunmamışı sıfırla
    if (session) {
      setLastReadCounts(prev => ({ ...prev, [sessionId]: session.messages.length }));
      setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));
    }
  }, [selectedSession, activeSessions, user?.id]);  // messages YOK!

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Periyodik olarak bekleyen session'ları kontrol et (mock mode'da polling)
  useEffect(() => {
    if (isMockMode) {
      const interval = setInterval(() => {
        fetchWaitingSessions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchWaitingSessions]);

  const handleAcceptChat = (session: ChatSession) => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      // Session'ı kabul et
      acceptRequest(session.sessionId, user.id, user?.name || 'Temsilci');
      
      toast.success(`${session.customerName} ile sohbet başlatıldı`);
      
      // Seçili session olarak ayarla
      setSelectedSession({
        ...session,
        status: 'active'
      });
      
      setActiveTab('active');
    } catch (error) {
      console.error('[AgentDashboard] Error accepting chat:', error);
      toast.error('Sohbet kabul edilirken hata oluştu');
    }
  };

  // Mevcut session'ın input değerini al
  const currentInput = selectedSession ? sessionInputs[selectedSession.sessionId] || '' : '';

  const handleSendMessage = () => {
    if (!currentInput.trim() || !selectedSession || !user?.id) {
      console.log('[AgentDashboard] Cannot send message:', { 
        hasInput: !!currentInput.trim(), 
        hasSession: !!selectedSession, 
        hasUser: !!user?.id 
      });
      return;
    }

    try {
      // Store üzerinden mesaj gönder
      sendAgentMessage(selectedSession.sessionId, currentInput.trim());

      // Local mesaj listesine ekle
      const newMessage = {
        messageId: `msg_${Date.now()}`,
        sessionId: selectedSession.sessionId,
        senderId: user.id,
        senderType: 'agent',
        content: currentInput.trim(),
        timestamp: new Date().toISOString(),
        isRead: true
      };

      setMessages(prev => [...prev, newMessage]);
      // Bu session'ın input'unu temizle
      setSessionInputs(prev => ({ ...prev, [selectedSession.sessionId]: '' }));
    } catch (error) {
      console.error('[AgentDashboard] Error sending message:', error);
      toast.error('Mesaj gönderilirken hata oluştu');
    }
  };

  const handleCloseChat = () => {
    if (!selectedSession) return;

    completeRequest(selectedSession.sessionId);
    toast.success('Sohbet sonlandırıldı');
    setSelectedSession(null);
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

  // Test talebi oluştur
  const createTestRequest = () => {
    const { requestAgent } = useLiveChatStore.getState();
    requestAgent({
      userId: `test_${Date.now()}`,
      userName: 'Test Müşteri',
      userEmail: 'test@musteri.com'
    });
    toast.success('Test talebi oluşturuldu!');
  };

  // Eski talepleri temizle
  const clearOldRequests = () => {
    // localStorage'daki mock sessions'ı temizle
    localStorage.removeItem('livechat_mock_sessions_v1');
    localStorage.removeItem('live-chat-storage');
    localStorage.removeItem('live-chat-storage-v2');
    
    toast.success('Eski talepler temizlendi! Sayfa yenileniyor...');
    
    // Sayfayı yenile
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
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
                <span className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  isConnected 
                    ? "text-green-600 bg-green-50 dark:bg-green-500/10" 
                    : "text-red-600 bg-red-50 dark:bg-red-500/10"
                )}>
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      isConnected ? "animate-ping bg-green-400" : "bg-red-400"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isConnected ? "bg-green-500" : "bg-red-500"
                    )}></span>
                  </span>
                  {isConnected ? 'Çevrimiçi' : 'Bağlantı Yok'}
                </span>
                {isMockMode && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    Mock Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Orta: İstatistikler */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Bekleyen</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{localWaitingChats.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Aktif</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{activeSessions.length}</span>
              </div>
            </div>
          </div>
          
          {/* Sağ: Test Butonu ve Temizle */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={clearOldRequests}
              className="hidden sm:flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Eski Talepleri Temizle
            </Button>
            <Button 
              size="sm" 
              onClick={createTestRequest}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/25"
            >
              <Plus className="w-4 h-4" />
              Test Talebi
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className={cn(
          "w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col absolute lg:relative z-10 h-full transition-transform",
          selectedSession ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}>
          {/* Tabs */}
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
                {localWaitingChats.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {localWaitingChats.length}
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
                {activeSessions.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {activeSessions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-hidden">
            {/* Bekleyen Liste */}
            {activeTab === 'waiting' && (
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2 pb-20">
                  {localWaitingChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <Inbox className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Bekleyen yok</p>
                      <p className="text-sm text-gray-400 mt-1">Yeni talepler burada görünecek</p>
                    </div>
                  ) : (
                    localWaitingChats.map((chat) => (
                      <div 
                        key={chat.sessionId}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => handleAcceptChat(chat)}
                      >
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
                                {chat.customerName}
                              </p>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {formatDuration(chat.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {chat.customerEmail || 'E-posta belirtilmemiş'}
                            </p>
                            {/* Bekleme süresi göstergesi */}
                            {chat.waitingMinutes !== undefined && (
                              <p className={cn(
                                "text-xs mt-1 font-medium",
                                chat.waitingMinutes >= 8 ? "text-red-600" : // 8+ dakika uyarı
                                chat.waitingMinutes >= 5 ? "text-orange-500" : // 5+ dakika dikkat
                                "text-gray-400"
                              )}>
                                ⏱️ {chat.waitingMinutes} dk bekliyor
                                {chat.waitingMinutes >= 8 && " (Timeout yakın!)"}
                              </p>
                            )}
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
                  {activeSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <CheckCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Aktif sohbet yok</p>
                      <p className="text-sm text-gray-400 mt-1">Müşteriler burada görünecek</p>
                    </div>
                  ) : (
                    activeSessions.map((session) => (
                      <div 
                        key={session.id}
                        className={cn(
                          "group relative bg-white dark:bg-gray-800 border rounded-2xl p-4 cursor-pointer transition-all duration-300 overflow-hidden",
                          selectedSession?.sessionId === session.id 
                            ? "border-orange-400 shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/20" 
                            : "border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-md"
                        )}
                        onClick={() => setSelectedSession({
                          sessionId: session.id,
                          customerId: session.customerId,
                          customerName: session.customerName,
                          customerEmail: session.customerEmail,
                          status: 'active',
                          createdAt: session.timestamp,
                          messages: session.messages,
                          unreadCount: 0
                        })}
                      >
                        {selectedSession?.sessionId === session.id && (
                          <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-400 to-amber-400 rounded-r-full"></div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-105",
                            selectedSession?.sessionId === session.id
                              ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/25"
                              : "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25"
                          )}>
                            <span className="text-lg font-bold text-white">
                              {(session.customerName || 'M').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {session.customerName}
                              </p>
                              <div className="flex items-center gap-2">
                                {/* Okunmamış mesaj bildirimi */}
                                {unreadCounts[session.id] > 0 && selectedSession?.sessionId !== session.id && (
                                  <span className="flex items-center gap-1 text-xs font-semibold bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                                    <MessageCircle className="w-3 h-3" />
                                    {unreadCounts[session.id]} yeni
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                  Aktif
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {formatDuration(session.timestamp)} süredir bağlı
                            </p>
                            {session.messages.length > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1.5 font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                {session.messages[session.messages.length - 1].text}
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
                      {selectedSession.customerName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="font-medium">{formatDuration(selectedSession.createdAt)} bağlı</span>
                    </div>
                    {selectedSession.customerEmail && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Mail className="w-3 h-3" />
                        <span>{selectedSession.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCloseChat}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl px-4"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Sonlandır
                </Button>
              </div>

              {/* Messages */}
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

              {/* Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      value={currentInput || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const sessionId = selectedSession?.sessionId;
                        if (sessionId) {
                          setSessionInputs(prev => ({ 
                            ...prev, 
                            [sessionId]: value 
                          }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Mesajınızı yazın..."
                      className="w-full bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-orange-400 dark:focus:border-orange-500 rounded-xl pr-12 h-12 transition-all"
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 rounded-xl px-6 h-12"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl"></div>
              </div>
              
              <div className="text-center px-4 relative z-10">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                    <Headphones className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-75"></div>
                </div>
                
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent mb-3">
                  Destek Paneline Hoş Geldiniz
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  Müşterilerinizle gerçek zamanlı iletişim kurun. Sol panelden bir sohbet seçin veya yeni bir talebi kabul edin.
                </p>
                
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[120px]">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{localWaitingChats.length}</span>
                    <span className="text-xs text-gray-400 font-medium">Bekleyen</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-[120px]">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-2">
                      <MessageCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{activeSessions.length}</span>
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
