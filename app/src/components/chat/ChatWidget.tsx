import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X,
  Bot,
  User,
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
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services/api';

// Mesaj tipi
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  isRead?: boolean;
}

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

// Bot otomatik yanıtları
const botResponses: Record<string, string> = {
  'merhaba': 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
  'selam': 'Selam! 👋 Size nasıl yardımcı olabilirim?',
  'nasılsın': 'Teşekkür ederim, ben bir yapay zeka asistanıyım ve size yardımcı olmak için buradayım! 😊',
  'sipariş': 'Siparişinizle ilgili yardımcı olmaktan memnuniyet duyarım. Lütfen sipariş numaranızı paylaşın.',
  'kargo': 'Kargo takibi için takip numaranızı yazabilir veya sipariş numaranızı paylaşabilirsiniz.',
  'iade': 'İade işlemleri için ürünü orijinal ambalajında, faturasıyla birlikte göndermeniz gerekmektedir. İade süreci hakkında detaylı bilgi almak ister misiniz?',
  'değişim': 'Değişim işlemi için ürünü orijinal ambalajında göndermeniz gerekiyor. Yeni ürünü size ücretsiz kargolayacağız.',
  'şifre': 'Şifrenizi sıfırlamak için "Şifremi Unuttum" sayfasını kullanabilir veya e-posta adresinizi paylaşabilirsiniz.',
  'ödeme': 'Kredi kartı, banka havalesi ve kapıda ödeme seçeneklerimiz bulunmaktadır. Taksit seçenekleri için bilgi almak ister misiniz?',
  'kupon': 'Aktif kuponlarımızı görmek için Kampanyalar sayfamızı ziyaret edebilirsiniz. Size özel bir kupon kodu: ATUS10',
  'teşekkür': 'Rica ederim! 😊 Başka bir konuda yardımcı olabilir miyim?',
  'sağol': 'Rica ederim! Yardımcı olabileceğim başka bir konu var mı?',
  'görüşürüz': 'Görüşmek üzere! 👋 AtusHome\'u tercih ettiğiniz için teşekkür ederiz. İyi günler dileriz!',
  'bay': 'Hoşça kalın! 👋 Size yardımcı olmaktan memnuniyet duyduk.',
};

// Bot yanıtı bul
const findBotResponse = (message: string): string | null => {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const [key, response] of Object.entries(botResponses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  const defaultResponses = [
    'Anladım, konuyu netleştirmek için bir temsilcimiz size yardımcı olabilir. Temsilciye bağlanmak ister misiniz?',
    'Bu konuda size daha detaylı yardımcı olmak için canlı destek temsilcimizle görüşebilirsiniz. Bağlanmak ister misiniz?',
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// LocalStorage'dan pozisyon oku
const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem('chatWidgetYPosition');
    if (saved) {
      return parseInt(saved, 10);
    }
  } catch (e) {
    console.error('Position read error:', e);
  }
  return null;
};

// LocalStorage'a pozisyon kaydet
const savePosition = (y: number) => {
  try {
    localStorage.setItem('chatWidgetYPosition', y.toString());
  } catch (e) {
    console.error('Position save error:', e);
  }
};

export function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  
  // Admin panelinde (/admin) chat widget'ı gösterme
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdminPage) return null;
  const { 
    requestAgent: storeRequestAgent, 
    addCustomerMessage: storeAddCustomerMessage,
  } = useChatStore();
  
  // Store'dan agent durumunu takip et
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // Y ekseninde pozisyon (varsayılan: orta)
  const [positionY, setPositionY] = useState(() => {
    const saved = getSavedPosition();
    if (saved) return saved;
    return typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // İlk mesajı göster
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Store'dan gelen mesajları izle (gerçek zamanlı senkronizasyon)
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      // Agent bağlandı mı kontrol et
      if (state.agentName && !prevState.agentName) {
        setIsAgentConnected(true);
        setIsAgentMode(true);
      }
      
      // Sadece mesajlar değiştiğinde çalış
      if (state.messages !== prevState.messages) {
        const agentMsgs = state.messages.filter(m => m.sender === 'agent');
        
        if (agentMsgs.length > 0) {
          setMessages(prev => {
            // Önceki mesajlarda olmayan agent mesajlarını bul
            const newMsgs = agentMsgs.filter(am => 
              !prev.some(pm => pm.id === am.id)
            );
            
            if (newMsgs.length === 0) return prev;
            
            // Yeni mesajları formatlayıp ekle
            const formatted: Message[] = newMsgs.map(m => ({
              id: m.id,
              text: m.text,
              sender: 'agent',
              timestamp: new Date(m.timestamp),
            }));
            
            // Toast bildirim (chat kapalıysa)
            if (!isOpen) {
              setUnreadCount(c => c + 1);
            }
            
            return [...prev, ...formatted];
          });
        }
      }
    });
    
    // Cross-tab sync: Diğer sekmelerden gelen mesajları dinle
    const handleChatMessage = (event: CustomEvent) => {
      if (event.detail.requestId === currentRequestId && event.detail.message.sender === 'agent') {
        // Admin mesaj gönderdi, göster
        setMessages(prev => {
          if (prev.some(m => m.id === event.detail.message.id)) return prev;
          return [...prev, {
            id: event.detail.message.id,
            text: event.detail.message.text,
            sender: 'agent',
            timestamp: new Date(event.detail.message.timestamp),
          }];
        });
      }
    };
    
    window.addEventListener('chat-message', handleChatMessage as EventListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('chat-message', handleChatMessage as EventListener);
    };
  }, [isOpen, currentRequestId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Sürükleme olayları
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    
    setIsDragging(true);
    setDragStartY(e.clientY - positionY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartY(touch.clientY - positionY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newY = e.clientY - dragStartY;
      
      // Ekran sınırları (butonun ortası için)
      const buttonHeight = 56; // w-14 h-14 = 56px
      const minY = buttonHeight / 2;
      const maxY = window.innerHeight - buttonHeight / 2;
      
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      setPositionY(clampedY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const newY = touch.clientY - dragStartY;
      
      const buttonHeight = 56;
      const minY = buttonHeight / 2;
      const maxY = window.innerHeight - buttonHeight / 2;
      
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      setPositionY(clampedY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(positionY);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragStartY, positionY]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setShowQuickReplies(false);
    
    // Agent bağlandıysa veya agent modundaysa, mesajı session'a ekle (admin görsün)
    if ((isAgentMode || isAgentConnected) && currentRequestId) {
      storeAddCustomerMessage(currentRequestId, userMessage.text);
      return; // Agent modunda bot yanıt vermesin
    }
    
    setIsTyping(true);
    setTimeout(() => {
      // Agent bağlandı mı tekrar kontrol et (gecikme sırasında bağlanmış olabilir)
      if (isAgentConnected) {
        setIsTyping(false);
        return;
      }
      
      const botResponse = findBotResponse(userMessage.text);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botResponse || 'Size yardımcı olmak için buradayım.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: reply.label,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowQuickReplies(false);
    
    // Agent bağlandıysa veya agent modundaysa, mesajı session'a ekle
    if ((isAgentMode || isAgentConnected) && currentRequestId) {
      storeAddCustomerMessage(currentRequestId, reply.label);
      return;
    }
    
    setIsTyping(true);

    setTimeout(() => {
      // Agent bağlandı mı kontrol et
      if (isAgentConnected) {
        setIsTyping(false);
        return;
      }
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: reply.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const requestAgent = () => {
    setIsTyping(true);
    
    // Request ID oluştur
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId);
    
    // Chat store'a agent isteği gönder
    const userId = isAuthenticated && user ? user.id : `guest_${Date.now()}`;
    const userName = isAuthenticated && user ? user.name : 'Misafir Kullanıcı';
    const userEmail = isAuthenticated && user ? user.email : 'misafir@atushome.com';
    
    // Local store'a kaydet
    storeRequestAgent({
      userId,
      userName,
      userEmail,
    });
    
    // AWS API'ye de gönder (gerçek bildirim için)
    chatApi.requestAgent({
      userId,
      userName,
      userEmail,
    }).catch(error => {
      console.log('AWS API error (mock mode da olabilir):', error);
      // Hata olsa bile local store'da çalışmaya devam et
    });
    
    setTimeout(() => {
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        text: 'Bir temsilcimiz en kısa sürede sizinle ilgilenecektir. Lütfen bekleyin... 🕐',
        sender: 'agent',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, agentMessage]);
      setIsAgentMode(true);
      setIsTyping(false);
      toast.success('Canlı destek talebiniz alındı. Temsilcimiz en kısa sürede bağlanacak.');
    }, 1000);
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickReplies(true);
    setIsAgentMode(false);
    toast.info('Sohbet temizlendi');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Giriş yapmamış kullanıcılar için chat butonunu gösterme
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Arkaplan overlay - çok hafif şeffaf */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Ana Container */}
      <div className="fixed right-0 top-0 h-full z-50 pointer-events-none">
        {/* Kapalı durum - Sadece 💬 ikonu, sağda sürüklenebilir */}
        {!isOpen && (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(true)}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ 
              position: 'absolute',
              right: 0,
              top: `${positionY}px`,
              transform: 'translateY(-50%)'
            }}
            className={cn(
              "w-14 h-14 flex items-center justify-center",
              "bg-gradient-to-br from-orange-400/70 to-orange-500/70",
              "hover:from-orange-400/90 hover:to-orange-500/90",
              "text-white rounded-l-2xl shadow-lg",
              "pointer-events-auto",
              "transition-all duration-200",
              isDragging ? "cursor-grabbing scale-110 shadow-orange-500/50" : "cursor-grab hover:scale-105"
            )}
          >
            <div className="relative">
              <MessageCircle className="w-7 h-7" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Açık durum - Sağdan slide panel */}
        <div
          className={cn(
            "h-full bg-white dark:bg-gray-900 shadow-2xl pointer-events-auto",
            "transition-transform duration-300 ease-out",
            "flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full",
            "w-[380px] max-w-[100vw]"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {isAgentMode ? (
                    <Headphones className="w-6 h-6" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base">
                    {isAgentMode ? 'Müşteri Temsilcisi' : 'AtusHome Asistan'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span>{isAgentMode ? 'Şu an çevrimiçi' : 'AI Asistan - Çevrimiçi'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9"
                  title="Sohbeti Temizle"
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mesajlar Alanı */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.sender === 'user' 
                      ? 'bg-orange-100 text-orange-600' 
                      : message.sender === 'agent'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  )}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : message.sender === 'agent' ? (
                      <Headphones className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Mesaj Balonu */}
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-md'
                      : message.sender === 'agent'
                      ? 'bg-blue-500 text-white rounded-bl-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  )}>
                    <p>{message.text}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1.5 text-xs',
                      message.sender === 'user' ? 'text-orange-100' : 'text-gray-400'
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.sender === 'user' && (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Yazıyor animasyonu */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hızlı Yanıtlar */}
            {showQuickReplies && !isTyping && (
              <div className="px-4 pb-3 flex-shrink-0">
                <p className="text-xs text-gray-500 mb-2 font-medium">Sıkça Sorulanlar:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium",
                        "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
                        "hover:bg-orange-100 dark:hover:bg-orange-900/30",
                        "transition-colors border border-orange-200 dark:border-orange-800"
                      )}
                    >
                      {reply.icon}
                      <span>{reply.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Temsilci bağlanma butonu */}
            {!isAgentMode && !isTyping && (
              <div className="px-4 pb-3 flex-shrink-0">
                <button
                  onClick={requestAgent}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3 rounded-xl",
                    "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                    "hover:from-blue-600 hover:to-blue-700",
                    "transition-all text-sm font-medium shadow-lg shadow-blue-500/25"
                  )}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Canlı Temsilciyle Görüş</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Input Alanı */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Mesajınızı yazın..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
              />
              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                className={cn(
                  "h-11 px-4 bg-orange-500 hover:bg-orange-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              AtusHome AI Asistan • 7/24 Hizmetinizde
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
