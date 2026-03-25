import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  isRead?: boolean;
  sessionId?: string;
}

export type ChatStatus = 'idle' | 'connecting' | 'waiting' | 'active' | 'closed';

interface ChatState {
  // WebSocket & Connection
  ws: WebSocket | null;
  isConnected: boolean;
  connectionStatus: ChatStatus;
  sessionId: string | null;
  agentId: string | null;
  agentName: string | null;
  
  // Queue & Waiting
  queuePosition: number | null;
  waitingForAgent: boolean;
  totalWaitingCustomers: number;
  
  // Messages & UI
  messages: ChatMessage[];
  isOpen: boolean;
  unreadCount: number;
  isTyping: boolean;
  isAgentTyping: boolean;
  
  // Actions
  connect: (userId: string, userType?: 'customer' | 'agent') => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendTyping: () => void;
  markAsRead: (messageIds: string[]) => void;
  addMessage: (text: string, sender: 'user' | 'bot' | 'agent') => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsAgentTyping: (isTyping: boolean) => void;
  clearChat: () => void;
  assignAgent: (agentId: string, agentName?: string) => void;
  closeSession: () => void;
  requestAgent: () => void;
  updateQueuePosition: (position: number, total: number) => void;
}

// WebSocket endpoint
const WS_ENDPOINT = import.meta.env.VITE_CHAT_WS_URL || 'wss://your-api.execute-api.eu-west-1.amazonaws.com/prod';

// Auto-responses for common questions (fallback when no agent connected)
const autoResponses: Record<string, string> = {
  'merhaba': 'Merhaba! AtusHome\'a hoş geldiniz. Size nasıl yardımcı olabilirim?',
  'selam': 'Selam! Size nasıl yardımcı olabilirim?',
  'sipariş': 'Siparişlerinizi "Hesabım > Siparişlerim" bölümünden takip edebilirsiniz. Yardımcı olmamı ister misiniz?',
  'kargo': '500₺ üzeri siparişlerinizde kargo ücretsizdir. Siparişleriniz 1-3 iş günü içinde kargoya verilir.',
  'iade': 'Ürünlerimizi 14 gün içinde koşulsuz iade edebilirsiniz. İade talebi için hesabınızdan başvuru yapabilirsiniz.',
  'ödeme': 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Tüm ödemeler 256-bit SSL ile güvence altındadır.',
  'indirim': 'Güncel kampanyalarımızı ana sayfadaki "İndirimler" bölümünden takip edebilirsiniz. Ayrıca bültenimize abone olarak özel indirimlerden haberdar olabilirsiniz.',
  'stok': 'Stok durumunu ürün sayfasında görebilirsiniz. Stokta olmayan ürünler için "Stokta Olunca Haber Ver" özelliğini kullanabilirsiniz.',
  'yardım': 'Size şu konularda yardımcı olabilirim: Sipariş takibi, İade/Değişim, Ödeme seçenekleri, Ürün bilgisi, Kampanyalar',
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      ws: null,
      isConnected: false,
      connectionStatus: 'idle',
      sessionId: null,
      agentId: null,
      agentName: null,
      messages: [
        {
          id: 'welcome',
          text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?\n\nBir temsilciye bağlanmak için mesaj gönderin.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isRead: true,
        }
      ],
      isOpen: false,
      unreadCount: 0,
      isTyping: false,
      isAgentTyping: false,
      queuePosition: null,
      waitingForAgent: false,
      totalWaitingCustomers: 0,

      // Connect to WebSocket
      connect: (userId: string, userType: 'customer' | 'agent' = 'customer') => {
        const { ws, sessionId } = get();
        
        // Don't reconnect if already connected
        if (ws?.readyState === WebSocket.OPEN) return;

        set({ connectionStatus: 'connecting' });

        // Build connection URL with query params
        const url = new URL(WS_ENDPOINT);
        url.searchParams.append('userId', userId);
        url.searchParams.append('userType', userType);
        if (sessionId) {
          url.searchParams.append('sessionId', sessionId);
        }

        const newWs = new WebSocket(url.toString());

        newWs.onopen = () => {
          console.log('WebSocket connected');
          set({ 
            ws: newWs, 
            isConnected: true,
            connectionStatus: 'waiting'
          });
        };

        newWs.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);

          switch (data.type) {
            case 'session_created':
              set({ 
                sessionId: data.sessionId,
                connectionStatus: 'waiting'
              });
              get().addMessage(data.message, 'bot');
              break;

            case 'agent_assigned':
            case 'agent_joined':
              set({ 
                agentId: data.agentId,
                connectionStatus: 'active',
                waitingForAgent: false,
                queuePosition: null
              });
              get().addMessage(data.message, 'agent');
              break;

            case 'agent_left':
              set({ 
                agentId: null,
                connectionStatus: 'waiting'
              });
              get().addMessage(data.message, 'bot');
              break;

            case 'new_message':
              const msg = data.message;
              get().addMessage(msg.content, msg.senderType === 'agent' ? 'agent' : 'user');
              break;

            case 'typing':
              if (data.userType === 'agent') {
                set({ isAgentTyping: true });
                setTimeout(() => set({ isAgentTyping: false }), 3000);
              }
              break;

            case 'message_sent':
              // Message confirmed by server
              break;

            case 'queue_status':
              set({ 
                queuePosition: data.position,
                totalWaitingCustomers: data.total,
                waitingForAgent: true
              });
              if (data.message) {
                get().addMessage(data.message, 'bot');
              }
              break;

            case 'chat_closed':
              set({ 
                connectionStatus: 'closed',
                agentId: null,
                waitingForAgent: false,
                queuePosition: null
              });
              get().addMessage(data.message, 'bot');
              break;

            case 'error':
              console.error('Chat error:', data.message);
              get().addMessage('Bir hata oluştu: ' + data.message, 'bot');
              break;
          }
        };

        newWs.onclose = () => {
          console.log('WebSocket disconnected');
          set({ 
            ws: null, 
            isConnected: false,
            connectionStatus: 'idle'
          });
        };

        newWs.onerror = (error) => {
          console.error('WebSocket error:', error);
          set({ connectionStatus: 'idle' });
        };

        set({ ws: newWs });
      },

      // Disconnect WebSocket
      disconnect: () => {
        const { ws } = get();
        if (ws) {
          ws.close();
          set({ 
            ws: null, 
            isConnected: false,
            connectionStatus: 'idle',
            sessionId: null,
            agentId: null
          });
        }
      },

      // Send message via WebSocket
      sendMessage: (text: string) => {
        const { ws, sessionId, isConnected, agentId } = get();

        if (isConnected && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'send_message',
            message: text,
            sessionId
          }));
        }

        get().addMessage(text, 'user');

        // If no agent connected, use auto-response
        if (!agentId) {
          set({ isTyping: true });
          
          setTimeout(() => {
            const lowerText = text.toLowerCase();
            let response = '';

            for (const [keyword, reply] of Object.entries(autoResponses)) {
              if (lowerText.includes(keyword)) {
                response = reply;
                break;
              }
            }

            if (!response) {
              response = 'Anladım. Konuyu müşteri temsilcimize aktarıyorum. Lütfen biraz bekleyin...\n\nSıkça sorulan konular: sipariş, kargo, iade, ödeme, indirim, stok';
            }

            set({ isTyping: false });
            get().addMessage(response, 'bot');
          }, 1000 + Math.random() * 1000);
        }
      },

      // Send typing indicator
      sendTyping: () => {
        const { ws, sessionId, isConnected } = get();
        if (isConnected && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'typing',
            sessionId
          }));
        }
      },

      // Mark messages as read
      markAsRead: (messageIds: string[]) => {
        const { ws, isConnected } = get();
        if (isConnected && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'mark_read',
            messageIds
          }));
        }

        set((state) => ({
          messages: state.messages.map((m) => 
            messageIds.includes(m.id) ? { ...m, isRead: true } : m
          ),
        }));
      },

      // Add message to state
      addMessage: (text: string, sender: 'user' | 'bot' | 'agent') => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text,
          sender,
          timestamp: new Date().toISOString(),
          isRead: get().isOpen,
          sessionId: get().sessionId || undefined,
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
          unreadCount: sender !== 'user' && !state.isOpen ? state.unreadCount + 1 : state.unreadCount,
        }));
      },

      setIsOpen: (isOpen: boolean) => {
        set({ isOpen });
        if (isOpen) {
          set({ unreadCount: 0 });
          set((state) => ({
            messages: state.messages.map((m) => ({ ...m, isRead: true })),
          }));
        }
      },

      setIsTyping: (isTyping: boolean) => {
        set({ isTyping });
      },

      setIsAgentTyping: (isAgentTyping: boolean) => {
        set({ isAgentTyping });
      },

      assignAgent: (agentId: string, agentName?: string) => {
        set({ 
          agentId,
          agentName: agentName || 'Temsilci',
          connectionStatus: 'active'
        });
      },

      closeSession: () => {
        const { ws, sessionId, isConnected } = get();
        
        if (isConnected && ws?.readyState === WebSocket.OPEN && sessionId) {
          ws.send(JSON.stringify({
            action: 'close_chat',
            sessionId
          }));
        }

        set({
          connectionStatus: 'closed',
          agentId: null,
          agentName: null,
          sessionId: null,
          queuePosition: null,
          waitingForAgent: false,
        });
      },

      // Request agent connection
      requestAgent: () => {
        const { ws, isConnected, sessionId } = get();
        
        if (!isConnected || !ws || ws.readyState !== WebSocket.OPEN) {
          get().addMessage('Bağlantı hatası. Lütfen sayfayı yenileyin.', 'bot');
          return;
        }

        ws.send(JSON.stringify({
          action: 'request_agent',
          sessionId
        }));

        set({ 
          waitingForAgent: true,
          queuePosition: null
        });

        get().addMessage('🔄 Müşteri temsilcisine bağlanıyorsunuz...\n\nSize beklerken yardımcı olabilir miyim?', 'bot');
      },

      // Update queue position
      updateQueuePosition: (position: number, total: number) => {
        set({ 
          queuePosition: position,
          totalWaitingCustomers: total
        });
      },

      clearChat: () => {
        get().disconnect();
        set({
          messages: [
            {
              id: 'welcome',
              text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?\n\nBir temsilciye bağlanmak için mesaj gönderin.',
              sender: 'bot',
              timestamp: new Date().toISOString(),
              isRead: true,
            }
          ],
          unreadCount: 0,
          sessionId: null,
          agentId: null,
          agentName: null,
          connectionStatus: 'idle',
          queuePosition: null,
          waitingForAgent: false,
          totalWaitingCustomers: 0,
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        messages: state.messages.filter(m => m.id !== 'welcome'),
        sessionId: state.sessionId 
      }),
    }
  )
);
