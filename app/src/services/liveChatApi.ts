/**
 * Live Chat API Service
 * WebSocket ve HTTP API entegrasyonu için merkezi servis
 */

// API Configuration
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || '';
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || '';

// Mock mode detection
const isMockMode = !CHAT_API_URL || CHAT_API_URL.includes('your-api') || !CHAT_WS_URL || CHAT_WS_URL.includes('your-api');

console.log('[LiveChat] API URL:', CHAT_API_URL || '(mock mode)');
console.log('[LiveChat] WS URL:', CHAT_WS_URL || '(mock mode)');
console.log('[LiveChat] Mock Mode:', isMockMode);

// Types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'bot' | 'system';
  timestamp: string;
  isRead?: boolean;
  type?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface ChatSession {
  sessionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  agentId?: string;
  agentName?: string;
  status: 'waiting' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  unreadCount: number;
}

export interface AgentRequest {
  id: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed';
  messages: ChatMessage[];
}

// WebSocket Instance
let wsInstance: WebSocket | null = null;
let messageCallbacks: ((data: any) => void)[] = [];
let connectionCallbacks: ((connected: boolean) => void)[] = [];

// Mock data - IN-MEMORY (cross-tab sync için farklı bir yaklaşım)
// Note: localStorage cross-origin çalışmaz, o yüzden memory + polling kullanıyoruz
// GLOBAL MOCK DATA - Tüm sekmeler tarafından paylaşılan
// window objesi üzerinde saklanıyor ki tüm sekmeler erişebilsin
function getMockSessions(): Map<string, ChatSession> {
  if (typeof window === 'undefined') return new Map();
  
  // @ts-ignore
  if (!window.__LIVECHAT_MOCK_SESSIONS__) {
    // @ts-ignore
    window.__LIVECHAT_MOCK_SESSIONS__ = new Map();
    console.log('[LiveChat] Created global mock sessions');
  }
  
  // @ts-ignore
  return window.__LIVECHAT_MOCK_SESSIONS__;
}

const mockConnections: Map<string, any> = new Map();

// Mock Broadcast Channel (cross-tab communication)
const BROADCAST_CHANNEL = 'livechat-mock-broadcast';

/**
 * Bot yanıtları - Gelişmiş AI benzeri yanıtlar
 */
const botResponses: Array<{
  keywords: string[];
  response: string;
  priority: number;
}> = [
  {
    keywords: ['merhaba', 'selam', 'hey', 'hi', 'hello'],
    response: 'Merhaba! 👋 AtusHome müşteri hizmetlerine hoş geldiniz. Ben yapay zeka asistanınızım. Size nasıl yardımcı olabilirim?',
    priority: 1
  },
  {
    keywords: ['sipariş', 'siparis', 'order'],
    response: 'Siparişinizle ilgili yardımcı olmaktan memnuniyet duyarım. Lütfen sipariş numaranızı paylaşın veya "Siparişlerim" sayfasından takip edebilirsiniz.',
    priority: 2
  },
  {
    keywords: ['kargo', 'cargo', 'teslimat', 'shipping'],
    response: 'Kargo takibi için takip numaranızı yazabilir veya sipariş numaranızı paylaşabilirsiniz. Kargolarınız genellikle 1-3 iş günü içinde teslim edilir.',
    priority: 2
  },
  {
    keywords: ['iade', 'değişim', 'return', 'exchange', 'degisim'],
    response: 'İade ve değişim işlemleri için ürünü orijinal ambalajında, faturasıyla birlikte göndermeniz gerekmektedir. İade süreci hakkında detaylı bilgi almak için canlı destek temsilcimizle görüşebilirsiniz.',
    priority: 2
  },
  {
    keywords: ['şifre', 'sifre', 'password', 'login', 'giriş', 'giris'],
    response: 'Şifrenizi sıfırlamak için "Şifremi Unuttum" sayfasını kullanabilir veya e-posta adresinizi paylaşabilirsiniz. Size özel bir sıfırlama bağlantısı göndereceğiz.',
    priority: 2
  },
  {
    keywords: ['ödeme', 'odeme', 'payment', 'kredi kartı', 'havale'],
    response: 'Kredi kartı, banka havası ve kapıda ödeme seçeneklerimiz bulunmaktadır. Taksit seçenekleri için bilgi almak ister misiniz?',
    priority: 2
  },
  {
    keywords: ['kupon', 'indirim', 'kampanya', 'discount', 'coupon'],
    response: 'Güncel kampanya ve indirimlerimizi görmek için Kampanyalar sayfamızı ziyaret edebilirsiniz. Size özel kupon kodu: ATUS10 (ilk alışverişte %10 indirim)',
    priority: 2
  },
  {
    keywords: ['teşekkür', 'tesekkur', 'sağol', 'sagol', 'thanks', 'thank you'],
    response: 'Rica ederim! 😊 Başka bir konuda yardımcı olabilir miyim?',
    priority: 1
  },
  {
    keywords: ['görüşürüz', 'gorusuruz', 'hoşça kal', 'hoscakal', 'bye', 'goodbye'],
    response: 'Görüşmek üzere! 👋 AtusHome\'u tercih ettiğiniz için teşekkür ederiz. İyi günler dileriz!',
    priority: 1
  },
  {
    keywords: ['temsilci', 'agent', 'canlı destek', 'canli destek', 'insan', 'personel'],
    response: 'Canlı destek temsilcimizle görüşmek istediğinizi anlıyorum. "Canlı Temsilciyle Görüş" butonuna tıklayarak sıraya girebilirsiniz. En kısa sürede sizinle ilgileneceğiz.',
    priority: 3
  }
];

/**
 * Bot yanıtı bul
 */
export function findBotResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();
  
  let bestMatch: { response: string; priority: number } | null = null;
  
  for (const item of botResponses) {
    for (const keyword of item.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        if (!bestMatch || item.priority > bestMatch.priority) {
          bestMatch = { response: item.response, priority: item.priority };
        }
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch.response;
  }
  
  const defaultResponses = [
    'Anladım, bu konuda size daha detaylı yardımcı olmak için canlı destek temsilcimizle görüşebilirsiniz. "Canlı Temsilciyle Görüş" butonuna tıklayabilirsiniz.',
    'Bu konuda size yardımcı olmam için biraz daha detay verebilir misiniz? Ya da canlı destek temsilcimizle görüşmek isterseniz butona tıklayabilirsiniz.',
    'Bu sorunuzu anladım. En doğru bilgi için canlı destek temsilcimiz size yardımcı olabilir. Bağlanmak ister misiniz?'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * WebSocket bağlantısı oluştur
 */
export function connectWebSocket(
  userId: string,
  userType: 'customer' | 'agent',
  sessionId?: string,
  onMessage?: (data: any) => void,
  onConnect?: (connected: boolean) => void
): WebSocket | null {
  if (onMessage) messageCallbacks.push(onMessage);
  if (onConnect) connectionCallbacks.push(onConnect);
  
  if (wsInstance?.readyState === WebSocket.OPEN) {
    console.log('[LiveChat] Already connected');
    onConnect?.(true);
    return wsInstance;
  }
  
  if (isMockMode) {
    console.log('[LiveChat] Mock WebSocket mode - userType:', userType);
    simulateWebSocket(userId, userType, sessionId);
    return null;
  }
  
  try {
    const params = new URLSearchParams();
    params.append('userId', userId);
    params.append('userType', userType);
    if (sessionId) params.append('sessionId', sessionId);
    
    const wsUrl = `${CHAT_WS_URL}?${params.toString()}`;
    console.log('[LiveChat] Connecting to:', wsUrl);
    
    wsInstance = new WebSocket(wsUrl);
    
    wsInstance.onopen = () => {
      console.log('[LiveChat] WebSocket connected');
      connectionCallbacks.forEach(cb => cb(true));
    };
    
    wsInstance.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[LiveChat] Received:', data);
        messageCallbacks.forEach(cb => cb(data));
      } catch (error) {
        console.error('[LiveChat] Parse error:', error);
      }
    };
    
    wsInstance.onclose = () => {
      console.log('[LiveChat] WebSocket disconnected');
      wsInstance = null;
      connectionCallbacks.forEach(cb => cb(false));
    };
    
    wsInstance.onerror = (error) => {
      console.error('[LiveChat] WebSocket error:', error);
      connectionCallbacks.forEach(cb => cb(false));
    };
    
    return wsInstance;
  } catch (error) {
    console.error('[LiveChat] Connection failed:', error);
    connectionCallbacks.forEach(cb => cb(false));
    return null;
  }
}

/**
 * Mock WebSocket simülasyonu
 * NOT: Cross-origin (farklı tarayıcılar) çalışmaz!
 * Aynı tarayıcıda (Chrome) iki sekme kullanın.
 */
function simulateWebSocket(userId: string, userType: 'customer' | 'agent', sessionId?: string) {
  const mockConnectionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  mockConnections.set(mockConnectionId, {
    userId,
    userType,
    sessionId,
    connectedAt: new Date().toISOString()
  });
  
  // Broadcast dinlemeye başla
  listenToBroadcasts((data) => {
    console.log('[LiveChat] Broadcast received:', data.type, 'for userType:', userType);
    messageCallbacks.forEach(cb => cb(data));
  });
  
  // Bağlantı başarılı bildirimi
  setTimeout(() => {
    connectionCallbacks.forEach(cb => cb(true));
    
    if (userType === 'customer' && !sessionId) {
      const newSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        sessionId: newSessionId,
        customerId: userId,
        customerName: 'Müşteri',
        customerEmail: '',
        status: 'waiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        unreadCount: 0
      };
      getMockSessions().set(newSessionId, newSession);
      
      messageCallbacks.forEach(cb => cb({
        type: 'session_created',
        sessionId: newSessionId,
        status: 'waiting'
      }));
    }
  }, 500);
}

/**
 * WebSocket bağlantısını kapat
 */
export function disconnectWebSocket() {
  if (wsInstance) {
    wsInstance.close();
    wsInstance = null;
  }
  messageCallbacks = [];
  connectionCallbacks = [];
  

}

/**
 * Broadcast to all tabs
 */
function broadcastToAllTabs(data: any) {
  if (typeof window === 'undefined') return;
  
  console.log('[LiveChat] Broadcasting:', data.type);
  
  try {
    // BroadcastChannel API
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      channel.postMessage(data);
      channel.close();
    }
    
    // localStorage fallback
    const eventKey = `livechat_bc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    localStorage.setItem(eventKey, JSON.stringify(data));
    setTimeout(() => localStorage.removeItem(eventKey), 500);
  } catch (e) {
    console.error('[LiveChat] Broadcast error:', e);
  }
}

/**
 * Listen to broadcasts
 */
function listenToBroadcasts(callback: (data: any) => void) {
  if (typeof window === 'undefined') return () => {};
  
  // BroadcastChannel
  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      console.log('[LiveChat] BroadcastChannel msg:', event.data.type);
      callback(event.data);
    };
  }
  
  // localStorage fallback
  const handleStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('livechat_bc_') && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        console.log('[LiveChat] localStorage msg:', data.type);
        callback(data);
      } catch (err) {
        console.error('[LiveChat] Parse error:', err);
      }
    }
  };
  window.addEventListener('storage', handleStorage);
  
  return () => {
    channel?.close();
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * WebSocket üzerinden mesaj gönder
 */
export function sendWebSocketMessage(action: string, data: any = {}) {
  if (wsInstance?.readyState === WebSocket.OPEN) {
    const message = { action, ...data, timestamp: new Date().toISOString() };
    wsInstance.send(JSON.stringify(message));
    console.log('[LiveChat] Sent:', action);
    return true;
  }
  
  if (isMockMode) {
    handleMockMessage(action, data);
    return true;
  }
  
  console.error('[LiveChat] WebSocket not connected');
  return false;
}

/**
 * Mock mesaj işleyici
 */
function handleMockMessage(action: string, data: any) {
  console.log('[LiveChat] Mock action:', action);
  
  switch (action) {
    case 'send_message':
      const { sessionId, message, userType } = data;
      const session = getMockSessions().get(sessionId);
      if (session) {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          text: message,
          sender: userType === 'agent' ? 'agent' : 'user',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        session.messages.push(newMessage);
        
        setTimeout(() => {
          broadcastToAllTabs({
            type: 'new_message',
            message: { ...newMessage, senderType: newMessage.sender },
            sessionId
          });
        }, 100);
      }
      break;
      
    case 'request_agent':
      console.log('[LiveChat] Creating new session:', data.sessionId);
      const newSession: ChatSession = {
        sessionId: data.sessionId,
        customerId: data.userId,
        customerName: data.userName,
        customerEmail: data.userEmail,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        unreadCount: 0
      };
      getMockSessions().set(data.sessionId, newSession);
      console.log('[LiveChat] Total sessions:', getMockSessions().size);
      
      setTimeout(() => {
        // Müşteriye queue_status
        messageCallbacks.forEach(cb => cb({
          type: 'queue_status',
          position: 1,
          message: 'Sıranız geldi, temsilci atanması bekleniyor...'
        }));
        
        // Tüm sekmelere broadcast
        const broadcastData = {
          type: 'new_waiting_customer',
          sessionId: data.sessionId,
          customerId: data.userId,
          customerName: data.userName,
          customerEmail: data.userEmail
        };
        messageCallbacks.forEach(cb => cb(broadcastData));
        broadcastToAllTabs(broadcastData);
      }, 500);
      break;
      
    case 'accept_chat':
      const acceptSession = getMockSessions().get(data.sessionId);
      if (acceptSession) {
        acceptSession.status = 'active';
        acceptSession.agentId = data.agentId;
        acceptSession.agentName = data.agentName;
        acceptSession.updatedAt = new Date().toISOString();
      }
      
      setTimeout(() => {
        broadcastToAllTabs({
          type: 'agent_assigned',
          agentId: data.agentId,
          agentName: data.agentName,
          sessionId: data.sessionId,
          message: 'Müşteri temsilciniz bağlandı. Size nasıl yardımcı olabilirim?'
        });
      }, 300);
      break;
      
    case 'close_session':
      const closeSession = getMockSessions().get(data.sessionId);
      if (closeSession) {
        closeSession.status = 'closed';
        closeSession.updatedAt = new Date().toISOString();
      }
      
      setTimeout(() => {
        broadcastToAllTabs({
          type: 'chat_closed',
          sessionId: data.sessionId,
          message: 'Sohbet sonlandırıldı. Başka bir konuda yardımcı olabilir miyim?'
        });
      }, 200);
      break;
  }
}

/**
 * HTTP API: Bekleyen session'ları getir
 */
export async function getWaitingSessions(): Promise<{ success: boolean; data?: ChatSession[]; error?: string }> {
  console.log('[LiveChat] getWaitingSessions called, mock sessions:', getMockSessions().size);
  if (isMockMode) {
    const waiting = Array.from(getMockSessions().values())
      .filter(s => s.status === 'waiting')
      .map(s => ({
        ...s,
        customerName: s.customerName || 'Misafir Kullanıcı',
        customerEmail: s.customerEmail || ''
      }));
    console.log('[LiveChat] Waiting sessions found:', waiting.length);
    return { success: true, data: waiting };
  }
  
  try {
    const response = await fetch(`${CHAT_API_URL}/chat/waiting`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('[LiveChat] API error:', error);
    return { success: false, error: 'Failed to fetch waiting sessions' };
  }
}

/**
 * HTTP API: Agent ata
 */
export async function assignAgent(sessionId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  if (isMockMode) {
    const session = getMockSessions().get(sessionId);
    if (session) {
      session.status = 'active';
      session.agentId = agentId;
      session.updatedAt = new Date().toISOString();
    }
    return { success: true };
  }
  
  try {
    const response = await fetch(`${CHAT_API_URL}/chat/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, agentId })
    });
    if (!response.ok) throw new Error('Failed to assign');
    return await response.json();
  } catch (error) {
    console.error('[LiveChat] API error:', error);
    return { success: false, error: 'Failed to assign agent' };
  }
}

/**
 * HTTP API: Session mesajlarını getir
 */
export async function getSessionMessages(sessionId: string): Promise<{ success: boolean; data?: ChatMessage[]; error?: string }> {
  if (isMockMode) {
    const session = getMockSessions().get(sessionId);
    return { success: true, data: session?.messages || [] };
  }
  
  try {
    const response = await fetch(`${CHAT_API_URL}/chat/${sessionId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('[LiveChat] API error:', error);
    return { success: false, error: 'Failed to fetch messages' };
  }
}

/**
 * HTTP API: Session'ı kapat
 */
export async function closeSessionAPI(sessionId: string): Promise<{ success: boolean; error?: string }> {
  if (isMockMode) {
    const session = getMockSessions().get(sessionId);
    if (session) {
      session.status = 'closed';
      session.updatedAt = new Date().toISOString();
    }
    return { success: true };
  }
  
  try {
    const response = await fetch(`${CHAT_API_URL}/chat/${sessionId}/close`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to close');
    return await response.json();
  } catch (error) {
    console.error('[LiveChat] API error:', error);
    return { success: false, error: 'Failed to close session' };
  }
}

// Export configuration
export { isMockMode, CHAT_API_URL, CHAT_WS_URL };
