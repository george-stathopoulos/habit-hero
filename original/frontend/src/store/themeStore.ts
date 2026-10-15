import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeType, getThemeById, defaultTheme } from '../constants/themes';

interface ThemePreferences {
  [userId: string]: ThemeType;
}

interface ThemeState {
  // Store preferences by user ID
  parentThemes: ThemePreferences;
  childThemes: ThemePreferences;
  
  // Current active theme (computed from user)
  currentParentId: string | null;
  currentChildId: string | null;
  
  // Actions
  setParentTheme: (parentId: string, themeId: ThemeType) => void;
  setChildTheme: (childId: string, themeId: ThemeType) => void;
  setCurrentParent: (parentId: string | null) => void;
  setCurrentChild: (childId: string | null) => void;
  
  // Getters
  getParentTheme: (parentId: string) => Theme;
  getChildTheme: (childId: string) => Theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      parentThemes: {},
      childThemes: {},
      currentParentId: null,
      currentChildId: null,
      
      setParentTheme: (parentId: string, themeId: ThemeType) => {
        set((state) => ({
          parentThemes: {
            ...state.parentThemes,
            [parentId]: themeId,
          },
        }));
      },
      
      setChildTheme: (childId: string, themeId: ThemeType) => {
        set((state) => ({
          childThemes: {
            ...state.childThemes,
            [childId]: themeId,
          },
        }));
      },
      
      setCurrentParent: (parentId: string | null) => {
        set({ currentParentId: parentId });
      },
      
      setCurrentChild: (childId: string | null) => {
        set({ currentChildId: childId });
      },
      
      getParentTheme: (parentId: string) => {
        const themeId = get().parentThemes[parentId] || 'default';
        return getThemeById(themeId);
      },
      
      getChildTheme: (childId: string) => {
        const themeId = get().childThemes[childId] || 'default';
        return getThemeById(themeId);
      },
    }),
    {
      name: 'habit-hero-themes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        parentThemes: state.parentThemes,
        childThemes: state.childThemes,
      }),
    }
  )
);

// Hook for parent theme
export const useParentTheme = (parentId: string | null) => {
  const { parentThemes, setParentTheme, getParentTheme } = useThemeStore();
  
  const themeId = parentId ? (parentThemes[parentId] || 'default') : 'default';
  const theme = parentId ? getParentTheme(parentId) : defaultTheme;
  
  const setTheme = (newThemeId: ThemeType) => {
    if (parentId) {
      setParentTheme(parentId, newThemeId);
    }
  };
  
  return { themeId, theme, setTheme };
};

// Hook for child theme
export const useChildTheme = (childId: string | null) => {
  const { childThemes, setChildTheme, getChildTheme } = useThemeStore();
  
  const themeId = childId ? (childThemes[childId] || 'default') : 'default';
  const theme = childId ? getChildTheme(childId) : defaultTheme;
  
  const setTheme = (newThemeId: ThemeType) => {
    if (childId) {
      setChildTheme(childId, newThemeId);
    }
  };
  
  return { themeId, theme, setTheme };
};
