import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, CheckCheck, Headphones, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useSimpleChatStore } from '@/stores/simpleChatStore';

// Emoji list - basit
const EMOJIS = ['😊', '👋', '😂', '❤️', '👍', '🎉', '🔥', '👏', '😍', '🤔', '😢', '🙏', '💪', '✨', '🎁', '👌'];

// Quick replies
const QUICK_REPLIES = [
  { id: 'order', text: 'Siparişim nerede?' },
  { id: 'support', text: 'Destek' },
  { id: 'campaign', text: 'Kampanya' },
];

export function SimpleChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    messages,
    isConnected,
    connectionStatus,
    isChatOpen,
    unreadCount,
    agentConnected,
    agentName,
    waitingForAgent,
    setChatOpen,
    connect,

    sendMessage,
    resetChat,
    requestAgent
  } = useSimpleChatStore();

  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Connect on first open if not connected
  useEffect(() => {
    if (isChatOpen && !isConnected && user && connectionStatus === 'idle') {
      connect(user.id, 'customer');
    }
  }, [isChatOpen, isConnected, user, connectionStatus, connect]);

  if (!isAuthenticated) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    sendMessage(inputText.trim());
    setInputText('');
    setShowQuickReplies(false);
    setShowEmojis(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
    setShowQuickReplies(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleRequestAgent = () => {
    if (!user) return;
    
    requestAgent({
      userId: user.id,
      userName: user.name || 'Misafir',
      userEmail: user.email || 'misafir@atushome.com'
    });
    
    toast.success('Canlı destek talebiniz alındı');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show welcome message if no messages
  const displayMessages = messages.length > 0 ? messages : [
    {
      id: 'welcome',
      text: 'Merhaba, ben AtusHome Yapay Zeka alışveriş asistanınızım 😊 Size nasıl yardımcı olabilirim?',
      sender: 'bot' as const,
      timestamp: Date.now()
    }
  ];

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
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
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
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {agentConnected ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {agentConnected ? (agentName || 'Temsilci') : 'AtusHome Yapay Zeka'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                      {connectionStatus === 'connected' ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          <span>Çevrimiçi</span>
                        </>
                      ) : connectionStatus === 'connecting' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Bağlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
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
                    onClick={() => setChatOpen(false)}
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
              {displayMessages.map((msg) => (
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
                      msg.sender === 'agent' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    )}>
                      {msg.sender === 'agent' ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  {/* Bubble */}
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
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                    )}>
                      <p>{msg.text}</p>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-[10px]',
                      msg.sender === 'user' ? 'text-gray-400 justify-end' : 'text-gray-400'
                    )}>
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-orange-500" />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for agent */}
              {waitingForAgent && !agentConnected && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Temsilci atanması bekleniyor...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {showQuickReplies && !agentConnected && (
              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply.text)}
                      className={cn(
                        "px-3 py-2 rounded-full text-xs",
                        "bg-white text-gray-700 border border-gray-200",
                        "hover:border-orange-300 hover:text-orange-600",
                        "transition-all shadow-sm"
                      )}
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Request Agent Button */}
            {!agentConnected && !waitingForAgent && (
              <div className="px-4 py-2 bg-gray-50/50">
                <button
                  onClick={handleRequestAgent}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
                    "hover:from-orange-400 hover:to-orange-500",
                    "transition-all text-xs font-medium shadow-md"
                  )}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Canlı Temsilciyle Görüş</span>
                </button>
              </div>
            )}

            {/* New Chat Button (when chat closed) */}
            {messages.length > 0 && messages[messages.length - 1]?.text?.includes('sonlandırıldı') && (
              <div className="px-4 py-2 bg-gray-50/50">
                <button
                  onClick={resetChat}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-gradient-to-r from-green-500 to-green-600 text-white",
                    "hover:from-green-400 hover:to-green-500",
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
                {/* Emoji */}
                <div className="relative" ref={emojiRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className={cn(
                      "h-9 w-9 rounded-full",
                      showEmojis ? "text-orange-600 bg-orange-50" : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                    )}
                  >
                    😊
                  </Button>
                  
                  {showEmojis && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => handleEmojiClick(emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Input */}
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Mesaj yazın..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-10 bg-gray-100 border-0 rounded-full px-4 text-sm focus-visible:ring-orange-500"
                />
                
                {/* Send */}
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="h-10 w-10 p-0 bg-orange-500 hover:bg-orange-600 rounded-full disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-center text-[10px] text-gray-400 mt-2">
                AtusHome AI • 7/24 Hizmet
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
