import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  isRead?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  unreadCount: number;
  isTyping: boolean;
  
  addMessage: (text: string, sender: 'user' | 'bot' | 'agent') => void;
  setIsOpen: (isOpen: boolean) => void;
  markAsRead: () => void;
  setIsTyping: (isTyping: boolean) => void;
  clearChat: () => void;
}

// Auto-responses for common questions
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
      messages: [
        {
          id: 'welcome',
          text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isRead: true,
        }
      ],
      isOpen: false,
      unreadCount: 0,
      isTyping: false,

      addMessage: (text: string, sender: 'user' | 'bot' | 'agent') => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text,
          sender,
          timestamp: new Date().toISOString(),
          isRead: get().isOpen,
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
          unreadCount: sender !== 'user' && !state.isOpen ? state.unreadCount + 1 : state.unreadCount,
        }));

        // Auto-respond to user messages
        if (sender === 'user') {
          set({ isTyping: true });
          
          setTimeout(() => {
            const lowerText = text.toLowerCase();
            let response = '';

            // Check for matching keywords
            for (const [keyword, reply] of Object.entries(autoResponses)) {
              if (lowerText.includes(keyword)) {
                response = reply;
                break;
              }
            }

            // Default response if no keyword matched
            if (!response) {
              response = 'Anladım. Konuyu müşteri temsilcimize aktarıyorum. Lütfen biraz bekleyin...\n\nSıkça sorulan konular: sipariş, kargo, iade, ödeme, indirim, stok';
            }

            set({ isTyping: false });
            get().addMessage(response, 'bot');
          }, 1000 + Math.random() * 1000); // Random delay for natural feel
        }
      },

      setIsOpen: (isOpen: boolean) => {
        set({ isOpen });
        if (isOpen) {
          set({ unreadCount: 0 });
          // Mark all messages as read
          set((state) => ({
            messages: state.messages.map((m) => ({ ...m, isRead: true })),
          }));
        }
      },

      markAsRead: () => {
        set({ unreadCount: 0 });
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, isRead: true })),
        }));
      },

      setIsTyping: (isTyping: boolean) => {
        set({ isTyping });
      },

      clearChat: () => {
        set({
          messages: [
            {
              id: 'welcome',
              text: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?',
              sender: 'bot',
              timestamp: new Date().toISOString(),
              isRead: true,
            }
          ],
          unreadCount: 0,
        });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
