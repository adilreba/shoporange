import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, User, Bot, X, ChevronLeft, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chatStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const { messages, isOpen, unreadCount, isTyping, setIsOpen, addMessage, clearChat } = useChatStore();
  const [inputMessage, setInputMessage] = useState('');
  const [position, setPosition] = useState<{ y: number | null }>({ y: null }); // null = başlangıç (bottom: 20px)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0 });
  const [hasDragged, setHasDragged] = useState(false); // Click vs drag ayırt etmek için
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Sürükleme başladığında
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return;
    
    setIsDragging(true);
    setHasDragged(false);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const button = buttonRef.current;
    
    if (button) {
      const rect = button.getBoundingClientRect();
      // Eğer henüz sürüklenmediyse (position.y null), gerçek top değerini kullan
      const currentY = position.y === null ? rect.top : position.y;
      setDragStart({ y: clientY - currentY });
      // Pozisyonu senkronize et
      if (position.y === null) {
        setPosition({ y: rect.top });
      }
    }
  };

  // Sürükleme devam ederken
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newY = clientY - dragStart.y;
      
      // Sürüklediğini işaretle (click olayını engellemek için)
      setHasDragged(true);
      
      // Ekran sınırları içinde tut
      const minY = 100; // Header'dan aşağıda
      const maxY = window.innerHeight - 150; // Footer'dan yukarıda
      
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      setPosition({ y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    
    addMessage(inputMessage.trim(), 'user');
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat();
    toast.info('Sohbet geçmişi temizlendi');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Quick reply buttons
  const quickReplies = [
    'Sipariş takibi',
    'Kargo bilgisi',
    'İade/Değişim',
    'Ödeme seçenekleri',
  ];

  // KAPALI DURUM - Sürüklenebilir yarım daire buton
  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={() => {
          if (!hasDragged) {
            setIsOpen(true);
          }
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ 
          top: position.y !== null ? position.y : 'auto', 
          bottom: position.y !== null ? 'auto' : '20px'
        }}
        className={cn(
          "fixed right-0 z-50 w-12 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-l-2xl shadow-lg hover:shadow-xl flex flex-col items-center justify-center",
          isDragging ? "cursor-grabbing shadow-2xl scale-105 transition-none" : "cursor-grab hover:translate-x-0.5 transition-all duration-200"
        )}
        title="Canlı Destek - Sürüklemek için tutun"
      >
        {/* Grip göstergesi */}
        <GripVertical className="w-3 h-3 text-white/50 absolute left-1" />
        
        {unreadCount > 0 ? (
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] h-5 w-5 flex items-center justify-center p-0 animate-pulse">
              {unreadCount}
            </Badge>
          </div>
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
        
        {/* Küçük nokta göstergeleri */}
        <div className="flex gap-0.5 mt-1">
          <span className="w-1 h-1 bg-white/40 rounded-full" />
          <span className="w-1 h-1 bg-white/40 rounded-full" />
        </div>
      </button>
    );
  }

  // AÇIK DURUM - Chat penceresi (her zaman sağ alttan)
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[24rem]"
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Canlı Destek</h3>
            <p className="text-[10px] text-white/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Çevrimiçi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-card dark:bg-gray-900 border-x border-border dark:border-gray-800">
        <div 
          className="h-64 sm:h-80 overflow-y-auto p-3" 
          ref={scrollRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    message.sender === 'user'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.sender === 'user' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                    message.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-muted dark:bg-gray-800 text-foreground dark:text-gray-200 rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <span
                    className={cn(
                      'text-[10px] mt-0.5 block',
                      message.sender === 'user' ? 'text-orange-100' : 'text-muted-foreground'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Replies */}
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => {
                addMessage(reply, 'user');
              }}
              className="text-[11px] px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-card dark:bg-gray-900 border border-t-0 border-border dark:border-gray-800 rounded-b-2xl p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Mesajınızı yazın..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="gradient-orange px-3 h-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Müşteri temsilcimiz en kısa sürede yanıt verecektir
        </p>
      </div>
    </div>
  );
}
