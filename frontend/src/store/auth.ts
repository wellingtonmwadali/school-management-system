import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    }
  },

  login: async (email: string, password: string) => {
    console.log('🔄 Auth store: Starting login process');
    console.log('📍 API URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set');
    
    set({ isLoading: true });
    
    try {
      console.log('📤 Sending login request to /auth/login');
      const res = await api.post('/auth/login', { email, password });
      
      console.log('📥 Login response received:', res.status);
      console.log('📦 Response data:', res.data);
      
      const { token, user } = res.data;
      
      console.log('💾 Saving to localStorage...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✨ Auth store updated successfully');
      console.log('👤 User:', user.name, '| Role:', user.role);
      
      set({ token, user, isLoading: false });
    } catch (error) {
      console.error('🚨 Login error in auth store:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  refreshUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
}));
