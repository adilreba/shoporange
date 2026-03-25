import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    // Reset store state
    const store = useAuthStore.getState();
    store.logout();
    store.clearError();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: '2024-01-01',
      };
      const mockToken = 'mock-token';

      vi.mocked(api.authApi.login).mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().token).toBe(mockToken);
    });

    it('should handle login failure', async () => {
      vi.mocked(api.authApi.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      const result = await useAuthStore.getState().login({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        name: 'New User',
        role: 'user' as const,
        createdAt: '2024-01-01',
      };
      const mockToken = 'mock-token';

      vi.mocked(api.authApi.register).mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      const result = await useAuthStore.getState().register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should handle registration failure', async () => {
      vi.mocked(api.authApi.register).mockRejectedValueOnce(new Error('Email already exists'));

      const result = await useAuthStore.getState().register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // First login
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '' },
        token: 'token',
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('initAuth', () => {
    it('should verify valid token on init', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: '2024-01-01',
      };

      localStorage.setItem('auth_token', 'valid-token');
      vi.mocked(api.authApi.verifyToken).mockResolvedValueOnce({ user: mockUser });

      await useAuthStore.getState().initAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should logout when token is invalid', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      vi.mocked(api.authApi.verifyToken).mockRejectedValueOnce(new Error('Invalid token'));

      await useAuthStore.getState().initAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
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
