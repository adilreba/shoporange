import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Users, Clock, CheckCircle, XCircle, 
  Send, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [messages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected] = useState(true);
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
      
      // Local store'da kabul et (status: active yap)
      acceptRequest(session.sessionId);
      
      // Listeden kaldır
      setWaitingChats(prev => prev.filter(c => c.sessionId !== session.sessionId));
      
      // Aktif chat'e ekle
      const activeSession = {
        id: session.sessionId,
        userId: session.customerId,
        userName: session.customerName || 'Misafir',
        userEmail: session.customerEmail || '',
        timestamp: session.createdAt,
        status: 'active' as const,
        messages: [],
      };
      
      const currentActive = useChatStore.getState().activeSessions;
      useChatStore.setState({
        activeSessions: [...currentActive, activeSession],
      });
      
      toast.success('Müşteri kabul edildi');
      setSelectedSession({ ...session, agentId: user.id, status: 'active' });
      setActiveTab('active');
    } catch (error) {
      console.error('Accept chat error:', error);
      toast.error('Müşteri kabul edilemedi');
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedSession) return;
    // TODO: Implement message sending via chat store
    toast.info('Mesaj gönderildi: ' + inputMessage);
    setInputMessage('');
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
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="flex flex-col gap-3">
          {/* Üst Satır: Logo + Başlık + Durum */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Canlı Destek Paneli</h1>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" /> Çevrimiçi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" /> Çevrimdışı
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Desktop: Kullanıcı bilgisi */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium">{user?.name || 'Temsilci'}</p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Alt Satır: Badge'ler + Test Butonu */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {waitingChats.length} Bekleyen
              </Badge>
              <Badge variant="default" className="gap-1 bg-orange-500">
                <MessageCircle className="w-3 h-3" />
                {activeChats.length} Aktif
              </Badge>
            </div>
            {/* Test Talep Oluştur Butonu */}
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
              className="ml-auto"
            >
              + Test Talebi Oluştur
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Chat List */}
        <div className={cn(
          "w-full lg:w-80 border-r bg-card flex flex-col absolute lg:relative z-10 h-full transition-transform",
          selectedSession ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="waiting" className="gap-2">
                Bekleyen
                {waitingChats.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{waitingChats.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                Aktif
                {activeChats.length > 0 && (
                  <Badge className="ml-1 bg-orange-500">{activeChats.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-2">
                  {waitingChats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Bekleyen müşteri yok</p>
                    </div>
                  ) : (
                    waitingChats.map((chat) => (
                      <Card 
                        key={chat.sessionId}
                        className="cursor-pointer hover:border-orange-500 transition-colors"
                        onClick={() => acceptChat(chat)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{chat.customerName || chat.customerId.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(chat.createdAt)} bekliyor
                              </p>
                              {chat.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {chat.lastMessage.content}
                                </p>
                              )}
                            </div>
                            <Button size="sm" className="gradient-orange">
                              Kabul Et
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="active" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-2">
                  {activeChats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aktif sohbet yok</p>
                    </div>
                  ) : (
                    activeChats.map((chat) => (
                      <Card 
                        key={chat.sessionId}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedSession?.sessionId === chat.sessionId 
                            ? "border-orange-500 bg-orange-50" 
                            : "hover:border-orange-300"
                        )}
                        onClick={() => setSelectedSession(chat)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{chat.customerName || chat.customerId.slice(0, 8)}</p>
                              <p className="text-xs text-green-600">Aktif</p>
                              {chat.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {chat.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col absolute lg:relative z-20 bg-background h-full w-full lg:w-auto transition-transform",
          selectedSession ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden -ml-2"
                    onClick={() => setSelectedSession(null)}
                  >
                    ←
                  </Button>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Müşteri #{selectedSession.customerName || selectedSession.customerId.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(selectedSession.createdAt)} süredir bağlı
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={closeChat}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Sonlandır
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.messageId}
                      className={cn(
                        'flex gap-3',
                        message.senderType === 'agent' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          message.senderType === 'agent'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          message.senderType === 'agent'
                            ? 'bg-orange-500 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        )}
                      >
                        <p>{message.content}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          message.senderType === 'agent' ? 'text-orange-100' : 'text-gray-500'
                        )}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4 bg-card">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') sendMessage();
                    }}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} className="gradient-orange">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Sohbet seçin veya yeni müşteri kabul edin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
