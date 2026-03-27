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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const API_URL = import.meta.env.VITE_API_URL || 'https://ovlm4mc2b8.execute-api.eu-west-1.amazonaws.com/prod';

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
  const [activeTab, setActiveTab] = useState('active');
  const [waitingChats, setWaitingChats] = useState<ChatSession[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is admin/agent
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Check admin role
    const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
    if (!isAdmin) {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Connect WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = import.meta.env.VITE_CHAT_WS_URL || 'wss://your-api.execute-api.eu-west-1.amazonaws.com/prod';
    const url = new URL(wsUrl);
    url.searchParams.append('userId', user.id);
    url.searchParams.append('userType', 'agent');

    const newWs = new WebSocket(url.toString());

    newWs.onopen = () => {
      console.log('Agent WebSocket connected');
      setIsConnected(true);
      toast.success('Canlı destek sistemine bağlandınız');
    };

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    newWs.onclose = () => {
      console.log('Agent WebSocket disconnected');
      setIsConnected(false);
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Bağlantı hatası');
    };

    setWs(newWs);

    return () => {
      newWs.close();
    };
  }, [user?.id]);

  // Poll for waiting chats
  useEffect(() => {
    fetchWaitingChats();
    fetchActiveChats();

    const interval = setInterval(() => {
      fetchWaitingChats();
      fetchActiveChats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchWaitingChats = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/waiting`);
      const data = await response.json();
      if (data.success) {
        setWaitingChats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch waiting chats:', error);
    }
  };

  const fetchActiveChats = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/chat/agent/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setActiveChats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch active chats:', error);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/chat/${sessionId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_waiting_customer':
        toast.info('Yeni müşteri bekliyor!');
        fetchWaitingChats();
        break;

      case 'new_message':
        if (selectedSession?.sessionId === data.message.sessionId) {
          setMessages(prev => [...prev, data.message]);
          // Mark as read
          ws?.send(JSON.stringify({
            action: 'mark_read',
            messageIds: [data.message.messageId],
            sessionId: selectedSession?.sessionId
          }));
        } else {
          // Increment unread count
          toast.info('Yeni mesaj var');
          fetchActiveChats();
        }
        break;

      case 'typing':
        if (selectedSession?.sessionId && data.userType === 'customer') {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
        break;

      case 'chat_closed':
        toast.info('Sohbet sonlandırıldı');
        setSelectedSession(null);
        fetchActiveChats();
        break;
    }
  };

  const acceptChat = async (session: ChatSession) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/chat/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          agentId: user.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Müşteri kabul edildi');
        fetchWaitingChats();
        fetchActiveChats();
        setSelectedSession({ ...session, agentId: user.id, status: 'active' });
        fetchMessages(session.sessionId);
        setActiveTab('active');

        // Reconnect WebSocket with session
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'join_session',
            sessionId: session.sessionId
          }));
        }
      }
    } catch (error) {
      toast.error('Müşteri kabul edilemedi');
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedSession || !ws) return;

    ws.send(JSON.stringify({
      action: 'send_message',
      message: inputMessage.trim(),
      sessionId: selectedSession.sessionId
    }));

    setInputMessage('');
  };

  const handleTyping = () => {
    if (!selectedSession || !ws) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    ws.send(JSON.stringify({
      action: 'typing',
      sessionId: selectedSession.sessionId
    }));

    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const closeChat = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`${API_URL}/chat/${selectedSession.sessionId}/close`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Sohbet sonlandırıldı');
        setSelectedSession(null);
        fetchActiveChats();
      }
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
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Canlı Destek Paneli</h1>
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

          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium">{user?.name || 'Temsilci'}</p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
              </div>
            </div>
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
                              <p className="font-medium truncate">{chat.customerId.slice(0, 8)}</p>
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
                        onClick={() => {
                          setSelectedSession(chat);
                          fetchMessages(chat.sessionId);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{chat.customerId.slice(0, 8)}</p>
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
                    <p className="font-medium">Müşteri #{selectedSession.customerId.slice(0, 8)}</p>
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

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
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
                      else handleTyping();
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
