import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X,
  Bot,
  CheckCheck,
  Sparkles,
  Headphones,
  Package,
  Smile,
  Image as ImageIcon,
  Mic,
  Mail,
  Paperclip,
  ChevronDown,
  ShoppingBag,
  XCircle
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
  type?: 'text' | 'image' | 'voice' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
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
    label: 'Siparişim nerede ?', 
    icon: <Package className="w-3 h-3" />,
    response: 'Siparişinizi takip etmek için sipariş numaranızı paylaşabilir misiniz?'
  },
  { 
    id: 'support', 
    label: 'Destek Sıkça Sorulan Sorular', 
    icon: <Headphones className="w-3 h-3" />,
    response: 'Size nasıl yardımcı olabilirim? İade, değişim, ödeme seçenekleri veya diğer konularda bilgi alabilirsiniz.'
  },
  { 
    id: 'campaign', 
    label: 'Güncel Kampanya', 
    icon: <ShoppingBag className="w-3 h-3" />,
    response: 'Güncel kampanya ve indirimler hakkında en doğru ve güncel bilgilere ulaşmak için size yardımcı olabilirim.'
  },
];

// Bot otomatik yanıtları
const botResponses: Record<string, string> = {
  'merhaba': 'Merhaba! 👋 Ben AtusHome Yapay Zeka alışveriş asistanınızım 😊 Size nasıl yardımcı olabilirim?',
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

// Emoji kategorileri
interface EmojiCategory {
  name: string;
  emojis: string[];
}

const emojiCategories: EmojiCategory[] = [
  { name: 'Sık Kullanılan', emojis: ['😊', '👋', '😂', '❤️', '👍', '🎉', '🔥', '👏'] },
  { name: 'Yüzler', emojis: ['😍', '🤔', '😢', '😡', '😴', '😎', '🤗', '😘', '🙄', '😬'] },
  { name: 'İşaretler', emojis: ['👌', '🙏', '💪', '✌️', '👆', '👇', '✋', '👊', '🤝', '💅'] },
  { name: 'Nesneler', emojis: ['✨', '🎁', '📦', '🚚', '💰', '🛍️', '🏠', '🛋️', '📱', '💻'] },
  { name: 'Yiyecek', emojis: ['☕', '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🎂', '🍰'] },
  { name: 'Doğa', emojis: ['🌟', '⭐', '☀️', '🌙', '⚡', '🔥', '💧', '🌈', '🌸', '🌺'] },
];

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

export function ModernChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    requestAgent: storeRequestAgent, 
    addCustomerMessage: storeAddCustomerMessage,
  } = useChatStore();
  
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // Yeni özellikler
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // İlk mesajı göster
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: 'Merhaba, ben AtusHome Yapay Zeka alışveriş asistanınızım 😊 Size nasıl yardımcı olabilirim?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Store'dan gelen mesajları izle
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      if (state.agentName && !prevState.agentName) {
        setIsAgentConnected(true);
        setIsAgentMode(true);
      }
      
      if (state.messages !== prevState.messages) {
        const agentMsgs = state.messages.filter(m => m.sender === 'agent');
        
        if (agentMsgs.length > 0) {
          setMessages(prev => {
            const newMsgs = agentMsgs.filter(am => 
              !prev.some(pm => pm.id === am.id)
            );
            
            if (newMsgs.length === 0) return prev;
            
            const formatted: Message[] = newMsgs.map(m => ({
              id: m.id,
              text: m.text,
              sender: 'agent',
              timestamp: new Date(m.timestamp),
            }));
            
            if (!isOpen) {
              setUnreadCount(c => c + 1);
            }
            
            return [...prev, ...formatted];
          });
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isOpen]);

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

  // Ses kaydı süresi
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Emoji picker dışına tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage.trim() || (selectedImage ? '📷 Görsel gönderildi' : ''),
      sender: 'user',
      timestamp: new Date(),
      type: selectedImage ? 'image' : 'text',
      attachmentUrl: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setSelectedImage(null);
    setShowQuickReplies(false);
    setShowEmojiPicker(false);
    
    if ((isAgentMode || isAgentConnected) && currentRequestId) {
      storeAddCustomerMessage(currentRequestId, userMessage.text);
      return;
    }
    
    setIsTyping(true);
    setTimeout(() => {
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
    
    if ((isAgentMode || isAgentConnected) && currentRequestId) {
      storeAddCustomerMessage(currentRequestId, reply.label);
      return;
    }
    
    setIsTyping(true);

    setTimeout(() => {
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

  const handleEmojiClick = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Görsel boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowAttachmentMenu(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    toast.info('Ses kaydı başladı...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    const voiceMessage: Message = {
      id: `user-${Date.now()}`,
      text: '🎤 Ses mesajı',
      sender: 'user',
      timestamp: new Date(),
      type: 'voice',
    };
    
    setMessages((prev) => [...prev, voiceMessage]);
    setShowQuickReplies(false);
    
    toast.success('Ses mesajı gönderildi');
  };

  const requestAgent = () => {
    setIsTyping(true);
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId);
    
    const userId = isAuthenticated && user ? user.id : `guest_${Date.now()}`;
    const userName = isAuthenticated && user ? user.name : 'Misafir Kullanıcı';
    const userEmail = isAuthenticated && user ? user.email : 'misafir@atushome.com';
    
    storeRequestAgent({
      userId,
      userName,
      userEmail,
    });
    
    chatApi.requestAgent({
      userId,
      userName,
      userEmail,
    }).catch(error => {
      console.log('AWS API error:', error);
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
      toast.success('Canlı destek talebiniz alındı.');
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
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
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header - TURUNCU TEMA */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    {isAgentMode ? (
                      <Headphones className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {isAgentMode ? 'Müşteri Temsilcisi' : 'AtusHome Yapay Zeka'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                      </span>
                      <span>Çevrimiçi</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 rounded-full"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto bg-gray-50/50 p-4 space-y-4"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar */}
                  {message.sender !== 'user' && (
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      message.sender === 'agent'
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-orange-100 text-orange-600'
                    )}>
                      {message.sender === 'agent' ? (
                        <Headphones className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    'max-w-[75%]',
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-br-md'
                        : message.sender === 'agent'
                        ? 'bg-blue-500 text-white rounded-bl-md'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                    )}>
                      {/* Image attachment */}
                      {message.type === 'image' && message.attachmentUrl && (
                        <div className="mb-2">
                          <img 
                            src={message.attachmentUrl} 
                            alt="Gönderilen görsel" 
                            className="max-w-full rounded-lg max-h-48 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Voice message */}
                      {message.type === 'voice' && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-white/80 rounded-full" />
                          </div>
                          <span className="text-xs">0:15</span>
                        </div>
                      )}
                      
                      <p>{message.text}</p>
                    </div>
                    
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-[10px]',
                      message.sender === 'user' ? 'text-gray-400 justify-end' : 'text-gray-400'
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.sender === 'user' && (
                        <CheckCheck className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {showQuickReplies && !isTyping && (
              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs",
                        "bg-white text-gray-700 border border-gray-200",
                        "hover:border-orange-300 hover:text-orange-600",
                        "transition-all shadow-sm"
                      )}
                    >
                      {reply.icon}
                      <span>{reply.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Request Button */}
            {!isAgentMode && !isTyping && (
              <div className="px-4 py-2 bg-gray-50/50">
                <button
                  onClick={requestAgent}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
                    "hover:from-orange-400 hover:to-orange-500",
                    "transition-all text-xs font-medium shadow-md shadow-orange-500/20"
                  )}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Canlı Temsilciyle Görüş</span>
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {/* Selected Image Preview */}
              {selectedImage && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={selectedImage} 
                    alt="Seçilen görsel" 
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Recording Indicator */}
              {isRecording && (
                <div className="mb-3 flex items-center gap-3 px-4 py-2 bg-red-50 rounded-xl">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-600 text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
                  <button
                    onClick={stopRecording}
                    className="ml-auto px-3 py-1 bg-red-500 text-white text-xs rounded-full"
                  >
                    Gönder
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {/* Emoji Button */}
                <div className="relative" ref={emojiPickerRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                      "h-9 w-9 rounded-full transition-colors",
                      showEmojiPicker 
                        ? "text-orange-600 bg-orange-50" 
                        : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                    )}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  
                  {/* Modern Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <span className="text-sm font-medium text-gray-700">Emojiler</span>
                        <button 
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Category Tabs */}
                      <div className="flex gap-1 px-2 py-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                        {emojiCategories.map((cat, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveEmojiCategory(idx)}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors",
                              activeEmojiCategory === idx
                                ? "bg-orange-100 text-orange-600 font-medium"
                                : "text-gray-500 hover:bg-gray-100"
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* Emoji Grid */}
                      <div className="p-3 grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto">
                        {emojiCategories[activeEmojiCategory].emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleEmojiClick(emoji)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-orange-50 rounded-lg text-xl transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Attachment Button */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={cn(
                      "h-9 w-9 rounded-full transition-colors",
                      showAttachmentMenu
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                    )}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  
                  {/* Attachment Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 py-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 min-w-[160px]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-orange-500" />
                        <span>Fotoğraf</span>
                      </button>
                      <button
                        onClick={() => {
                          toast.info('Mail gönderme özelliği yakında!');
                          setShowAttachmentMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span>E-posta</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {/* Text Input */}
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Bir mesaj gönder..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-10 bg-gray-100 border-0 rounded-full px-4 text-sm focus-visible:ring-orange-500 focus-visible:ring-offset-0"
                />
                
                {/* Voice or Send Button */}
                {inputMessage.trim() || selectedImage ? (
                  <Button
                    onClick={handleSend}
                    className="h-10 w-10 p-0 bg-orange-500 hover:bg-orange-600 rounded-full"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startRecording}
                    className="h-10 w-10 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </div>
              
              <p className="text-center text-[10px] text-gray-400 mt-2">
                AtusHome AI Asistan • 7/24 Hizmetinizde
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
