/**
 * Live Chat Store
 * Bot entegrasyonu, WebSocket bağlantısı ve admin/customer senkronizasyonu
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  connectWebSocket, 
  disconnectWebSocket, 
  sendWebSocketMessage,
  findBotResponse,
  getWaitingSessions,
  type ChatMessage,
  type AgentRequest
} from '@/services/liveChatApi';

// State tipi
interface LiveChatState {
  // WebSocket bağlantı durumu
  isConnected: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  
  // Kullanıcı bilgileri
  userId: string | null;
  userType: 'customer' | 'agent' | null;
  sessionId: string | null;
  
  // Chat durumu
  messages: ChatMessage[];
  isChatOpen: boolean;
  unreadCount: number;
  
  // Agent durumu
  agentConnected: boolean;
  agentName: string | null;
  waitingForAgent: boolean;
  queuePosition: number | null;
  
  // Admin paneli için
  agentRequests: AgentRequest[];
  activeSessions: AgentRequest[];
  
  // Bot durumu
  isBotTyping: boolean;
  botMode: boolean; // true = bot aktif, false = agent aktif
}

// Actions tipi
interface LiveChatActions {
  // UI Actions
  setChatOpen: (isOpen: boolean) => void;
  resetChat: () => void;
  
  // WebSocket Actions
  connect: (userId: string, userType: 'customer' | 'agent', sessionId?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Mesaj Actions
  sendMessage: (text: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // Bot Actions
  sendBotResponse: (userMessage: string) => void;
  
  // Agent Actions (Customer)
  requestAgent: (userInfo: { userId: string; userName: string; userEmail: string }) => void;
  
  // Admin Actions (Agent)
  acceptRequest: (requestId: string, agentId: string, agentName: string) => void;
  completeRequest: (requestId: string) => void;
  sendAgentMessage: (requestId: string, text: string) => void;
  
  // HTTP API Actions (Admin)
  fetchWaitingSessions: () => Promise<void>;
  
  // Internal handlers
  handleWebSocketMessage: (data: any) => void;
}

type LiveChatStore = LiveChatState & LiveChatActions;

// Unique ID generator
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Store oluştur
export const useLiveChatStore = create<LiveChatStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isConnected: false,
      connectionStatus: 'idle',
      userId: null,
      userType: null,
      sessionId: null,
      messages: [],
      isChatOpen: false,
      unreadCount: 0,
      agentConnected: false,
      agentName: null,
      waitingForAgent: false,
      queuePosition: null,
      agentRequests: [],
      activeSessions: [],
      isBotTyping: false,
      botMode: true,

      // UI Actions
      setChatOpen: (isOpen) => {
        set({ isChatOpen: isOpen });
        if (isOpen) {
          set({ unreadCount: 0 });
        }
      },

      resetChat: () => {
        get().disconnect();
        set({
          messages: [],
          sessionId: null,
          agentConnected: false,
          agentName: null,
          waitingForAgent: false,
          queuePosition: null,
          botMode: true,
          unreadCount: 0
        });
      },

      // WebSocket Actions
      connect: (userId, userType, sessionId) => {
        const { isConnected, connectionStatus } = get();
        
        // Zaten bağlıysa tekrar bağlanma
        if (isConnected || connectionStatus === 'connecting') {
          console.log('[LiveChatStore] Already connected or connecting');
          return;
        }
        
        set({ 
          connectionStatus: 'connecting',
          userId,
          userType,
          sessionId: sessionId || null
        });

        console.log(`[LiveChatStore] Connecting: ${userId} (${userType})`);

        // WebSocket bağlantısı oluştur
        connectWebSocket(
          userId,
          userType,
          sessionId,
          // onMessage callback
          (data) => {
            get().handleWebSocketMessage(data);
          },
          // onConnect callback
          (connected) => {
            set({ 
              isConnected: connected,
              connectionStatus: connected ? 'connected' : 'disconnected'
            });
          }
        );
      },

      disconnect: () => {
        disconnectWebSocket();
        set({
          isConnected: false,
          connectionStatus: 'disconnected',
          agentConnected: false,
          agentName: null
        });
      },

      reconnect: () => {
        const { userId, userType, sessionId } = get();
        if (userId && userType) {
          get().connect(userId, userType, sessionId || undefined);
        }
      },

      // Mesaj Actions
      sendMessage: (text) => {
        const { 
          isConnected, 
          userType, 
          sessionId, 
          botMode, 
          agentConnected,
          waitingForAgent 
        } = get();
        
        if (!text.trim()) return;

        // Kullanıcı mesajını ekle
        const userMessage: ChatMessage = {
          id: generateId(),
          text: text.trim(),
          sender: 'user',
          timestamp: new Date().toISOString(),
          isRead: true
        };

        set((state) => ({
          messages: [...state.messages, userMessage]
        }));

        // WebSocket üzerinden gönder (eğer bağlıysa)
        if (isConnected && sessionId) {
          sendWebSocketMessage('send_message', {
            sessionId,
            message: text.trim(),
            userType
          });
        }

        // Bot modunda ve agent bağlı değilse bot yanıt ver
        if (userType === 'customer' && botMode && !agentConnected && !waitingForAgent) {
          get().sendBotResponse(text.trim());
        }
      },

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString()
        };

        set((state) => {
          // Duplicate kontrolü
          if (state.messages.some(m => m.id === newMessage.id)) {
            return state;
          }
          
          const isUnread = !state.isChatOpen && newMessage.sender !== 'user';
          
          return {
            messages: [...state.messages, newMessage],
            unreadCount: isUnread ? state.unreadCount + 1 : state.unreadCount
          };
        });
      },

      // Bot Actions
      sendBotResponse: (userMessage) => {
        set({ isBotTyping: true });

        // Bot yanıtını bul
        const botResponse = findBotResponse(userMessage);

        setTimeout(() => {
          const botMessage: ChatMessage = {
            id: generateId(),
            text: botResponse || 'Size nasıl yardımcı olabilirim?',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            isRead: false
          };

          set((state) => ({
            messages: [...state.messages, botMessage],
            isBotTyping: false,
            unreadCount: state.isChatOpen ? 0 : state.unreadCount + 1
          }));
        }, 800 + Math.random() * 700); // 0.8-1.5s arası gecikme
      },

      // Agent Actions (Customer)
      requestAgent: (userInfo) => {
        const { isConnected } = get();
        
        // Session ID oluştur
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        set({
          waitingForAgent: true,
          queuePosition: 1,
          botMode: false,
          sessionId: newSessionId,
          userId: userInfo.userId,
          userType: 'customer'
        });

        // WebSocket'e bağlan (eğer bağlı değilse)
        if (!isConnected) {
          get().connect(userInfo.userId, 'customer', newSessionId);
        }

        // Agent isteği gönder
        setTimeout(() => {
          sendWebSocketMessage('request_agent', {
            sessionId: newSessionId,
            userId: userInfo.userId,
            userName: userInfo.userName,
            userEmail: userInfo.userEmail
          });

          // Bekleme mesajı ekle
          const waitingMessage: ChatMessage = {
            id: generateId(),
            text: 'Bir temsilcimiz en kısa sürede sizinle ilgilenecektir. Lütfen bekleyin... 🕐',
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: true
          };

          set((state) => ({
            messages: [...state.messages, waitingMessage]
          }));
        }, 500);

        // Agent request'i admin paneli için kaydet
        const newRequest: AgentRequest = {
          id: newSessionId,
          sessionId: newSessionId,
          customerId: userInfo.userId,
          customerName: userInfo.userName,
          customerEmail: userInfo.userEmail,
          timestamp: new Date().toISOString(),
          status: 'pending',
          messages: []
        };

        set((state) => ({
          agentRequests: [...state.agentRequests, newRequest]
        }));
      },

      // Admin Actions (Agent)
      acceptRequest: (requestId, agentId, agentName) => {
        const { userId, isConnected } = get();
        
        // WebSocket'e bağlan (eğer bağlı değilse)
        if (!isConnected && userId) {
          get().connect(userId, 'agent', requestId);
        }

        // Accept message gönder
        setTimeout(() => {
          sendWebSocketMessage('accept_chat', {
            sessionId: requestId,
            agentId,
            agentName
          });
        }, 300);

        // State güncelle
        set((state) => {
          const request = state.agentRequests.find(r => r.id === requestId);
          if (!request) return state;

          const updatedRequest: AgentRequest = {
            ...request,
            status: 'active'
          };

          return {
            agentRequests: state.agentRequests.map(r =>
              r.id === requestId ? updatedRequest : r
            ),
            activeSessions: [...state.activeSessions, updatedRequest]
          };
        });
      },

      completeRequest: (requestId) => {
        // Session'ı kapat
        sendWebSocketMessage('close_session', { sessionId: requestId });

        set((state) => ({
          agentRequests: state.agentRequests.map(r =>
            r.id === requestId ? { ...r, status: 'completed' } : r
          ),
          activeSessions: state.activeSessions.filter(r => r.id !== requestId)
        }));
      },

      sendAgentMessage: (requestId, text) => {
        const { isConnected, userId } = get();
        
        if (!text.trim()) return;

        // WebSocket üzerinden gönder
        if (isConnected) {
          sendWebSocketMessage('send_message', {
            sessionId: requestId,
            message: text.trim(),
            userType: 'agent',
            agentId: userId
          });
        }

        // Local state'e ekle
        const agentMessage: ChatMessage = {
          id: generateId(),
          text: text.trim(),
          sender: 'agent',
          timestamp: new Date().toISOString(),
          isRead: true
        };

        set((state) => ({
          messages: [...state.messages, agentMessage],
          activeSessions: state.activeSessions.map(session =>
            session.id === requestId
              ? { ...session, messages: [...session.messages, agentMessage] }
              : session
          )
        }));
      },

      // HTTP API Actions (Admin)
      fetchWaitingSessions: async () => {
        const result = await getWaitingSessions();
        if (result.success && result.data) {
          // Gelen session'ları agentRequests'a ekle
          set((state) => {
            const newRequests = result.data!.filter(
              session => !state.agentRequests.some(r => r.id === session.sessionId)
            ).map(session => ({
              id: session.sessionId,
              sessionId: session.sessionId,
              customerId: session.customerId,
              customerName: session.customerName || 'Misafir Kullanıcı',
              customerEmail: session.customerEmail || '',
              timestamp: session.createdAt,
              status: 'pending' as const,
              messages: session.messages || []
            }));

            return {
              agentRequests: [...state.agentRequests, ...newRequests]
            };
          });
        }
      },

      // Internal handlers
      handleWebSocketMessage: (data) => {
        const { userType } = get();
        
        switch (data.type) {
          case 'session_created':
            set({ sessionId: data.sessionId });
            break;

          case 'agent_assigned':
          case 'agent_joined':
            set({
              agentConnected: true,
              agentName: data.agentName || data.agentId || 'Temsilci',
              waitingForAgent: false,
              queuePosition: null,
              botMode: false
            });

            // Agent bağlandı mesajı
            get().addMessage({
              text: data.message || 'Müşteri temsilciniz bağlandı. Size nasıl yardımcı olabilirim?',
              sender: 'agent',
              isRead: false
            });
            break;

          case 'new_message':
            if (data.message) {
              const message: ChatMessage = {
                id: data.message.messageId || generateId(),
                text: data.message.content || data.message.text,
                sender: data.message.senderType === 'agent' ? 'agent' : 
                        data.message.senderType === 'customer' ? 'user' : 'bot',
                timestamp: data.message.timestamp || new Date().toISOString(),
                isRead: false
              };

              set((state) => ({
                messages: [...state.messages, message]
              }));

              // Admin paneli için session mesajlarını güncelle
              if (userType === 'agent' && data.sessionId) {
                set((state) => ({
                  activeSessions: state.activeSessions.map(session =>
                    session.id === data.sessionId
                      ? { ...session, messages: [...session.messages, message] }
                      : session
                  )
                }));
              }
            }
            break;

          case 'queue_status':
            set({
              queuePosition: data.position,
              waitingForAgent: true
            });
            
            if (data.message) {
              get().addMessage({
                text: data.message,
                sender: 'system',
                isRead: true
              });
            }
            break;

          case 'new_waiting_customer':
            // Admin paneli için yeni müşteri bildirimi
            if (userType === 'agent' && data.sessionId) {
              // Session zaten kayıtlı mı kontrol et
              set((state) => {
                if (state.agentRequests.some(r => r.id === data.sessionId)) {
                  return state;
                }

                const newRequest: AgentRequest = {
                  id: data.sessionId,
                  sessionId: data.sessionId,
                  customerId: data.customerId,
                  customerName: data.customerName || 'Misafir Kullanıcı',
                  customerEmail: data.customerEmail || '',
                  timestamp: new Date().toISOString(),
                  status: 'pending',
                  messages: []
                };

                return {
                  agentRequests: [...state.agentRequests, newRequest]
                };
              });
            }
            break;

          case 'chat_closed':
            set({
              agentConnected: false,
              agentName: null,
              waitingForAgent: false,
              botMode: true
            });

            get().addMessage({
              text: data.message || 'Sohbet sonlandırıldı. Başka bir konuda yardımcı olabilir miyim?',
              sender: 'bot',
              isRead: false
            });
            break;

          case 'agent_left':
            set({
              agentConnected: false,
              agentName: null,
              waitingForAgent: true
            });

            get().addMessage({
              text: data.message || 'Temsilcimiz bağlantısı kesildi. Yeni temsilci atanması bekleniyor...',
              sender: 'system',
              isRead: false
            });
            break;

          case 'typing':
            // Typing indicator (opsiyonel)
            break;
        }
      }
    }),
    {
      name: 'live-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        unreadCount: state.unreadCount,
        agentRequests: state.agentRequests,
        activeSessions: state.activeSessions
      })
    }
  )
);

// Auto-reconnect on window focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    const state = useLiveChatStore.getState();
    if (state.userId && state.userType && !state.isConnected && state.connectionStatus !== 'connecting') {
      console.log('[LiveChatStore] Auto-reconnecting...');
      state.reconnect();
    }
  });
}

export default useLiveChatStore;
