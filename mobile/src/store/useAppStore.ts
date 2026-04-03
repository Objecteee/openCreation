import { create } from 'zustand';
import { User, GeneratedContent, Platform } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  points: number;
  setPoints: (points: number) => void;
  currentContent: GeneratedContent | null;
  setCurrentContent: (content: GeneratedContent | null) => void;
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  points: 0,
  setUser: (user) => set({ user, points: user?.points || 0 }),
  setToken: (token) => set({ token }),
  setPoints: (points) => set({ points }),
  currentContent: null,
  setCurrentContent: (content) => set({ currentContent: content }),
  selectedPlatform: 'xiaohongshu',
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  logout: () => set({ user: null, token: null, points: 0, currentContent: null }),
}));
