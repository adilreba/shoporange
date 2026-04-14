import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cognito from '@/services/cognito';
import { useAuthStore } from '../authStore';
import * as api from '@/services/api';

// Mock API
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    socialLogin: vi.fn(),
  },
  userApi: {
    updateProfile: vi.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Force mock mode for tests
    vi.stubEnv('VITE_FORCE_MOCK_MODE', 'true');
    vi.stubEnv('VITE_API_URL', '');
    
    // Reset store state
    const store = useAuthStore.getState();
    store.logout();
    store.clearError();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('should handle login failure', async () => {
      const result = await useAuthStore.getState().login({
        email: 'wrong@example.com',
        password: 'Wrongpassword123!',
      });

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Geçersiz e-posta veya şifre');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const result = await useAuthStore.getState().register({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('newuser@example.com');
    });

    it('should handle registration failure', async () => {
      // First register the email
      await useAuthStore.getState().register({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      });
      useAuthStore.getState().logout();
      useAuthStore.getState().clearError();

      // Try to register again with same email
      const result = await useAuthStore.getState().register({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      });

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Bu e-posta adresi zaten kullanılıyor');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // First login
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '' },
        tokens: {
          accessToken: 'token',
          idToken: 'token',
          refreshToken: 'token',
          expiresAt: Date.now() + 3600000,
        },
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().tokens).toBeNull();
    });
  });

  describe('initAuth', () => {
    it('should verify valid token on init', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: '2024-01-01',
      };

      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        tokens: {
          accessToken: 'valid-token',
          idToken: 'valid-token',
          refreshToken: 'valid-token',
          expiresAt: Date.now() + 3600000,
        },
      });

      await useAuthStore.getState().initAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('should logout when token is invalid', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        tokens: {
          accessToken: 'invalid-token',
          idToken: 'invalid-token',
          refreshToken: 'invalid-token',
          expiresAt: Date.now() + 3600000,
        },
      });

      await useAuthStore.getState().initAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().tokens).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });
      
      useAuthStore.getState().clearError();
      
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
