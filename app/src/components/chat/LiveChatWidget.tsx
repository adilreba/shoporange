/**
 * Live Chat Widget - Customer Side
 * Bot entegrasyonu ve canlı destek talebi için modern chat widget
 */

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X,
  Bot,
  CheckCheck,
  Sparkles,
  Headphones,
  ChevronRight,
  Package,
  Truck,
  RefreshCcw,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useLiveChatStore } from '@/stores/liveChatStore';

// Hızlı yanıt seçenekleri
interface QuickReply {
  id: string;
  label: string;
  icon: React.ReactNode;
  response: string;
}

const quickReplies: QuickReply[] = [
  { 
    id: 'order', 
    label: 'Sipariş Takibi', 
    icon: <Package className="w-4 h-4" />,
    response: 'Siparişinizi takip etmek için sipariş numaranızı paylaşabilir misiniz?'
  },
  { 
    id: 'cargo', 
    label: 'Kargo Takibi', 
    icon: <Truck className="w-4 h-4" />,
    response: 'Kargonuzun durumunu öğrenmek için takip numaranızı yazabilirsiniz.'
  },
  { 
    id: 'return', 
    label: 'İade/Değişim', 
    icon: <RefreshCcw className="w-4 h-4" />,
    response: 'İade veya değişim işlemi için sipariş numaranızı ve ürün bilgisini paylaşın.'
  },
  { 
    id: 'payment', 
    label: 'Ödeme', 
    icon: <CreditCard className="w-4 h-4" />,
    response: 'Ödeme seçeneklerimiz hakkında bilgi almak için hangi konuda yardımcı olabilirim?'
  },
];

export function LiveChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    messages,
    isChatOpen,
    unreadCount,
    isBotTyping,
    agentConnected,
    agentName,
    waitingForAgent,
    queuePosition,
    isConnected,
    connectionStatus,
    setChatOpen,
    sendMessage,
    resetChat,
    requestAgent,
    connect
  } = useLiveChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // İlk açılışta hoşgeldin mesajı
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      // Bot hoşgeldin mesajı
      const welcomeMessage = {
        id: `welcome_${Date.now()}`,
        text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Ben yapay zeka asistanınızım. Size nasıl yardımcı olabilirim?',
        sender: 'bot' as const,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      
      useLiveChatStore.setState((state) => ({
        messages: [...state.messages, welcomeMessage]
      }));
    }
  }, [isChatOpen, messages.length]);

  // WebSocket bağlantı durumunu logla
  useEffect(() => {
    console.log('[LiveChatWidget] Connection status:', connectionStatus);
  }, [connectionStatus]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    
    sendMessage(inputMessage.trim());
    setInputMessage('');
    setShowQuickReplies(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.label);
    setShowQuickReplies(false);
  };

  const handleRequestAgent = () => {
    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      return;
    }

    const userId = user.id || `guest_${Date.now()}`;
    const userName = user.name || 'Misafir Kullanıcı';
    const userEmail = user.email || 'misafir@atushome.com';

    // Önce bağlan
    if (!isConnected) {
      connect(userId, 'customer');
    }

    // Sonra agent iste
    setTimeout(() => {
      requestAgent({
        userId,
        userName,
        userEmail
      });
      toast.success('Canlı destek talebiniz alındı!');
    }, 500);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Son mesaj bot tarafından sonlandırıldı mı kontrol et
  const isChatClosed = messages.length > 0 && 
    messages[messages.length - 1].text?.includes('sonlandırıldı');

  return (
    <>
      {/* Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
            "bg-gradient-to-br from-orange-500 to-orange-600",
            "hover:from-orange-400 hover:to-orange-500",
            "text-white shadow-lg shadow-orange-500/30",
            "flex items-center justify-center",
            "transition-all duration-300 hover:scale-110",
            "border-2 border-white/20"
          )}
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className={cn(
              "text-white px-5 py-4",
              agentConnected 
                ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                : "bg-gradient-to-r from-orange-500 to-orange-600"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    {agentConnected ? (
                      <Headphones className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {agentConnected ? (agentName || 'Müşteri Temsilcisi') : 'AtusHome Asistan'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                      {connectionStatus === 'connected' ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                          </span>
                          <span>{agentConnected ? 'Şu an çevrimiçi' : 'AI Asistan - Çevrimiçi'}</span>
                        </>
                      ) : connectionStatus === 'connecting' ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                          <span>Bağlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          <span>Bağlantı yok</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      resetChat();
                      setChatOpen(false);
                    }}
                    className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto bg-gray-50/50 p-4 space-y-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2',
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar */}
                  {msg.sender !== 'user' && (
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      msg.sender === 'agent' 
                        ? 'bg-blue-100 text-blue-600' 
                        : msg.sender === 'system'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-orange-100 text-orange-600'
                    )}>
                      {msg.sender === 'agent' ? (
                        <Headphones className="w-4 h-4" />
                      ) : msg.sender === 'system' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    'max-w-[75%]',
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-br-md'
                        : msg.sender === 'agent'
                        ? 'bg-blue-500 text-white rounded-bl-md'
                        : msg.sender === 'system'
                        ? 'bg-gray-100 text-gray-700 rounded-bl-md border border-gray-200'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                    )}>
                      <p>{msg.text}</p>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-[10px]',
                      msg.sender === 'user' ? 'text-gray-400 justify-end' : 'text-gray-400'
                    )}>
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.sender === 'user' && (
                        <CheckCheck className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isBotTyping && !agentConnected && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for Agent */}
              {waitingForAgent && !agentConnected && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span>
                      {queuePosition === 1 
                        ? 'Sıranız geldi, temsilci atanması bekleniyor...' 
                        : `Önünüzde ${queuePosition} kişi var...`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {showQuickReplies && !agentConnected && !waitingForAgent && !isChatClosed && (
              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-medium">Sıkça Sorulanlar:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium",
                        "bg-orange-50 text-orange-700",
                        "hover:bg-orange-100",
                        "transition-colors border border-orange-200"
                      )}
                    >
                      {reply.icon}
                      <span>{reply.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Request Agent Button */}
            {!agentConnected && !waitingForAgent && !isChatClosed && (
              <div className="px-4 py-2 bg-gray-50/50">
                <button
                  onClick={handleRequestAgent}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                    "hover:from-blue-600 hover:to-blue-700",
                    "transition-all text-xs font-medium shadow-md"
                  )}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Canlı Temsilciyle Görüş</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* New Chat Button (when chat closed) */}
            {isChatClosed && (
              <div className="px-4 py-2 bg-gray-50/50">
                <button
                  onClick={() => {
                    resetChat();
                    setShowQuickReplies(true);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-green-500 to-green-600 text-white",
                    "hover:from-green-600 hover:to-green-700",
                    "transition-all text-xs font-medium shadow-md"
                  )}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Yeni Sohbet Başlat</span>
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isChatClosed}
                  className="flex-1 h-10 bg-gray-100 border-0 rounded-full px-4 text-sm focus-visible:ring-orange-500 disabled:opacity-50"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isChatClosed}
                  className="h-10 w-10 p-0 bg-orange-500 hover:bg-orange-600 rounded-full disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-center text-[10px] text-gray-400 mt-2">
                {agentConnected 
                  ? `${agentName} ile görüşüyorsunuz` 
                  : 'AtusHome AI Asistan • 7/24 Hizmetinizde'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveChatWidget;
