import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import * as googleAuth from '@/services/googleAuth';
import { authApi } from '@/services/api';
import { MOCK_USERS } from '@/data/mockUsers';
import { checkPasswordStrength, isValidEmail, ClientRateLimiter } from '@/utils/security';

// Rate limiters for auth operations
const loginRateLimiter = new ClientRateLimiter();
const registerRateLimiter = new ClientRateLimiter();

// Mock mode kontrolü
const FORCE_MOCK_MODE = import.meta.env.VITE_FORCE_MOCK_MODE === 'true';
const isMockMode = () => {
  if (FORCE_MOCK_MODE) return true;
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '') return true;
  if (envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  zipCode: string;
  isDefault: boolean;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsVerification: boolean;
  pendingVerificationEmail: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerificationCode: () => Promise<boolean>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', token?: string, userData?: any) => Promise<boolean>;
  googleSignIn: (credential: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<boolean>;
  removeAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  clearError: () => void;
  clearVerification: () => void;
  initAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  refreshUserFromMock: () => void;
}



export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      needsVerification: false,
      pendingVerificationEmail: null,

      initAuth: async () => {
        console.log('[initAuth] Starting...');
        
        const currentState = get();
        console.log('[initAuth] Current state:', currentState.isAuthenticated, currentState.user?.email, 'role:', currentState.user?.role);
        
        if (currentState.isAuthenticated && currentState.user) {
          const currentUser = currentState.user;
          
          // Mock mode'da Cognito'ya bağlanma, sadece MOCK_USERS'tan senkronize et
          if (isMockMode()) {
            const mockUser = MOCK_USERS.find(u => u.id === currentUser.id) || 
                            MOCK_USERS.find(u => u.email === currentUser.email);
            
            console.log('[initAuth] Found in MOCK_USERS:', mockUser ? { id: mockUser.id, role: mockUser.role } : 'NOT FOUND');
            
            if (mockUser && mockUser.role !== currentUser.role) {
              console.log('[initAuth] UPDATING role:', currentUser.role, '->', mockUser.role);
              set({ 
                user: { ...currentUser, role: mockUser.role as any },
                isLoading: false
              });
              return;
            }
            
            set({ isLoading: false });
            console.log('[initAuth] Finished - mock mode');
            return;
          }
        }
        
        // Gerçek modda backend API üzerinden session doğrula
        const { tokens } = get();
        if (!tokens?.accessToken) {
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          console.log('[initAuth] Finished - no tokens');
          return;
        }
        
        try {
          set({ isLoading: true });
          const userData = await authApi.verifyToken(tokens.idToken);
          set({ 
            user: userData.user as User, 
            isAuthenticated: true,
            isLoading: false 
          });
          console.log('[initAuth] Finished - session valid');
        } catch (error: any) {
          if (error.status === 401 || error.message === 'UNAUTHORIZED') {
            // Token expired, try refresh
            const refreshed = await get().refreshToken();
            if (!refreshed) {
              set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
            }
          } else {
            set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          }
          console.log('[initAuth] Finished - session invalid');
        }
      },

      login: async (credentials: LoginCredentials) => {
        // Rate limiting - brute force protection
        if (!loginRateLimiter.check('login', 5, 300000)) { // 5 deneme, 5 dakika
          set({ 
            error: 'Çok fazla giriş denemesi. Lütfen 5 dakika sonra tekrar deneyin.',
            isLoading: false 
          });
          return false;
        }

        // Input validation
        if (!isValidEmail(credentials.email)) {
          set({ error: 'Geçersiz e-posta formatı', isLoading: false });
          return false;
        }

        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          const result = await authApi.login(credentials.email, credentials.password);
          
          const tokens = {
            accessToken: result.accessToken,
            idToken: result.token,
            refreshToken: result.refreshToken,
            expiresAt: Date.now() + (result.expiresIn * 1000),
          };
          
          set({ 
            user: result.user as User, 
            tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Mock mode'da kullanıcı rolünü MOCK_USERS'tan senkronize et
          if (isMockMode()) {
            setTimeout(() => {
              const updatedUser = MOCK_USERS.find(u => u.id === result.user.id || u.email === result.user.email);
              if (updatedUser && updatedUser.role !== result.user.role) {
                console.log('[AuthStore] Syncing role from MOCK_USERS:', updatedUser.role);
                set({ 
                  user: { 
                    ...result.user, 
                    role: updatedUser.role 
                  } as User 
                });
              }
            }, 100);
          }
          
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          
          // E-posta doğrulanmamışsa doğrulama sayfasına yönlendir
          if (error.message === 'Email not verified. Please check your email.' || error.status === 403) {
            set({ 
              needsVerification: true, 
              pendingVerificationEmail: credentials.email,
              error: 'E-posta adresiniz doğrulanmamış. Lütfen e-postanıza gönderilen kodu girin.',
              isLoading: false 
            });
            return false;
          }
          
          const errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        // Rate limiting
        if (!registerRateLimiter.check('register', 3, 3600000)) { // 3 deneme, 1 saat
          set({ 
            error: 'Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.',
            isLoading: false 
          });
          return false;
        }

        // Email validation
        if (!isValidEmail(data.email)) {
          set({ error: 'Geçersiz e-posta formatı', isLoading: false });
          return false;
        }

        // Password strength validation
        const passwordCheck = checkPasswordStrength(data.password);
        if (!passwordCheck.valid) {
          set({ 
            error: `Şifre güvenlik gereksinimlerini karşılamıyor: ${passwordCheck.feedback.join(', ')}`,
            isLoading: false 
          });
          return false;
        }

        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          if (isMockMode()) {
            const result = await authApi.register(data);
            set({ 
              user: result.user as User, 
              tokens: result.tokens,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }

          await authApi.register(data);
          set({ 
            needsVerification: true,
            pendingVerificationEmail: data.email,
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Register error:', error);
          const errorMessage = error.message || 'Kayıt olurken bir hata oluştu';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      verifyEmail: async (code: string) => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        if (isMockMode()) {
          set({ needsVerification: false, pendingVerificationEmail: null });
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await authApi.verifyEmail(pendingVerificationEmail, code);
          set({ needsVerification: false, pendingVerificationEmail: null, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Doğrulama başarısız oldu', isLoading: false });
          return false;
        }
      },

      resendVerificationCode: async () => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        if (isMockMode()) {
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await authApi.resendVerificationCode(pendingVerificationEmail);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Kod gönderilemedi', isLoading: false });
          return false;
        }
      },

      clearVerification: () => {
        set({ needsVerification: false, pendingVerificationEmail: null });
      },

      logout: async () => {
        if (!isMockMode()) {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        set({ 
          user: null, 
          tokens: null,
          isAuthenticated: false, 
          error: null,
          needsVerification: false,
          pendingVerificationEmail: null
        });
      },

      refreshToken: async () => {
        if (isMockMode()) return true;
        
        const { tokens } = get();
        if (!tokens?.refreshToken) return false;
        
        try {
          const result = await authApi.refreshToken(tokens.refreshToken);
          set({ 
            tokens: {
              accessToken: result.accessToken,
              idToken: result.token,
              refreshToken: result.refreshToken,
              expiresAt: Date.now() + (result.expiresIn * 1000),
            }
          });
          return true;
        } catch (error) {
          set({ user: null, tokens: null, isAuthenticated: false });
          return false;
        }
      },

      socialLogin: async (provider: 'google' | 'facebook', token?: string, userData?: any) => {
        set({ isLoading: true, error: null });
        
        try {
          if (!token) {
            set({ error: 'Sosyal medya token bulunamadı', isLoading: false });
            return false;
          }
          
          if (isMockMode()) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockSocialUser = {
              id: `social-${provider}-${Date.now()}`,
              email: `demo@${provider}.com`,
              name: `${provider} Kullanıcı`,
              role: 'user',
              phone: '',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
              address: [],
              createdAt: new Date().toISOString()
            };
            set({ 
              user: mockSocialUser as User, 
              tokens: {
                accessToken: `mock_token_${mockSocialUser.id}`,
                idToken: `mock_token_${mockSocialUser.id}`,
                refreshToken: `mock_refresh_${mockSocialUser.id}`,
                expiresAt: Date.now() + 3600000,
              },
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
          
          // Gerçek API çağrısı
          const API_URL = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${API_URL}/auth/${provider}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, user: userData }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `${provider} ile giriş başarısız`);
          }
          
          const data = await response.json();
          
          set({ 
            user: data.user, 
            tokens: {
              accessToken: data.accessToken,
              idToken: data.token,
              refreshToken: data.refreshToken,
              expiresAt: Date.now() + (data.expiresIn * 1000),
            },
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          const errorMessage = error.message || `${provider} ile giriş yapılırken hata oluştu`;
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      googleSignIn: async (credential: string) => {
        set({ isLoading: true, error: null });
        
        try {
          if (isMockMode()) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Gerçek Google kullanıcı bilgilerini decode et (credential JWT)
            let userEmail = 'google@demo.com';
            let userName = 'Google Kullanıcı';
            let userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200';
            
            try {
              // JWT token'dan bilgileri çıkar (base64Url decode)
              const base64Url = credential.split('.')[1];
              // Base64Url -> Base64 dönüşümü
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              // Padding ekle
              const pad = base64.length % 4;
              const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
              const decoded = JSON.parse(atob(paddedBase64));
              userEmail = decoded.email || userEmail;
              userName = decoded.name || userName;
              userAvatar = decoded.picture || userAvatar;
            } catch (e) {
              console.log('Google credential decode hatası, demo bilgiler kullanılacak:', e);
            }
            
            // Aynı email var mı kontrol et
            const existingUser = MOCK_USERS.find(u => u.email === userEmail);
            if (existingUser) {
              set({ 
                user: existingUser as User, 
                tokens: {
                  accessToken: `mock_token_${existingUser.id}`,
                  idToken: `mock_token_${existingUser.id}`,
                  refreshToken: `mock_refresh_${existingUser.id}`,
                  expiresAt: Date.now() + 3600000,
                },
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
            
            // Yeni kullanıcı oluştur ve MOCK_USERS'a ekle
            const newUser = {
              id: `google-${Date.now()}`,
              email: userEmail,
              name: userName,
              role: 'user',
              phone: '',
              avatar: userAvatar,
              address: [],
              createdAt: new Date().toISOString()
            };
            
            // Mock diziye ekle (admin panelinde görünmesi için)
            MOCK_USERS.push({ ...newUser, password: 'google_oauth' } as any);
            
            // localStorage'a da kaydet (kalıcı olması için)
            try {
              const saved = localStorage.getItem('google-users');
              const googleUsers = saved ? JSON.parse(saved) : [];
              if (!googleUsers.find((u: any) => u.email === newUser.email)) {
                googleUsers.push({ ...newUser, password: 'google_oauth' });
                localStorage.setItem('google-users', JSON.stringify(googleUsers));
              }
            } catch (e) {
              console.log('localStorage kayıt hatası');
            }
            
            set({ 
              user: newUser as User, 
              tokens: {
                accessToken: `mock_token_${newUser.id}`,
                idToken: `mock_token_${newUser.id}`,
                refreshToken: `mock_refresh_${newUser.id}`,
                expiresAt: Date.now() + 3600000,
              },
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
          
          const result = await googleAuth.signInWithGoogle(credential);
          
          // Kullanıcıyı MOCK_USERS'a ve localStorage'a ekle (admin panelinde görünmesi için)
          const existingMockUser = MOCK_USERS.find(u => u.email === result.user.email);
          if (!existingMockUser) {
            const newMockUser = { 
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              phone: (result.user as any).phone || '',
              avatar: (result.user as any).avatar,
              address: (result.user as any).address || [],
              createdAt: result.user.createdAt,
              password: 'google_oauth'
            };
            MOCK_USERS.push(newMockUser as any);
            
            // localStorage'a da kaydet (kalıcı olması için)
            try {
              const saved = localStorage.getItem('google-users');
              const googleUsers = saved ? JSON.parse(saved) : [];
              if (!googleUsers.find((u: any) => u.email === result.user.email)) {
                googleUsers.push(newMockUser);
                localStorage.setItem('google-users', JSON.stringify(googleUsers));
              }
            } catch (e) {
              console.log('localStorage kayıt hatası');
            }
          }
          
          set({ 
            user: result.user as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Google sign in error:', error);
          set({ error: error.message || 'Google ile giriş yapılırken hata oluştu', isLoading: false });
          return false;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await authApi.forgotPassword(email);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          return true; // Güvenlik için her zaman başarılı döndür
        }
      },

      resetPassword: async (email: string, code: string, password: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await authApi.resetPassword(email, code, password);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Şifre sıfırlanamadı', isLoading: false });
          return false;
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await authApi.changePassword(oldPassword, newPassword);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Şifre değiştirilemedi', isLoading: false });
          return false;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        try {
          set({ isLoading: true });
          set({ 
            user: { ...user, ...userData },
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ error: 'Profil güncellenirken hata oluştu', isLoading: false });
          return false;
        }
      },

      addAddress: async (address: Omit<Address, 'id'>) => {
        const { user } = get();
        if (!user) return false;

        try {
          const newAddress = { ...address, id: `addr_${Date.now()}` };
          const currentAddresses = user.address || [];
          const updatedAddresses = [...currentAddresses, newAddress];
          
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Adres eklenirken hata oluştu' });
          return false;
        }
      },

      removeAddress: async (addressId: string) => {
        const { user } = get();
        if (!user || !user.address) return false;

        try {
          const updatedAddresses = user.address.filter(a => a.id !== addressId);
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Adres silinirken hata oluştu' });
          return false;
        }
      },

      setDefaultAddress: async (addressId: string) => {
        const { user } = get();
        if (!user || !user.address) return false;

        try {
          const updatedAddresses = user.address.map(a => ({
            ...a,
            isDefault: a.id === addressId
          }));
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Varsayılan adres ayarlanırken hata oluştu' });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      refreshUserFromMock: () => {
        // Mock mode'da mevcut kullanıcının bilgilerini MOCK_USERS'tan yenile
        // (Rol değişikliği sonrası kullanıcı state'ini güncellemek için)
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user || !isMockMode()) return;
        
        const updatedUser = MOCK_USERS.find(u => u.id === user.id);
        if (updatedUser) {
          const { password: _, ...userWithoutPassword } = updatedUser;
          set({ user: userWithoutPassword as User });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        needsVerification: state.needsVerification,
        pendingVerificationEmail: state.pendingVerificationEmail,
      }),
    }
  )
);

// Uygulama başladığında auth'u initialize et
export const initializeAuth = async () => {
  await useAuthStore.getState().initAuth();
};

// Mock mode'da mevcut kullanıcının bilgilerini MOCK_USERS'tan yenile
// (Rol değişikliği sonrası kullanıcı state'ini güncellemek için)
export const refreshUserFromMock = () => {
  const state = useAuthStore.getState();
  const { user, isAuthenticated } = state;
  if (!isAuthenticated || !user || !isMockMode()) return;
  
  // ID veya email'e göre ara (Google login kullanıcıları için email eşleşmesi)
  const updatedUser = MOCK_USERS.find(u => u.id === user.id || u.email === user.email);
  if (updatedUser) {
    const { password: _, ...userWithoutPassword } = updatedUser;
    // ID'yi koru (Google login ID'si farklı olabilir)
    useAuthStore.setState({ 
      user: { 
        ...userWithoutPassword, 
        id: user.id // Mevcut ID'yi koru (localStorage persist için)
      } as User 
    });
  }
};

// Get access token for API calls
export const getAccessToken = async (): Promise<string | null> => {
  if (isMockMode()) return 'mock_token';
  return useAuthStore.getState().tokens?.accessToken || null;
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  if (isMockMode()) return 'mock_token';
  return useAuthStore.getState().tokens?.idToken || null;
};
