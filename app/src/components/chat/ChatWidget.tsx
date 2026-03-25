import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, User, Bot, X, ChevronLeft, GripVertical, Wifi, WifiOff, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const { 
    messages, 
    isOpen, 
    unreadCount, 
    isAgentTyping,
    isConnected,
    connectionStatus,
    agentName,
    queuePosition,
    waitingForAgent,
    totalWaitingCustomers,
    setIsOpen, 
    clearChat,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    closeSession,
    requestAgent
  } = useChatStore();
  
  const { user, isAuthenticated } = useAuthStore();
  const [inputMessage, setInputMessage] = useState('');
  const [position, setPosition] = useState<{ y: number | null }>({ y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect WebSocket when chat opens
  useEffect(() => {
    if (isOpen && !isConnected) {
      const userId = isAuthenticated && user ? user.id : `guest_${Date.now()}`;
      connect(userId, 'customer');
    }
  }, [isOpen, isConnected, connect, isAuthenticated, user]);

  // Disconnect when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAgentTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send typing indicator
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping();
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 3000);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return;
    
    setIsDragging(true);
    setHasDragged(false);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const button = buttonRef.current;
    
    if (button) {
      const rect = button.getBoundingClientRect();
      const currentY = position.y === null ? rect.top : position.y;
      setDragStart({ y: clientY - currentY });
      if (position.y === null) {
        setPosition({ y: rect.top });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newY = clientY - dragStart.y;
      
      setHasDragged(true);
      
      const minY = 100;
      const maxY = window.innerHeight - 150;
      
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
    
    sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  const handleClear = () => {
    closeSession();
    clearChat();
    toast.info('Sohbet sonlandırıldı');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Clock className="w-3 h-3 animate-spin" />;
      case 'waiting':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'active':
        return <Wifi className="w-3 h-3 text-green-400" />;
      case 'closed':
        return <WifiOff className="w-3 h-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (waitingForAgent && connectionStatus !== 'active') {
      return queuePosition ? `Sırada: ${queuePosition}. sıra` : 'Temsilci Bekleniyor...';
    }
    switch (connectionStatus) {
      case 'connecting':
        return 'Bağlanıyor...';
      case 'waiting':
        return 'Beklemede';
      case 'active':
        return agentName || 'Temsilci Çevrimiçi';
      case 'closed':
        return 'Sohbet Kapandı';
      default:
        return 'Çevrimdışı';
    }
  };

  // Quick reply buttons
  const quickReplies = [
    'Sipariş takibi',
    'Kargo bilgisi',
    'İade/Değişim',
    'Ödeme seçenekleri',
  ];

  // CLOSED STATE - Draggable button
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
        
        <div className="flex gap-0.5 mt-1">
          <span className="w-1 h-1 bg-white/40 rounded-full" />
          <span className="w-1 h-1 bg-white/40 rounded-full" />
        </div>
      </button>
    );
  }

  // OPEN STATE - Chat window
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[24rem]">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Canlı Destek</h3>
            <p className="text-[10px] text-white/80 flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
            title="Sohbeti Sonlandır"
          >
            <CheckCheck className="w-4 h-4" />
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
                      : message.sender === 'agent'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.sender === 'user' ? (
                    <User className="w-3 h-3" />
                  ) : message.sender === 'agent' ? (
                    <div className="text-[10px] font-bold">T</div>
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
                      : message.sender === 'agent'
                      ? 'bg-blue-500 text-white rounded-bl-none'
                      : 'bg-muted dark:bg-gray-800 text-foreground dark:text-gray-200 rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <span
                    className={cn(
                      'text-[10px] mt-0.5 block',
                      message.sender === 'user' ? 'text-orange-100' : 
                      message.sender === 'agent' ? 'text-blue-100' : 'text-muted-foreground'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Agent Typing Indicator */}
            {isAgentTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="text-[10px] font-bold text-blue-600">T</div>
                </div>
                <div className="bg-blue-500 rounded-2xl rounded-bl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Replies & Connect Button */}
        {connectionStatus !== 'active' && !waitingForAgent && (
          <div className="px-3 pb-2 space-y-2">
            <button
              onClick={requestAgent}
              className="w-full text-[12px] px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Müşteri Temsilcisine Bağlan
            </button>
            <div className="flex flex-wrap gap-1.5">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => {
                    sendMessage(reply);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Queue Status */}
        {waitingForAgent && connectionStatus !== 'active' && (
          <div className="px-3 pb-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Temsilciye bağlanılıyor...</span>
              </div>
              {queuePosition !== null && queuePosition > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Önünüzde {queuePosition} kişi var. Lütfen bekleyin.
                </p>
              )}
              {totalWaitingCustomers > 0 && queuePosition === null && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Şu anda {totalWaitingCustomers} kişi bekliyor. Sıranız geldiğinde otomatik bağlanacaksınız.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Beklerken sorularınızı sorabilirsiniz, bot yardımcı olmaya çalışacak.
              </p>
            </div>
          </div>
        )}
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
            disabled={connectionStatus === 'closed'}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || connectionStatus === 'closed'}
            className="gradient-orange px-3 h-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          {connectionStatus === 'active' 
            ? 'Müşteri temsilcimizle canlı sohbet ediyorsunuz'
            : waitingForAgent
            ? 'Sıranız geldiğinde otomatik bağlanacaksınız, sorularınızı sorabilirsiniz'
            : connectionStatus === 'waiting'
            ? 'Bekleme listesindesiniz, temsilcimiz bağlanacak'
            : connectionStatus === 'closed'
            ? 'Sohbet sonlandırıldı, yeni sohbet başlatabilirsiniz'
            : 'Müşteri temsilcimiz en kısa sürede yanıt verecektir'
          }
        </p>
      </div>
    </div>
  );
}
