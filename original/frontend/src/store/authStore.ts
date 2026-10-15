import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type UserRole = 'parent' | 'child' | null;
export type Gender = 'boy' | 'girl';

interface FamilyInfo {
  parentId: string;
  parentName: string;
  children: Array<{ child_id: string; name: string; avatar_id: number; gender?: string }>;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  userId: string | null;
  name: string | null;
  email: string | null;
  picture: string | null;
  avatar: string | null;  // Emoji avatar or 'photo' indicator
  avatarType: 'default' | 'emoji' | 'photo';  // Type of avatar
  childId: string | null;
  gender: Gender | null;  // Child's gender for gendered text
  sessionToken: string | null;
  parentId: string | null;
  // Device family info (persists after logout)
  familyInfo: FamilyInfo | null;
  hasFamily: boolean;
  // Flag to indicate parent explicitly logged out (requires Google re-auth)
  parentLoggedOut: boolean;
  setLoading: (loading: boolean) => void;
  setParentAuth: (data: { userId: string; name: string; email: string; picture?: string; sessionToken: string }) => void;
  setChildAuth: (data: { childId: string; name: string; gender?: string; parentId: string; sessionToken: string }) => void;
  setFamilyInfo: (info: FamilyInfo) => void;
  setName: (name: string) => void;
  setAvatar: (avatar: string | null, avatarType: 'default' | 'emoji' | 'photo') => void;
  logout: () => void;
  parentLogout: () => void;  // Explicit parent logout requiring Google re-auth
  clearFamily: () => void;
  loadSession: () => Promise<void>;
  updateFamilyChildren: (children: Array<{ child_id: string; name: string; avatar_id: number }>) => void;
}

const AUTH_STORAGE_KEY = 'habit_hero_auth';
const FAMILY_STORAGE_KEY = 'habit_hero_family';
const PARENT_LOGOUT_KEY = 'habit_hero_parent_logout';

async function saveToStorage(key: string, data: object) {
  const jsonData = JSON.stringify(data);
  if (Platform.OS === 'web') {
    localStorage.setItem(key, jsonData);
  } else {
    await SecureStore.setItemAsync(key, jsonData);
  }
}

async function loadFromStorage(key: string): Promise<object | null> {
  try {
    let jsonData: string | null = null;
    if (Platform.OS === 'web') {
      jsonData = localStorage.getItem(key);
    } else {
      jsonData = await SecureStore.getItemAsync(key);
    }
    if (jsonData) {
      return JSON.parse(jsonData);
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
  return null;
}

async function clearStorage(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  role: null,
  userId: null,
  name: null,
  email: null,
  picture: null,
  avatar: null,
  avatarType: 'default',
  childId: null,
  gender: null,
  sessionToken: null,
  parentId: null,
  familyInfo: null,
  hasFamily: false,
  parentLoggedOut: false,

  setLoading: (loading) => set({ isLoading: loading }),

  setParentAuth: async (data) => {
    // Clear the parentLoggedOut flag when parent successfully authenticates
    await clearStorage(PARENT_LOGOUT_KEY);
    
    await saveToStorage(AUTH_STORAGE_KEY, {
      role: 'parent',
      userId: data.userId,
      name: data.name,
      email: data.email,
      picture: data.picture,
      sessionToken: data.sessionToken,
    });
    
    // Also save/update family info
    const familyInfo: FamilyInfo = {
      parentId: data.userId,
      parentName: data.name,
      children: get().familyInfo?.children || [],
    };
    await saveToStorage(FAMILY_STORAGE_KEY, familyInfo);
    
    set({
      isAuthenticated: true,
      role: 'parent',
      userId: data.userId,
      name: data.name,
      email: data.email,
      picture: data.picture,
      sessionToken: data.sessionToken,
      parentId: data.userId,
      familyInfo,
      hasFamily: true,
      isLoading: false,
      parentLoggedOut: false,
    });
  },

  setChildAuth: async (data) => {
    const gender = (data.gender === 'girl' ? 'girl' : 'boy') as Gender;
    await saveToStorage(AUTH_STORAGE_KEY, {
      role: 'child',
      childId: data.childId,
      name: data.name,
      gender: gender,
      parentId: data.parentId,
      sessionToken: data.sessionToken,
    });
    set({
      isAuthenticated: true,
      role: 'child',
      childId: data.childId,
      name: data.name,
      gender: gender,
      parentId: data.parentId,
      sessionToken: data.sessionToken,
      isLoading: false,
    });
  },

  setFamilyInfo: async (info) => {
    await saveToStorage(FAMILY_STORAGE_KEY, info);
    set({
      familyInfo: info,
      hasFamily: true,
      parentId: info.parentId,
    });
  },

  setName: async (name) => {
    const state = get();
    set({ name });
    
    // Update stored auth data
    if (state.role === 'parent') {
      await saveToStorage(AUTH_STORAGE_KEY, {
        role: 'parent',
        userId: state.userId,
        name: name,
        email: state.email,
        picture: state.picture,
        sessionToken: state.sessionToken,
      });
      
      // Update family info too
      if (state.familyInfo) {
        const updatedFamilyInfo = { ...state.familyInfo, parentName: name };
        await saveToStorage(FAMILY_STORAGE_KEY, updatedFamilyInfo);
        set({ familyInfo: updatedFamilyInfo });
      }
    }
  },

  setAvatar: (avatar, avatarType) => {
    set({ avatar, avatarType });
  },

  updateFamilyChildren: async (children) => {
    const current = get().familyInfo;
    if (current) {
      const updated = { ...current, children };
      await saveToStorage(FAMILY_STORAGE_KEY, updated);
      set({ familyInfo: updated });
    }
  },

  logout: async () => {
    // Only clear auth session, keep family info (for child login)
    await clearStorage(AUTH_STORAGE_KEY);
    set({
      isAuthenticated: false,
      role: null,
      userId: null,
      name: null,
      email: null,
      picture: null,
      childId: null,
      sessionToken: null,
      // Keep familyInfo and hasFamily so children can still login
    });
  },

  parentLogout: async () => {
    // Explicit parent logout - requires Google re-auth
    // Set the parentLoggedOut flag and clear auth
    await saveToStorage(PARENT_LOGOUT_KEY, { loggedOut: true });
    await clearStorage(AUTH_STORAGE_KEY);
    
    // Get current family info to preserve it
    const currentFamilyInfo = get().familyInfo;
    console.log('parentLogout: Preserving familyInfo:', JSON.stringify(currentFamilyInfo));
    
    set({
      isAuthenticated: false,
      role: null,
      userId: null,
      name: null,
      email: null,
      picture: null,
      childId: null,
      sessionToken: null,
      parentLoggedOut: true,
      // Explicitly keep family info
      hasFamily: true,
      familyInfo: currentFamilyInfo,
    });
    
    console.log('parentLogout: State after logout - hasFamily:', get().hasFamily);
  },

  clearFamily: async () => {
    // Clear everything including family info (for complete reset)
    await clearStorage(AUTH_STORAGE_KEY);
    await clearStorage(FAMILY_STORAGE_KEY);
    await clearStorage(PARENT_LOGOUT_KEY);
    // Also clear welcome_seen so they see onboarding again
    if (Platform.OS === 'web') {
      localStorage.removeItem('welcome_seen');
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('welcome_seen');
    }
    set({
      isAuthenticated: false,
      role: null,
      userId: null,
      name: null,
      email: null,
      picture: null,
      childId: null,
      sessionToken: null,
      parentId: null,
      familyInfo: null,
      hasFamily: false,
      parentLoggedOut: false,
    });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      // Check if parent explicitly logged out
      const logoutData = await loadFromStorage(PARENT_LOGOUT_KEY);
      const parentLoggedOut = logoutData && typeof logoutData === 'object' && (logoutData as any).loggedOut === true;
      console.log('loadSession: parentLoggedOut =', parentLoggedOut);
      
      // Load family info first
      const familyData = await loadFromStorage(FAMILY_STORAGE_KEY);
      console.log('loadSession: familyData =', JSON.stringify(familyData));
      
      if (familyData && typeof familyData === 'object') {
        const family = familyData as FamilyInfo;
        console.log('loadSession: Setting hasFamily = true');
        set({
          familyInfo: family,
          hasFamily: true,
          parentId: family.parentId,
          parentLoggedOut,
        });
      } else {
        console.log('loadSession: No family data, hasFamily = false');
        set({ parentLoggedOut, hasFamily: false });
      }

      // Load active session
      const authData = await loadFromStorage(AUTH_STORAGE_KEY);
      console.log('loadSession: authData =', JSON.stringify(authData));
      if (authData && typeof authData === 'object') {
        const stored = authData as any;
        if (stored.role === 'parent' && stored.sessionToken) {
          set({
            isAuthenticated: true,
            role: 'parent',
            userId: stored.userId,
            name: stored.name,
            email: stored.email,
            picture: stored.picture,
            sessionToken: stored.sessionToken,
          });
        } else if (stored.role === 'child' && stored.sessionToken) {
          set({
            isAuthenticated: true,
            role: 'child',
            childId: stored.childId,
            name: stored.name,
            gender: stored.gender || 'boy',
            parentId: stored.parentId,
            sessionToken: stored.sessionToken,
          });
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
