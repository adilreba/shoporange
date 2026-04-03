import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// WebSocket URL
const WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'wss://faj6241vp7.execute-api.eu-west-1.amazonaws.com/prod';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: number;
}

interface SimpleChatState {
  // WebSocket
  ws: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  
  // Session
  sessionId: string | null;
  userId: string | null;
  userType: 'customer' | 'agent' | null;
  
  // Chat
  messages: ChatMessage[];
  unreadCount: number;
  isChatOpen: boolean;
  
  // Agent
  agentConnected: boolean;
  agentName: string | null;
  waitingForAgent: boolean;
  
  // Admin
  pendingRequests: { sessionId: string; userId: string; userName: string; timestamp: number }[];
  activeChats: { sessionId: string; userId: string; userName: string; startedAt: number }[];
}

interface SimpleChatActions {
  // WebSocket
  connect: (userId: string, userType: 'customer' | 'agent', sessionId?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Messages
  sendMessage: (text: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  // UI
  setChatOpen: (isOpen: boolean) => void;
  resetChat: () => void;
  
  // Agent
  requestAgent: (userInfo: { userId: string; userName: string; userEmail: string }) => void;
  acceptChat: (sessionId: string, agentId: string) => void;
  closeChat: () => void;
  
  // Typing
  sendTyping: () => void;
}

// Unique ID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create store with both state and actions
export const useSimpleChatStore = create<SimpleChatState & SimpleChatActions>()(
  persist(
    (set, get) => ({
      // Initial State
      ws: null,
      isConnected: false,
      connectionStatus: 'idle',
      sessionId: null,
      userId: null,
      userType: null,
      messages: [],
      unreadCount: 0,
      isChatOpen: false,
      agentConnected: false,
      agentName: null,
      waitingForAgent: false,
      pendingRequests: [],
      activeChats: [],

      // Connect to WebSocket
      connect: (userId, userType, sessionId) => {
        const { ws } = get();
        
        // Eğer zaten bağlıysa ve aynı kullanıcıysa, tekrar bağlanma
        if (ws?.readyState === WebSocket.OPEN && get().userId === userId) {
          console.log('[Chat] Already connected');
          return;
        }
        
        // Önceki bağlantıyı kapat
        if (ws) {
          ws.close();
        }

        set({ connectionStatus: 'connecting', userId, userType, sessionId: sessionId || null });

        // WebSocket URL oluştur
        const params = new URLSearchParams();
        params.append('userId', userId);
        params.append('userType', userType);
        if (sessionId) params.append('sessionId', sessionId);
        
        const wsUrl = `${WS_URL}?${params.toString()}`;
        console.log('[Chat] Connecting to:', wsUrl);

        try {
          const newWs = new WebSocket(wsUrl);

          newWs.onopen = () => {
            console.log('[Chat] Connected');
            set({ ws: newWs, isConnected: true, connectionStatus: 'connected' });
          };

          newWs.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('[Chat] Received:', data);
              
              switch (data.type) {
                case 'session_created':
                  set({ sessionId: data.sessionId });
                  break;
                  
                case 'agent_joined':
                case 'agent_assigned':
                  set({ 
                    agentConnected: true, 
                    agentName: data.agentId || 'Temsilci',
                    waitingForAgent: false 
                  });
                  get().addMessage({
                    id: generateId(),
                    text: data.message || 'Müşteri temsilciniz bağlandı. Size nasıl yardımcı olabilirim?',
                    sender: 'agent',
                    timestamp: Date.now()
                  });
                  break;
                  
                case 'new_message':
                  if (data.message) {
                    get().addMessage({
                      id: data.message.messageId || generateId(),
                      text: data.message.content,
                      sender: data.message.senderType === 'agent' ? 'agent' : 'user',
                      timestamp: Date.now()
                    });
                  }
                  break;
                  
                case 'queue_status':
                  set({ waitingForAgent: true });
                  if (data.message) {
                    get().addMessage({
                      id: generateId(),
                      text: data.message,
                      sender: 'system',
                      timestamp: Date.now()
                    });
                  }
                  break;
                  
                case 'chat_closed':
                  set({ 
                    agentConnected: false, 
                    agentName: null,
                    waitingForAgent: false,
                    isConnected: false,
                    connectionStatus: 'disconnected'
                  });
                  get().addMessage({
                    id: generateId(),
                    text: 'Sohbet sonlandırıldı. Yeni bir konuda yardımcı olmamı ister misiniz?',
                    sender: 'system',
                    timestamp: Date.now()
                  });
                  break;
                  
                case 'new_waiting_customer':
                  // Admin panel için
                  if (userType === 'agent' && data.sessionId) {
                    set(state => ({
                      pendingRequests: [...state.pendingRequests, {
                        sessionId: data.sessionId,
                        userId: data.customerId,
                        userName: 'Müşteri',
                        timestamp: Date.now()
                      }]
                    }));
                  }
                  break;
                  
                default:
                  console.log('[Chat] Unknown message type:', data.type);
              }
            } catch (error) {
              console.error('[Chat] Error parsing message:', error);
            }
          };

          newWs.onclose = () => {
            console.log('[Chat] Disconnected');
            set({ ws: null, isConnected: false, connectionStatus: 'disconnected' });
          };

          newWs.onerror = (error) => {
            console.error('[Chat] Error:', error);
            set({ ws: null, isConnected: false, connectionStatus: 'disconnected' });
          };
        } catch (error) {
          console.error('[Chat] Failed to connect:', error);
          set({ connectionStatus: 'disconnected' });
        }
      },

      // Disconnect
      disconnect: () => {
        const { ws } = get();
        if (ws) {
          ws.close();
        }
        set({ 
          ws: null, 
          isConnected: false, 
          connectionStatus: 'disconnected',
          agentConnected: false,
          agentName: null
        });
      },

      // Reconnect
      reconnect: () => {
        const { userId, userType, sessionId } = get();
        if (userId && userType) {
          get().connect(userId, userType, sessionId || undefined);
        }
      },

      // Send message
      sendMessage: (text) => {
        const { ws, isConnected, userType } = get();
        
        if (!isConnected || !ws) {
          console.error('[Chat] Not connected');
          return;
        }

        // Önce kendi mesajını ekle
        get().addMessage({
          id: generateId(),
          text,
          sender: 'user',
          timestamp: Date.now()
        });

        // WebSocket üzerinden gönder
        ws.send(JSON.stringify({
          action: 'send_message',
          message: text,
          userType
        }));
      },

      // Add message to state
      addMessage: (message) => {
        set(state => {
          // Duplicate kontrolü
          if (state.messages.some(m => m.id === message.id)) {
            return state;
          }
          
          const newMessages = [...state.messages, message];
          const newUnread = !state.isChatOpen && message.sender !== 'user' 
            ? state.unreadCount + 1 
            : state.unreadCount;
          
          return { messages: newMessages, unreadCount: newUnread };
        });
      },

      // Clear all messages
      clearMessages: () => {
        set({ messages: [], unreadCount: 0 });
      },

      // Set chat open
      setChatOpen: (isOpen) => {
        set({ isChatOpen: isOpen, unreadCount: isOpen ? 0 : get().unreadCount });
      },

      // Reset chat completely
      resetChat: () => {
        get().disconnect();
        set({
          messages: [],
          sessionId: null,
          agentConnected: false,
          agentName: null,
          waitingForAgent: false,
          unreadCount: 0
        });
      },

      // Request agent (customer)
      requestAgent: (userInfo) => {
        const { ws, isConnected } = get();
        
        if (!isConnected || !ws) {
          // Önce bağlan
          get().connect(userInfo.userId, 'customer');
          
          // Bağlandıktan sonra istek gönder
          setTimeout(() => {
            const { ws: newWs, isConnected: newConnected } = get();
            if (newConnected && newWs) {
              newWs.send(JSON.stringify({
                action: 'request_agent',
                userName: userInfo.userName,
                userEmail: userInfo.userEmail
              }));
              set({ waitingForAgent: true });
            }
          }, 1000);
        } else {
          ws.send(JSON.stringify({
            action: 'request_agent',
            userName: userInfo.userName,
            userEmail: userInfo.userEmail
          }));
          set({ waitingForAgent: true });
        }
      },

      // Accept chat (agent)
      acceptChat: (sessionId, agentId) => {
        const { ws, isConnected } = get();
        
        if (!isConnected || !ws) {
          console.error('[Chat] Agent not connected');
          return;
        }

        ws.send(JSON.stringify({
          action: 'accept_chat',
          sessionId,
          agentId
        }));

        // Pending'den çıkar, active'e ekle
        set(state => ({
          pendingRequests: state.pendingRequests.filter(r => r.sessionId !== sessionId),
          activeChats: [...state.activeChats, {
            sessionId,
            userId: 'customer',
            userName: 'Müşteri',
            startedAt: Date.now()
          }]
        }));
      },

      // Close chat
      closeChat: () => {
        const { ws, isConnected, sessionId } = get();
        
        if (isConnected && ws && sessionId) {
          ws.send(JSON.stringify({
            action: 'close_session',
            sessionId
          }));
        }

        set({
          agentConnected: false,
          agentName: null,
          waitingForAgent: false,
          isConnected: false,
          connectionStatus: 'disconnected'
        });
      },

      // Send typing indicator
      sendTyping: () => {
        const { ws, isConnected } = get();
        
        if (isConnected && ws) {
          ws.send(JSON.stringify({ action: 'typing' }));
        }
      }
    }),
    {
      name: 'simple-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages,
        unreadCount: state.unreadCount
      })
    }
  )
);

// Auto-reconnect on mount
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    const state = useSimpleChatStore.getState();
    if (state.userId && state.userType && !state.isConnected) {
      console.log('[Chat] Auto-reconnecting...');
      state.reconnect();
    }
  });
}

export default useSimpleChatStore;
