import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  isRead?: boolean;
}

// Agent isteği tipi
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
  // Agent requests for admin panel
  agentRequests: AgentRequest[];
  activeSessions: AgentRequest[];
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  setAgentTyping: (isTyping: boolean) => void;
  connect: (userId: string, type: 'customer' | 'agent') => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendTyping: () => void;
  closeSession: () => void;
  requestAgent: (userInfo?: { userId: string; userName: string; userEmail: string }) => void;
  markAsRead: () => void;
  // Admin actions
  getAgentRequests: () => AgentRequest[];
  acceptRequest: (requestId: string) => void;
  completeRequest: (requestId: string) => void;
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

      connect: (_userId, _type) => {
        set({ 
          isConnected: true, 
          connectionStatus: 'connected',
        });
        
        // Eğer mesaj yoksa karşılama mesajı ekle
        const { messages } = get();
        if (messages.length === 0) {
          setTimeout(() => {
            get().addMessage({
              text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
              sender: 'bot',
            });
          }, 500);
        }
      },

      disconnect: () => {
        set({ 
          isConnected: false, 
          connectionStatus: 'disconnected',
          agentName: null,
        });
      },

      sendMessage: (text) => {
        // Kullanıcı mesajını ekle
        get().addMessage({
          text,
          sender: 'user',
        });

        const { waitingForAgent } = get();
        
        // Eğer temsilci beklenmiyorsa bot yanıt verir
        if (!waitingForAgent) {
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
        // Typing indicator logic
      },

      closeSession: () => {
        set({
          connectionStatus: 'disconnected',
          agentName: null,
          queuePosition: null,
          waitingForAgent: false,
        });
      },

      requestAgent: (userInfo) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userId = userInfo?.userId || `guest_${Date.now()}`;
        const userName = userInfo?.userName || 'Misafir Kullanıcı';
        const userEmail = userInfo?.userEmail || 'misafir@atushome.com';
        
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
        
        set({ 
          waitingForAgent: true, 
          queuePosition: 1,
          agentRequests: [...get().agentRequests, newRequest],
        });
        
        // Simülasyon: Temsilci yanıtı
        setTimeout(() => {
          get().addMessage({
            text: 'Bir temsilcimiz en kısa sürede sizinle ilgilenecektir. Lütfen bekleyin... 🕐',
            sender: 'agent',
          });
        }, 1000);
      },

      getAgentRequests: () => {
        return get().agentRequests;
      },

      acceptRequest: (requestId: string) => {
        set((state) => {
          // Zaten aktifse tekrar ekleme
          if (state.activeSessions.some(req => req.id === requestId)) {
            return { agentRequests: state.agentRequests };
          }
          
          const request = state.agentRequests.find(req => req.id === requestId);
          if (!request) return { agentRequests: state.agentRequests };
          
          return {
            agentRequests: state.agentRequests.map(req =>
              req.id === requestId ? { ...req, status: 'active' as const } : req
            ),
            activeSessions: [...state.activeSessions, { ...request, status: 'active' as const }],
          };
        });
      },

      completeRequest: (requestId: string) => {
        set((state) => ({
          agentRequests: state.agentRequests.map(req =>
            req.id === requestId ? { ...req, status: 'completed' as const } : req
          ),
          activeSessions: state.activeSessions.filter(req => req.id !== requestId),
        }));
      },

      markAsRead: () => {
        set({ unreadCount: 0 });
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
