import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import * as cognito from '@/services/cognito';
import * as googleAuth from '@/services/googleAuth';

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
        try {
          set({ isLoading: true });
          
          // Check for existing Cognito session
          const session = await cognito.getCurrentSession();
          
          if (session) {
            // Check if token needs refresh
            if (cognito.needsTokenRefresh(session.tokens)) {
              try {
                const newTokens = await cognito.refreshSession(session.tokens.refreshToken);
                set({ 
                  user: session.user as User, 
                  tokens: { ...session.tokens, ...newTokens },
                  isAuthenticated: true,
                  isLoading: false 
                });
              } catch (refreshError) {
                // Refresh failed, clear session
                await cognito.signOut();
                set({ 
                  user: null, 
                  tokens: null, 
                  isAuthenticated: false,
                  isLoading: false 
                });
              }
            } else {
              set({ 
                user: session.user as User, 
                tokens: session.tokens,
                isAuthenticated: true,
                isLoading: false 
              });
            }
          } else {
            set({ 
              user: null, 
              tokens: null, 
              isAuthenticated: false,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ 
            user: null, 
            tokens: null, 
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          const result = await cognito.signIn({
            email: credentials.email,
            password: credentials.password,
          });
          
          set({ 
            user: { ...result.user, createdAt: result.user.createdAt || new Date().toISOString() } as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          
          // Handle specific Cognito errors
          if (error.code === 'UserNotConfirmedException') {
            set({ 
              needsVerification: true,
              pendingVerificationEmail: credentials.email,
              error: 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.',
              isLoading: false 
            });
            return false;
          }
          
          if (error.code === 'NotAuthorizedException' || error.code === 'UserNotFoundException') {
            set({ 
              error: 'Geçersiz e-posta veya şifre',
              isLoading: false 
            });
            return false;
          }
          
          const errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          await cognito.signUp({
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone,
          });
          
          // Registration successful, but needs email verification
          set({ 
            needsVerification: true,
            pendingVerificationEmail: data.email,
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Register error:', error);
          
          if (error.code === 'UsernameExistsException') {
            set({ 
              error: 'Bu e-posta adresi zaten kullanılıyor',
              isLoading: false 
            });
            return false;
          }
          
          if (error.code === 'InvalidPasswordException') {
            set({ 
              error: 'Şifre en az 8 karakter, büyük/küçük harf ve rakam içermelidir',
              isLoading: false 
            });
            return false;
          }
          
          const errorMessage = error.message || 'Kayıt olurken bir hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      verifyEmail: async (code: string) => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await cognito.confirmSignUp(pendingVerificationEmail, code);
          
          set({ 
            needsVerification: false,
            pendingVerificationEmail: null,
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Verification error:', error);
          
          if (error.code === 'CodeMismatchException') {
            set({ 
              error: 'Geçersiz doğrulama kodu',
              isLoading: false 
            });
          } else if (error.code === 'ExpiredCodeException') {
            set({ 
              error: 'Doğrulama kodunun süresi doldu',
              isLoading: false 
            });
          } else {
            set({ 
              error: error.message || 'Doğrulama başarısız oldu',
              isLoading: false 
            });
          }
          return false;
        }
      },

      resendVerificationCode: async () => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await cognito.resendConfirmationCode(pendingVerificationEmail);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Resend code error:', error);
          set({ 
            error: error.message || 'Kod gönderilemedi',
            isLoading: false 
          });
          return false;
        }
      },

      clearVerification: () => {
        set({ 
          needsVerification: false,
          pendingVerificationEmail: null 
        });
      },

      logout: async () => {
        try {
          await cognito.globalSignOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null, 
            tokens: null,
            isAuthenticated: false, 
            error: null,
            needsVerification: false,
            pendingVerificationEmail: null
          });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          return false;
        }
        
        try {
          const newTokens = await cognito.refreshSession(tokens.refreshToken);
          set({ 
            tokens: { ...tokens, ...newTokens }
          });
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear auth state on refresh failure
          set({ 
            user: null, 
            tokens: null,
            isAuthenticated: false 
          });
          return false;
        }
      },

      socialLogin: async (provider: 'google' | 'facebook', token?: string, userData?: any) => {
        set({ isLoading: true, error: null });
        
        try {
          if (!token) {
            set({ 
              error: 'Sosyal medya token bulunamadı', 
              isLoading: false 
            });
            return false;
          }
          
          // Use the backend API for social login
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
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      googleSignIn: async (credential: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await googleAuth.signInWithGoogle(credential);
          
          set({ 
            user: result.user as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Google sign in error:', error);
          set({ 
            error: error.message || 'Google ile giriş yapılırken hata oluştu', 
            isLoading: false 
          });
          return false;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await cognito.forgotPassword(email);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Forgot password error:', error);
          // Always return success to prevent email enumeration
          set({ isLoading: false });
          return true;
        }
      },

      resetPassword: async (email: string, code: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await cognito.confirmForgotPassword(email, code, password);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Reset password error:', error);
          
          if (error.code === 'CodeMismatchException') {
            set({ 
              error: 'Geçersiz sıfırlama kodu',
              isLoading: false 
            });
          } else if (error.code === 'ExpiredCodeException') {
            set({ 
              error: 'Sıfırlama kodunun süresi doldu',
              isLoading: false 
            });
          } else if (error.code === 'InvalidPasswordException') {
            set({ 
              error: 'Şifre gereksinimleri karşılanmıyor',
              isLoading: false 
            });
          } else {
            set({ 
              error: error.message || 'Şifre sıfırlanamadı',
              isLoading: false 
            });
          }
          return false;
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await cognito.changePassword(oldPassword, newPassword);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Change password error:', error);
          
          if (error.code === 'NotAuthorizedException') {
            set({ 
              error: 'Mevcut şifre yanlış',
              isLoading: false 
            });
          } else if (error.code === 'InvalidPasswordException') {
            set({ 
              error: 'Yeni şifre gereksinimleri karşılanmıyor',
              isLoading: false 
            });
          } else {
            set({ 
              error: error.message || 'Şifre değiştirilemedi',
              isLoading: false 
            });
          }
          return false;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        try {
          set({ isLoading: true });
          // TODO: Implement user update via API or Cognito
          set({ 
            user: { ...user, ...userData },
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ 
            error: 'Profil güncellenirken hata oluştu',
            isLoading: false 
          });
          return false;
        }
      },

      addAddress: async (address: Omit<Address, 'id'>) => {
        const { user } = get();
        if (!user) return false;

        try {
          const newAddress = {
            ...address,
            id: `addr_${Date.now()}`
          };
          
          const currentAddresses = user.address || [];
          const updatedAddresses = [...currentAddresses, newAddress];
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
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
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
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
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
          return true;
        } catch (error) {
          set({ error: 'Varsayılan adres ayarlanırken hata oluştu' });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
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

// Uygulama başladığında auth'u initialize et (App.tsx'te kullanılacak)
export const initializeAuth = async () => {
  await useAuthStore.getState().initAuth();
};

// Get access token for API calls
export const getAccessToken = async (): Promise<string | null> => {
  return cognito.getAccessToken();
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  return cognito.getIdToken();
};
