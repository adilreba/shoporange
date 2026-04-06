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
  
  // Timeout handling
  waitingTimeoutId: ReturnType<typeof setTimeout> | null;
  waitingStartTime: number | null;
  estimatedWaitTime: number; // saniye cinsinden tahmini bekleme süresi
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
      waitingTimeoutId: null,
      waitingStartTime: null,
      estimatedWaitTime: 300, // 5 dakika tahmini

      // UI Actions
      setChatOpen: (isOpen) => {
        set({ isChatOpen: isOpen });
        if (isOpen) {
          set({ unreadCount: 0 });
        }
      },

      resetChat: () => {
        const { sessionId, isConnected } = get();
        
        // Eğer aktif session varsa, önce session'ı kapat
        if (sessionId && isConnected) {
          console.log('[LiveChatStore] Closing session before disconnect:', sessionId);
          sendWebSocketMessage('close_session', { sessionId });
        }
        
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

        // Kullanıcı mesajını oluştur
        const userMessage: ChatMessage = {
          id: generateId(),
          text: text.trim(),
          sender: 'user',
          timestamp: new Date().toISOString(),
          isRead: true
        };

        // Mesajı HEMEN ekle (UI'da göster)
        set((state) => ({
          messages: [...state.messages, userMessage]
        }));

        // WebSocket BAĞLIYSA: mesajı karşı tarafa gönder
        if (isConnected && sessionId) {
          sendWebSocketMessage('send_message', {
            sessionId,
            message: text.trim(),
            senderType: userType,  // HATA DÜZELTİLDİ: userType yerine senderType kullan
            messageId: userMessage.id
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
        const { isConnected, waitingTimeoutId } = get();
        
        // Önceki timeout varsa temizle
        if (waitingTimeoutId) {
          clearTimeout(waitingTimeoutId);
        }
        
        // Session ID oluştur
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        set({
          waitingForAgent: true,
          queuePosition: 1,
          botMode: false,
          sessionId: newSessionId,
          userId: userInfo.userId,
          userType: 'customer',
          waitingStartTime: startTime
        });

        // WebSocket'e bağlan (eğer bağlı değilse)
        if (!isConnected) {
          get().connect(userInfo.userId, 'customer', newSessionId);
        }

        // 10 DAKİKA (600 saniye) TIMEOUT - Temsilci atanmazsa otomatik kapat
        const timeoutId = setTimeout(() => {
          console.log('[LiveChatStore] Waiting timeout reached (10 minutes)');
          
          // Timeout mesajı
          const timeoutMessage: ChatMessage = {
            id: generateId(),
            text: '⏰ Temsilcilerimiz şu an yoğun. Talebiniz kaydedildi, size en kısa sürede e-posta ile dönüş yapılacaktır.',
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: true
          };

          set((state) => ({
            messages: [...state.messages, timeoutMessage],
            waitingForAgent: false,
            botMode: true
          }));

          // Session'ı kapat
          sendWebSocketMessage('close_session', { 
            sessionId: newSessionId,
            reason: 'timeout'
          });

          // Ticket oluştur (email bildirimi için)
          // Gerçek uygulamada burada API çağrısı yapılır
          console.log('[LiveChatStore] Ticket created for:', userInfo.userEmail);
          
        }, 10 * 60 * 1000); // 10 dakika = 600,000ms

        set({ waitingTimeoutId: timeoutId });

        // Agent isteği gönder
        setTimeout(() => {
          sendWebSocketMessage('request_agent', {
            sessionId: newSessionId,
            userId: userInfo.userId,
            userName: userInfo.userName,
            userEmail: userInfo.userEmail
          });

          // Bekleme mesajı ekle - TAHMİNİ BEKLEME SÜRESİ ile
          const estimatedMinutes = Math.ceil(get().estimatedWaitTime / 60);
          const waitingMessage: ChatMessage = {
            id: generateId(),
            text: `Bir temsilcimiz en kısa sürede sizinle ilgilenecektir. Tahmini bekleme süresi: ${estimatedMinutes} dakika. ⏱️`,
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
        const { userId, isConnected, agentRequests } = get();
        
        // Request bilgilerini al (customer bilgileri için)
        const request = agentRequests.find(r => r.id === requestId);
        
        // WebSocket'e bağlan (eğer bağlı değilse)
        if (!isConnected && userId) {
          get().connect(userId, 'agent', requestId);
        }

        // Accept message gönder (customer bilgileri ile birlikte)
        setTimeout(() => {
          sendWebSocketMessage('accept_chat', {
            sessionId: requestId,
            agentId,
            agentName,
            customerId: request?.customerId,
            customerName: request?.customerName,
            customerEmail: request?.customerEmail
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

        // Benzersiz message ID oluştur
        const messageId = generateId();

        // WebSocket üzerinden gönder
        if (isConnected) {
          sendWebSocketMessage('send_message', {
            sessionId: requestId,
            message: text.trim(),
            senderType: 'agent',  // HATA DÜZELTİLDİ: userType yerine senderType kullan
            agentId: userId,
            messageId  // ID'yi de gönder ki karşı taraf tanıyabilsin
          });
        }

        // Local state'e ekle
        const agentMessage: ChatMessage = {
          id: messageId,
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
        console.log('[LiveChatStore] fetchWaitingSessions called');
        const result = await getWaitingSessions();
        console.log('[LiveChatStore] getWaitingSessions result:', result);
        if (result.success && result.data) {
          console.log('[LiveChatStore] Found', result.data.length, 'waiting sessions');
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

            console.log('[LiveChatStore] Adding', newRequests.length, 'new requests');
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
            // Zaten bağlıysa tekrar mesaj ekleme
            if (get().agentConnected) {
              console.log('[LiveChatStore] Agent already connected, ignoring duplicate message');
              break;
            }
            
            // Timeout'u temizle (temsilci zamanında bağlandı)
            const { waitingTimeoutId } = get();
            if (waitingTimeoutId) {
              clearTimeout(waitingTimeoutId);
              console.log('[LiveChatStore] Waiting timeout cleared - agent connected');
            }
            
            set({
              agentConnected: true,
              agentName: data.agentName || data.agentId || 'Temsilci',
              waitingForAgent: false,
              queuePosition: null,
              botMode: false,
              waitingTimeoutId: null
            });

            // Agent bağlandı mesajı - sadece ilk seferde
            get().addMessage({
              text: data.message || 'Müşteri temsilciniz bağlandı. Size nasıl yardımcı olabilirim?',
              sender: 'agent',
              isRead: false
            });
            break;

          case 'new_message':
            if (data.message) {
              const messageId = data.message.messageId || data.message.id || generateId();
              const currentState = get();
              
              // ÖNEMLİ: Session ID kontrolü - başka session'dan gelen mesajı görmezden gel
              // Admin (agent) sadece kendi aktif session'larının mesajlarını görmeli
              // Müşteri (customer) sadece kendi session'ının mesajlarını görmeli
              const messageSessionId = data.sessionId;
              const mySessionId = currentState.sessionId;
              
              // Eğer sessionId var ve benim session'ım değilse, bu mesaj bana değil
              if (messageSessionId && mySessionId && messageSessionId !== mySessionId) {
                console.log('[LiveChatStore] Message for different session, ignoring:', {
                  messageSessionId,
                  mySessionId
                });
                break;
              }
              
              // Mesajın sender'ını belirle (backend 'customer' veya 'agent' gönderir)
              const rawSenderType = data.message.senderType || data.message.sender;
              console.log('[LiveChatStore] New message received:', { 
                messageId, 
                rawSenderType, 
                myUserType: currentState.userType,
                text: data.message.text?.substring(0, 20),
                sessionId: messageSessionId
              });
              
              // Duplicate kontrolü - zaten eklenmişse tekrar ekleme
              if (currentState.messages.some(m => m.id === messageId)) {
                console.log('[LiveChatStore] Duplicate message ignored:', messageId);
                break;
              }
              
              // Backend 'customer' veya 'agent' gönderiyor
              // Frontend'de 'user' (customer), 'agent', veya 'bot' kullanıyoruz
              const normalizedSenderType = rawSenderType === 'customer' ? 'user' : 
                                           rawSenderType === 'agent' ? 'agent' : 
                                           rawSenderType === 'user' ? 'user' : 'bot';
              
              // Bu benim gönderdiğim mesaj mı?
              const isMyOwnMessage = 
                (currentState.userType === 'customer' && (rawSenderType === 'customer' || rawSenderType === 'user')) ||
                (currentState.userType === 'agent' && rawSenderType === 'agent');
              
              if (isMyOwnMessage) {
                console.log('[LiveChatStore] Own message from broadcast, ignoring');
                break;
              }
              
              // Karşı taraftan gelen mesaj - ekle
              console.log('[LiveChatStore] Adding message from other side:', normalizedSenderType);
              const message: ChatMessage = {
                id: messageId,
                text: data.message.content || data.message.text,
                sender: normalizedSenderType,
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
            console.log('[LiveChatStore] New waiting customer received:', data);
            console.log('[LiveChatStore] Current userType:', userType);
            
            // Admin paneli için yeni müşteri bildirimi
            // VEYA müşteri kendi talebini görebilsin diye userType kontrolü kaldırılabilir
            if (data.sessionId) {
              set((state) => {
                // Zaten kayıtlı mı kontrol et
                if (state.agentRequests.some(r => r.id === data.sessionId)) {
                  console.log('[LiveChatStore] Request already exists:', data.sessionId);
                  return state;
                }

                console.log('[LiveChatStore] Adding new request to agentRequests');
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
            // Session ID kontrolü - sadece ilgili session'a kapatma bildirimi gitmeli
            const closedSessionId = data.sessionId;
            const mySessionId = get().sessionId;
            
            console.log('[LiveChatStore] chat_closed received:', { closedSessionId, mySessionId, userType });
            
            // Eğer session ID var ve benim session'ım değilse, görmezden gel
            if (closedSessionId && mySessionId && closedSessionId !== mySessionId) {
              console.log('[LiveChatStore] chat_closed for different session, ignoring');
              break;
            }
            
            // Müşteri için state güncelle (sadece kendi session'ı kapatıldıysa)
            if (userType === 'customer') {
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
            }
            
            // Admin (agent) için session'ı listeden kaldır
            if (userType === 'agent' && closedSessionId) {
              console.log('[LiveChatStore] Removing closed session from active sessions:', closedSessionId);
              set((state) => ({
                activeSessions: state.activeSessions.filter(s => s.id !== closedSessionId && s.sessionId !== closedSessionId),
                agentRequests: state.agentRequests.filter(r => r.id !== closedSessionId && r.sessionId !== closedSessionId)
              }));
            }
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
        // Sadece okunmamış mesaj sayısını sakla, mesajların tamamını saklama
        // Bu sayede sayfa yenilendiğinde yeni sohbet başlar
        unreadCount: state.unreadCount
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
