import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatApi } from '@/services/api';

// WebSocket URL
const WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'wss://faj6241vp7.execute-api.eu-west-1.amazonaws.com/prod';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  isRead?: boolean;
}

interface AgentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed' | 'disconnected';
  messages: Message[];
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  unreadCount: number;
  isAgentTyping: boolean;
  isConnected: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  agentName: string | null;
  queuePosition: number | null;
  waitingForAgent: boolean;
  
  // WebSocket
  ws: WebSocket | null;
  sessionId: string | null;
  userId: string | null;
  userType: 'customer' | 'agent' | null;
  
  // Agent requests for admin panel
  agentRequests: AgentRequest[];
  activeSessions: AgentRequest[];
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  setAgentTyping: (isTyping: boolean) => void;
  
  // WebSocket Actions
  connect: (userId: string, type: 'customer' | 'agent', sessionId?: string) => void;
  disconnect: () => void;
  sendWebSocketMessage: (action: string, data?: any) => void;
  
  // Chat Actions
  sendMessage: (text: string) => void;
  sendTyping: () => void;
  closeSession: () => void;
  requestAgent: (userInfo?: { userId: string; userName: string; userEmail: string }) => void;
  markAsRead: () => void;
  
  // Admin actions
  getAgentRequests: () => AgentRequest[];
  acceptRequest: (requestId: string) => void;
  completeRequest: (requestId: string) => void;
  agentAcceptedChat: (requestId: string, agentName: string) => void;
  sendAgentMessage: (requestId: string, text: string) => void;
  getSessionMessages: (requestId: string) => Message[];
  addCustomerMessage: (requestId: string, text: string) => void;
}

// Mock bot responses
const botResponses: Record<string, string> = {
  'merhaba': 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
  'selam': 'Selam! 👋 Size nasıl yardımcı olabilirim?',
  'nasılsın': 'Teşekkür ederim, ben bir yapay zeka asistanıyım ve size yardımcı olmak için buradayım! 😊',
  'sipariş': 'Siparişinizle ilgili yardımcı olmaktan memnuniyet duyarım. Lütfen sipariş numaranızı paylaşın.',
  'kargo': 'Kargo takibi için takip numaranızı yazabilir veya sipariş numaranızı paylaşabilirsiniz.',
  'iade': 'İade işlemleri için ürünü orijinal ambalajında, faturasıyla birlikte göndermeniz gerekmektedir. Detaylı bilgi için temsilcimizle görüşebilirsiniz.',
  'değişim': 'Değişim işlemi için ürünü orijinal ambalajında göndermeniz gerekiyor.',
  'şifre': 'Şifrenizi sıfırlamak için "Şifremi Unuttum" sayfasını kullanabilirsiniz.',
  'ödeme': 'Kredi kartı, banka havalesi ve kapıda ödeme seçeneklerimiz bulunmaktadır.',
  'teşekkür': 'Rica ederim! 😊 Başka bir konuda yardımcı olabilir miyim?',
  'sağol': 'Rica ederim! Yardımcı olabileceğim başka bir konu var mı?',
  'görüşürüz': 'Görüşmek üzere! 👋 AtusHome\'u tercih ettiğiniz için teşekkür ederiz!',
};

const findBotResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const [key, response] of Object.entries(botResponses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  return 'Bu konuda size daha detaylı yardımcı olmak için bir temsilcimizle görüşmenizi öneririm. Canlı destek butonuna tıklayarak bağlanabilirsiniz.';
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isOpen: false,
      unreadCount: 0,
      isAgentTyping: false,
      isConnected: false,
      connectionStatus: 'idle',
      agentName: null,
      queuePosition: null,
      waitingForAgent: false,
      
      // WebSocket
      ws: null,
      sessionId: null,
      userId: null,
      userType: null,
      
      // Agent requests
      agentRequests: [],
      activeSessions: [],

      setIsOpen: (isOpen) => {
        set({ isOpen });
        if (isOpen) {
          get().markAsRead();
        }
      },

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      clearChat: () => {
        set({ 
          messages: [],
          connectionStatus: 'idle',
          agentName: null,
          queuePosition: null,
          waitingForAgent: false,
        });
      },

      setAgentTyping: (isTyping) => {
        set({ isAgentTyping: isTyping });
      },

      // WebSocket Connection
      connect: (userId, type, sessionId) => {
        const { ws } = get();
        
        console.log(`[WebSocket] ========== CONNECT BAŞLATILIYOR ==========`);
        console.log(`[WebSocket] UserID: ${userId}, Type: ${type}, SessionID: ${sessionId || 'yok'}`);
        console.log(`[WebSocket] Mevcut bağlantı:`, ws ? (ws.readyState === WebSocket.OPEN ? 'AÇIK' : 'KAPALI') : 'YOK');
        
        // Close existing connection
        if (ws) {
          console.log('[WebSocket] Önceki bağlantı kapatılıyor...');
          ws.close();
        }
        
        set({ 
          connectionStatus: 'connecting',
          userId,
          userType: type,
          sessionId: sessionId || null,
        });
        
        try {
          // Build WebSocket URL with query parameters
          const params = new URLSearchParams();
          params.append('userId', userId);
          params.append('userType', type);
          if (sessionId) {
            params.append('sessionId', sessionId);
          }
          
          const wsUrl = `${WS_URL}?${params.toString()}`;
          console.log(`[WebSocket] Bağlantı URL: ${wsUrl}`);
          console.log(`[WebSocket] WebSocket nesnesi oluşturuluyor...`);
          
          const newWs = new WebSocket(wsUrl);
          
          newWs.onopen = () => {
            console.log('[WebSocket] ✅ BAĞLANTI BAŞARILI - onopen tetiklendi');
            console.log('[WebSocket] Bağlantı durumu:', newWs.readyState, '(1 = OPEN)');
            set({ 
              ws: newWs,
              isConnected: true,
              connectionStatus: 'connected',
            });
            
            // Add welcome message if no messages
            const { messages } = get();
            if (messages.length === 0 && type === 'customer') {
              setTimeout(() => {
                get().addMessage({
                  text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
                  sender: 'bot',
                });
              }, 500);
            }
          };
          
          newWs.onmessage = (event) => {
            console.log('[WebSocket] 📩 MESAJ ALINDI:', event.data);
            try {
              const data = JSON.parse(event.data);
              console.log('[WebSocket] Mesaj JSON parse edildi:', data);
              
              handleWebSocketMessage(data, set, get);
            } catch (error) {
              console.error('[WebSocket] Error parsing message:', error);
            }
          };
          
          newWs.onclose = (event) => {
            console.log('[WebSocket] ❌ BAĞLANTI KAPANDI - onclose tetiklendi');
            console.log('[WebSocket] Kapatma kodu:', event.code);
            console.log('[WebSocket] Kapatma nedeni:', event.reason || 'Belirtilmemiş');
            console.log('[WebSocket] Temiz kapanma mı?:', event.wasClean ? 'Evet' : 'Hayır (hata olabilir)');
            set({ 
              ws: null,
              isConnected: false,
              connectionStatus: 'disconnected',
            });
          };
          
          newWs.onerror = (error) => {
            console.error('[WebSocket] ❌ HATA OLUŞTU - onerror tetiklendi');
            console.error('[WebSocket] Hata detayı:', error);
            console.error('[WebSocket] WebSocket durumu:', newWs.readyState);
            // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
            const states = ['CONNECTING (0)', 'OPEN (1)', 'CLOSING (2)', 'CLOSED (3)'];
            console.error('[WebSocket] Durum açıklaması:', states[newWs.readyState] || 'Bilinmiyor');
            set({ 
              ws: null,
              isConnected: false,
              connectionStatus: 'disconnected',
            });
          };
        } catch (error) {
          console.error('[WebSocket] ❌ BAĞLANTI HATASI:', error);
          set({ connectionStatus: 'disconnected' });
        }
      },

      disconnect: () => {
        const { ws } = get();
        console.log('[WebSocket] Manuel bağlantı kesme isteği');
        if (ws) {
          console.log('[WebSocket] Bağlantı kapatılıyor...');
          ws.close();
        } else {
          console.log('[WebSocket] Kapatılacak aktif bağlantı yok');
        }
        set({ 
          ws: null,
          isConnected: false,
          connectionStatus: 'disconnected',
          agentName: null,
        });
      },

      sendWebSocketMessage: (action, data = {}) => {
        const { ws, sessionId, userId, userType } = get();
        
        console.log(`[WebSocket] ========== MESAJ GÖNDERİLİYOR ==========`);
        console.log(`[WebSocket] Action: ${action}`);
        console.log(`[WebSocket] SessionID: ${sessionId}`);
        console.log(`[WebSocket] UserID: ${userId}`);
        console.log(`[WebSocket] UserType: ${userType}`);
        
        if (!ws) {
          console.error('[WebSocket] ❌ GÖNDERİM HATASI: WebSocket nesnesi yok (null)');
          return;
        }
        
        if (ws.readyState !== WebSocket.OPEN) {
          const states = ['CONNECTING (0)', 'OPEN (1)', 'CLOSING (2)', 'CLOSED (3)'];
          console.error(`[WebSocket] ❌ GÖNDERİM HATASI: Bağlantı açık değil. Durum: ${states[ws.readyState]}`);
          return;
        }
        
        const message = {
          action,
          sessionId,
          userId,
          userType,
          ...data,
        };
        
        console.log('[WebSocket] Gönderilen mesaj:', JSON.stringify(message, null, 2));
        
        try {
          ws.send(JSON.stringify(message));
          console.log('[WebSocket] ✅ Mesaj başarıyla gönderildi');
        } catch (error) {
          console.error('[WebSocket] ❌ Mesaj gönderiminde hata:', error);
        }
      },

      sendMessage: (text) => {
        const { waitingForAgent, isConnected, userType } = get();
        
        // Add user message locally
        get().addMessage({
          text,
          sender: 'user',
        });
        
        // If connected to WebSocket and waiting for agent or in active session, send via WebSocket
        if (isConnected && userType === 'customer') {
          get().sendWebSocketMessage('send_message', { message: text });
        }
        
        // If not waiting for agent, provide bot response
        if (!waitingForAgent && userType !== 'agent') {
          set({ isAgentTyping: true });
          
          setTimeout(() => {
            const response = findBotResponse(text);
            get().addMessage({
              text: response,
              sender: 'bot',
            });
            set({ isAgentTyping: false });
          }, 1000 + Math.random() * 1000);
        }
      },

      sendTyping: () => {
        const { isConnected, userType } = get();
        if (isConnected && userType) {
          get().sendWebSocketMessage('typing');
        }
      },

      closeSession: () => {
        const { isConnected } = get();
        if (isConnected) {
          get().sendWebSocketMessage('close_session');
        }
        set({
          connectionStatus: 'disconnected',
          agentName: null,
          queuePosition: null,
          waitingForAgent: false,
          sessionId: null,
        });
      },

      requestAgent: (userInfo) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userId = userInfo?.userId || `guest_${Date.now()}`;
        const userName = userInfo?.userName || 'Misafir Kullanıcı';
        const userEmail = userInfo?.userEmail || 'misafir@atushome.com';
        
        // Create local request
        const newRequest: AgentRequest = {
          id: requestId,
          userId,
          userName,
          userEmail,
          timestamp: new Date().toISOString(),
          status: 'pending',
          messages: [{
            id: `msg_${Date.now()}`,
            text: 'Canlı destek talebi oluşturuldu',
            sender: 'user',
            timestamp: new Date().toISOString(),
          }],
        };
        
        set((state) => ({ 
          waitingForAgent: true, 
          queuePosition: 1,
          agentRequests: [...state.agentRequests, newRequest],
          userId,
        }));
        
        // Connect to WebSocket as customer
        get().connect(userId, 'customer');
        
        // Send request_agent action via WebSocket when connected
        setTimeout(() => {
          const { isConnected } = get();
          if (isConnected) {
            get().sendWebSocketMessage('request_agent', {
              userName,
              userEmail,
            });
          }
        }, 1000);
        
        // Show waiting message
        setTimeout(() => {
          get().addMessage({
            text: 'Bir temsilcimiz en kısa sürede sizinle ilgilenecektir. Lütfen bekleyin... 🕐',
            sender: 'agent',
          });
        }, 1000);
        
        // Try AWS API as backup (for notification to other agents)
        chatApi.requestAgent({
          userId,
          userName,
          userEmail,
        }).catch(error => {
          console.log('[AWS API] Error (may be in mock mode):', error);
        });
      },

      markAsRead: () => {
        set({ unreadCount: 0 });
      },

      getAgentRequests: () => {
        return get().agentRequests;
      },

      acceptRequest: (requestId: string) => {
        const { userId } = get();
        
        set((state) => {
          // Already active
          if (state.activeSessions.some(req => req.id === requestId)) {
            return { agentRequests: state.agentRequests };
          }
          
          const request = state.agentRequests.find(req => req.id === requestId);
          if (!request) return { agentRequests: state.agentRequests };
          
          // Connect to WebSocket as agent with this session
          if (userId) {
            get().connect(userId, 'agent', requestId);
          }
          
          return {
            agentRequests: state.agentRequests.map(req =>
              req.id === requestId ? { ...req, status: 'active' as const } : req
            ),
            activeSessions: [...state.activeSessions, { ...request, status: 'active' as const }],
          };
        });
      },

      completeRequest: (requestId: string) => {
        const { isConnected } = get();
        
        // Send close via WebSocket
        if (isConnected) {
          get().sendWebSocketMessage('close_session');
        }
        
        set((state) => ({
          agentRequests: state.agentRequests.map(req =>
            req.id === requestId ? { ...req, status: 'completed' as const } : req
          ),
          activeSessions: state.activeSessions.filter(req => req.id !== requestId),
        }));
      },

      agentAcceptedChat: (requestId: string, agentName: string) => {
        set((state) => {
          const request = state.agentRequests.find(req => req.id === requestId);
          if (!request) return {};
          
          const agentConnectedMessage: Message = {
            id: `msg_${Date.now()}`,
            text: `${agentName} size bağlandı. Size nasıl yardımcı olabilirim?`,
            sender: 'agent',
            timestamp: new Date().toISOString(),
          };
          
          return {
            messages: [...state.messages, agentConnectedMessage],
            waitingForAgent: false,
            agentName: agentName,
            agentRequests: state.agentRequests.map(req =>
              req.id === requestId 
                ? { ...req, status: 'active' as const, messages: [...req.messages, agentConnectedMessage] } 
                : req
            ),
            activeSessions: state.activeSessions.map(req =>
              req.id === requestId 
                ? { ...req, status: 'active' as const, messages: [...req.messages, agentConnectedMessage] } 
                : req
            ),
          };
        });
      },

      sendAgentMessage: (requestId: string, text: string) => {
        const { isConnected, ws } = get();
        
        const newMessage: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text,
          sender: 'agent',
          timestamp: new Date().toISOString(),
        };
        
        // Send via WebSocket if connected
        if (isConnected && ws?.readyState === WebSocket.OPEN) {
          get().sendWebSocketMessage('send_message', { 
            message: text,
            sessionId: requestId,
          });
        }
        
        // Update local state
        set((state) => ({
          messages: [...state.messages, newMessage],
          agentRequests: state.agentRequests.map(req =>
            req.id === requestId 
              ? { ...req, messages: [...req.messages, newMessage] } 
              : req
          ),
          activeSessions: state.activeSessions.map(req =>
            req.id === requestId 
              ? { ...req, messages: [...req.messages, newMessage] } 
              : req
          ),
        }));
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat-message', { 
            detail: { requestId, message: newMessage } 
          }));
        }
      },

      getSessionMessages: (requestId: string) => {
        const state = get();
        const activeSession = state.activeSessions.find(req => req.id === requestId);
        if (activeSession) return activeSession.messages;
        
        const request = state.agentRequests.find(req => req.id === requestId);
        if (request) return request.messages;
        
        return [];
      },

      addCustomerMessage: (requestId: string, text: string) => {
        set((state) => {
          const newMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text,
            sender: 'user',
            timestamp: new Date().toISOString(),
          };
          
          // Broadcast to other tabs
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chat-message', { 
              detail: { requestId, message: newMessage } 
            }));
          }
          
          return {
            messages: [...state.messages, newMessage],
            agentRequests: state.agentRequests.map(req =>
              req.id === requestId 
                ? { ...req, messages: [...req.messages, newMessage] } 
                : req
            ),
            activeSessions: state.activeSessions.map(req =>
              req.id === requestId 
                ? { ...req, messages: [...req.messages, newMessage] } 
                : req
            ),
          };
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        messages: state.messages,
        unreadCount: state.unreadCount,
        agentRequests: state.agentRequests,
      }),
    }
  )
);

// Handle incoming WebSocket messages
function handleWebSocketMessage(
  data: any, 
  set: any, 
  get: () => ChatState
) {
  const { userType } = get();
  
  switch (data.type) {
    case 'session_created':
      set({ sessionId: data.sessionId });
      break;
      
    case 'agent_assigned':
    case 'agent_joined':
      set({ 
        agentName: data.agentId || 'Temsilci',
        waitingForAgent: false,
      });
      get().addMessage({
        text: data.message || 'Müşteri temsilcimiz bağlandı. Size nasıl yardımcı olabilirim?',
        sender: 'agent',
      });
      break;
      
    case 'new_message':
      const msg = data.message;
      if (msg) {
        const newMessage: Message = {
          id: msg.messageId || `msg_${Date.now()}`,
          text: msg.content || msg.text,
          sender: msg.senderType === 'agent' ? 'agent' : msg.senderType === 'customer' ? 'user' : 'bot',
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        
        set((state: ChatState) => ({
          messages: [...state.messages, newMessage],
        }));
        
        // Also add to session if admin
        if (userType === 'agent' && msg.sessionId) {
          set((state: ChatState) => ({
            activeSessions: state.activeSessions.map(req =>
              req.id === msg.sessionId 
                ? { ...req, messages: [...req.messages, newMessage] } 
                : req
            ),
          }));
          
          // Broadcast for cross-tab sync
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chat-message', { 
              detail: { requestId: msg.sessionId, message: newMessage } 
            }));
          }
        }
      }
      break;
      
    case 'queue_status':
      set({ 
        queuePosition: data.position,
      });
      if (data.message) {
        get().addMessage({
          text: data.message,
          sender: 'agent',
        });
      }
      break;
      
    case 'typing':
      set({ isAgentTyping: true });
      setTimeout(() => set({ isAgentTyping: false }), 3000);
      break;
      
    case 'agent_left':
      get().addMessage({
        text: data.message || 'Temsilcimiz bağlantısı kesildi.',
        sender: 'agent',
      });
      set({ 
        agentName: null,
        waitingForAgent: true,
      });
      break;
      
    case 'chat_closed':
      get().addMessage({
        text: data.message || 'Sohbet sonlandırıldı.',
        sender: 'agent',
      });
      set({ 
        agentName: null,
        waitingForAgent: false,
        connectionStatus: 'disconnected',
      });
      break;
      
    case 'new_waiting_customer':
      // Agent tarafında yeni müşteri bildirimi
      if (userType === 'agent') {
        // Trigger a refresh of waiting sessions
        console.log('[WebSocket] New waiting customer:', data);
      }
      break;
      
    case 'message_sent':
      // Message sent confirmation
      console.log('[WebSocket] Message sent:', data);
      break;
      
    default:
      console.log('[WebSocket] Unknown message type:', data.type);
  }
}
