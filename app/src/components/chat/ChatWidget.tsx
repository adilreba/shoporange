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
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[22rem] shadow-2xl">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-medium text-xs">Canlı Destek</h3>
            <p className="text-[9px] text-white/70 flex items-center gap-1">
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
            className="text-white/70 hover:text-white hover:bg-white/20 h-7 w-7"
            title="Sohbeti Sonlandır"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white hover:bg-white/20 h-7 w-7"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-card dark:bg-gray-900 border-x border-border dark:border-gray-800">
        <div 
          className="h-56 sm:h-72 overflow-y-auto p-2.5" 
          ref={scrollRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-1.5',
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    message.sender === 'user'
                      ? 'bg-orange-100 text-orange-600'
                      : message.sender === 'agent'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {message.sender === 'user' ? (
                    <User className="w-2.5 h-2.5" />
                  ) : message.sender === 'agent' ? (
                    <div className="text-[8px] font-medium">T</div>
                  ) : (
                    <Bot className="w-2.5 h-2.5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed',
                    message.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : message.sender === 'agent'
                      ? 'bg-blue-500 text-white rounded-bl-sm'
                      : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-bl-sm border border-orange-100 dark:border-orange-800'
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <span
                    className={cn(
                      'text-[9px] mt-1 block opacity-70',
                      message.sender === 'user' ? 'text-orange-100' : 
                      message.sender === 'agent' ? 'text-blue-100' : 'text-orange-400'
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
          <div className="px-2.5 pb-2 space-y-1.5">
            <button
              onClick={requestAgent}
              className="w-full text-[11px] px-2.5 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-1.5 shadow-sm"
            >
              <User className="w-3 h-3" />
              Temsilciye Bağlan
            </button>
            <div className="flex flex-wrap gap-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => {
                    sendMessage(reply);
                  }}
                  className="text-[10px] px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Queue Status */}
        {waitingForAgent && connectionStatus !== 'active' && (
          <div className="px-2.5 pb-2">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-md p-2">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Clock className="w-3 h-3 animate-pulse" />
                <span className="text-[11px] font-medium">Temsilciye bağlanılıyor...</span>
              </div>
              {queuePosition !== null && queuePosition > 0 && (
                <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                  Sırada {queuePosition}. sıradasınız.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="bg-card dark:bg-gray-900 border border-t-0 border-border dark:border-gray-800 rounded-b-xl p-2.5">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Mesaj yazın..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={false}
            className="flex-1 h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-1 focus-visible:ring-orange-500"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="bg-orange-500 hover:bg-orange-600 px-2.5 h-8"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[9px] text-gray-400 text-center mt-1.5">
          {connectionStatus === 'active' 
            ? 'Canlı destek'
            : waitingForAgent
            ? 'Bağlanılıyor...'
            : connectionStatus === 'waiting'
            ? 'Beklemede'
            : connectionStatus === 'closed'
            ? 'Bot modu aktif'
            : 'Yardımcı olmaya hazır'
          }
        </p>
      </div>
    </div>
  );
}
