// Theme definitions for Habit Hero
// Separate themes for Parents (mature) and Children (fun/playful)

export type ThemeType = 'default' | 'princess' | 'hero' | 'unicorn' | 'ninja' | 'nature' | 'coder' | 'minimal';

export interface Theme {
  id: ThemeType;
  name: string;
  nameEl: string;
  emoji: string;
  colors: {
    // Primary Colors
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    
    // Neutral Colors
    lightGray: string;
    white: string;
    darkGray: string;
    mediumGray: string;
    
    // Semantic Colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Header/Tab colors
    headerBackground: string;
    headerTint: string;
    tabActive: string;
    tabInactive: string;
    
    // Special
    cardBackground: string;
    progressBar: string;
    pointsColor: string;
    
    // Screen & Text (NEW - for more visual distinction)
    screenBackground: string;
    textPrimary: string;
    textSecondary: string;
    tabBarBackground: string;
  };
  // Optional style modifiers for Minimal theme
  styleModifiers?: {
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    borderRadius?: number;
    fontFamily?: string;
  };
}

// Default Theme (Current - Neutral)
export const defaultTheme: Theme = {
  id: 'default',
  name: 'Classic',
  nameEl: 'Κλασικό',
  emoji: '⭐',
  colors: {
    primary: '#4A90E2',
    secondary: '#F5A623',
    accent: '#7ED321',
    highlight: '#FF6B6B',
    
    lightGray: '#F2F2F2',
    white: '#FFFFFF',
    darkGray: '#333333',
    mediumGray: '#666666',
    
    success: '#7ED321',
    warning: '#F5A623',
    error: '#FF6B6B',
    info: '#4A90E2',
    
    headerBackground: '#4A90E2',
    headerTint: '#FFFFFF',
    tabActive: '#4A90E2',
    tabInactive: '#666666',
    
    cardBackground: '#FFFFFF',
    progressBar: '#F5A623',
    pointsColor: '#F5A623',
    
    // Screen & Text
    screenBackground: '#F2F2F2',
    textPrimary: '#333333',
    textSecondary: '#666666',
    tabBarBackground: '#FFFFFF',
  },
};

// Princess Theme (Girls - Pink/Purple)
export const princessTheme: Theme = {
  id: 'princess',
  name: 'Princess',
  nameEl: 'Πριγκίπισσα',
  emoji: '👑',
  colors: {
    primary: '#E91E8C',
    secondary: '#9B59B6',
    accent: '#FF69B4',
    highlight: '#FFB6C1',
    
    lightGray: '#FFF0F5',
    white: '#FFFFFF',
    darkGray: '#4A235A',
    mediumGray: '#8E44AD',
    
    success: '#FF69B4',
    warning: '#FFB347',
    error: '#FF6B9D',
    info: '#E91E8C',
    
    headerBackground: '#E91E8C',
    headerTint: '#FFFFFF',
    tabActive: '#E91E8C',
    tabInactive: '#C39BD3',
    
    cardBackground: '#FFFFFF',
    progressBar: '#FF69B4',
    pointsColor: '#FFD700',
    
    // Screen & Text - Pink tinted
    screenBackground: '#FFF0F5',
    textPrimary: '#4A235A',
    textSecondary: '#8E44AD',
    tabBarBackground: '#FFF5F8',
  },
};

// Hero Theme (Boys - Blue/Green)
export const heroTheme: Theme = {
  id: 'hero',
  name: 'Hero',
  nameEl: 'Ήρωας',
  emoji: '🦸',
  colors: {
    primary: '#1E88E5',
    secondary: '#00BCD4',
    accent: '#4CAF50',
    highlight: '#FF5722',
    
    lightGray: '#E3F2FD',
    white: '#FFFFFF',
    darkGray: '#1A237E',
    mediumGray: '#3F51B5',
    
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#1E88E5',
    
    headerBackground: '#1E88E5',
    headerTint: '#FFFFFF',
    tabActive: '#1E88E5',
    tabInactive: '#90CAF9',
    
    cardBackground: '#FFFFFF',
    progressBar: '#00BCD4',
    pointsColor: '#FFD700',
    
    // Screen & Text - Blue tinted
    screenBackground: '#E3F2FD',
    textPrimary: '#1A237E',
    textSecondary: '#3F51B5',
    tabBarBackground: '#E8F4FD',
  },
};

// Unicorn Theme (Clouds, Unicorns, Rainbows - Pastel/Magical)
export const unicornTheme: Theme = {
  id: 'unicorn',
  name: 'Unicorn Dreams',
  nameEl: 'Μονόκερος',
  emoji: '🦄',
  colors: {
    primary: '#E879F9',
    secondary: '#A78BFA',
    accent: '#67E8F9',
    highlight: '#FDE047',
    
    lightGray: '#FDF4FF',
    white: '#FFFFFF',
    darkGray: '#701A75',
    mediumGray: '#C084FC',
    
    success: '#86EFAC',
    warning: '#FDBA74',
    error: '#FDA4AF',
    info: '#7DD3FC',
    
    headerBackground: '#E879F9',
    headerTint: '#FFFFFF',
    tabActive: '#A855F7',
    tabInactive: '#D8B4FE',
    
    cardBackground: '#FEFCE8',
    progressBar: '#F472B6',
    pointsColor: '#FACC15',
    
    // Screen & Text - Magical pastel
    screenBackground: '#FDF4FF',
    textPrimary: '#701A75',
    textSecondary: '#A855F7',
    tabBarBackground: '#FEF3FF',
  },
};

// Ninja Theme (Dark with Stars, Moon, Falling Stars)
export const ninjaTheme: Theme = {
  id: 'ninja',
  name: 'Night Ninja',
  nameEl: 'Νίντζα',
  emoji: '🥷',
  colors: {
    primary: '#60A5FA',       // Bright blue (moonlight)
    secondary: '#818CF8',     // Indigo/purple (night sky)
    accent: '#22D3EE',        // Cyan (star glow)
    highlight: '#FCD34D',     // Gold (shooting star)
    
    lightGray: '#1E293B',     // Dark slate (used for borders/dividers)
    white: '#1E293B',         // Dark! (many components use 'white' for backgrounds)
    darkGray: '#F1F5F9',      // Light text on dark (inverted)
    mediumGray: '#94A3B8',    // Silver gray (secondary text)
    
    success: '#34D399',       // Emerald green
    warning: '#FBBF24',       // Amber
    error: '#F87171',         // Red
    info: '#60A5FA',          // Light blue
    
    headerBackground: '#0F172A',   // Very dark header
    headerTint: '#F1F5F9',         // Light text
    tabActive: '#60A5FA',          // Bright blue active
    tabInactive: '#64748B',        // Muted inactive
    
    cardBackground: '#1E293B',     // Dark slate cards
    progressBar: '#818CF8',        // Purple progress
    pointsColor: '#FCD34D',        // Gold stars
    
    // Screen & Text - True dark mode
    screenBackground: '#0F172A',   // Very dark navy
    textPrimary: '#F1F5F9',        // White/light text
    textSecondary: '#94A3B8',      // Silver gray
    tabBarBackground: '#0F172A',   // Dark tab bar
  },
};

// Nature Theme (Butterflies, Ladybugs, Grass, Sun)
export const natureTheme: Theme = {
  id: 'nature',
  name: 'Garden Friends',
  nameEl: 'Κήπος',
  emoji: '🦋',
  colors: {
    primary: '#22C55E',
    secondary: '#84CC16',
    accent: '#F97316',
    highlight: '#FACC15',
    
    lightGray: '#F0FDF4',
    white: '#FFFFFF',
    darkGray: '#166534',
    mediumGray: '#4ADE80',
    
    success: '#4ADE80',
    warning: '#FB923C',
    error: '#EF4444',
    info: '#38BDF8',
    
    headerBackground: '#22C55E',
    headerTint: '#FFFFFF',
    tabActive: '#16A34A',
    tabInactive: '#86EFAC',
    
    cardBackground: '#FEFCE8',
    progressBar: '#84CC16',
    pointsColor: '#FACC15',
    
    // Screen & Text - Fresh garden
    screenBackground: '#ECFDF5',
    textPrimary: '#166534',
    textSecondary: '#15803D',
    tabBarBackground: '#F0FDF4',
  },
};

// ============================================
// PARENT THEMES - Professional/Mature
// ============================================

// Coder Theme (Terminal/Hacker style - green on black)
export const coderTheme: Theme = {
  id: 'coder',
  name: 'Coder',
  nameEl: 'Κώδικας',
  emoji: '💻',
  colors: {
    primary: '#00FF41',           // Matrix green
    secondary: '#00D9FF',         // Cyan accent
    accent: '#FF6B00',            // Orange for highlights
    highlight: '#FFD700',         // Gold for important items
    
    lightGray: '#1A1A1A',         // Dark gray for borders
    white: '#0D0D0D',             // Near black (for backgrounds using 'white')
    darkGray: '#00FF41',          // Matrix green text (inverted for dark mode)
    mediumGray: '#00CC33',        // Dimmer green for secondary text
    
    success: '#00FF41',           // Matrix green
    warning: '#FFD700',           // Gold
    error: '#FF3333',             // Bright red
    info: '#00D9FF',              // Cyan
    
    headerBackground: '#000000',  // Pure black header
    headerTint: '#00FF41',        // Matrix green text
    tabActive: '#00FF41',         // Matrix green active
    tabInactive: '#404040',       // Dark gray inactive
    
    cardBackground: '#111111',    // Very dark card
    progressBar: '#00FF41',       // Matrix green progress
    pointsColor: '#FFD700',       // Gold points
    
    // Screen & Text - Terminal style
    screenBackground: '#000000',  // Pure black
    textPrimary: '#00FF41',       // Matrix green
    textSecondary: '#00CC33',     // Dimmer green
    tabBarBackground: '#0D0D0D',  // Near black
  },
};

// Minimal Theme (Clean two-tone with thin dotted lines)
export const minimalTheme: Theme = {
  id: 'minimal',
  name: 'Minimal',
  nameEl: 'Μινιμαλ',
  emoji: '◻️',
  colors: {
    primary: '#1A1A1A',           // Near black
    secondary: '#666666',         // Medium gray
    accent: '#1A1A1A',            // Black accent
    highlight: '#333333',         // Dark gray highlight
    
    lightGray: '#F5F5F5',         // Very light gray
    white: '#FFFFFF',             // Pure white
    darkGray: '#1A1A1A',          // Near black text
    mediumGray: '#888888',        // Medium gray
    
    success: '#2D2D2D',           // Dark gray (subtle)
    warning: '#4A4A4A',           // Medium dark gray
    error: '#8B0000',             // Dark red (subtle)
    info: '#1A1A1A',              // Near black
    
    headerBackground: '#FFFFFF',  // White header
    headerTint: '#1A1A1A',        // Black text
    tabActive: '#1A1A1A',         // Black active
    tabInactive: '#AAAAAA',       // Light gray inactive
    
    cardBackground: '#FFFFFF',    // White cards
    progressBar: '#1A1A1A',       // Black progress
    pointsColor: '#333333',       // Dark gray points
    
    // Screen & Text - Clean minimal
    screenBackground: '#F8F8F8',  // Off-white
    textPrimary: '#1A1A1A',       // Near black
    textSecondary: '#666666',     // Medium gray
    tabBarBackground: '#FFFFFF',  // White
  },
  styleModifiers: {
    borderStyle: 'dotted',
    borderRadius: 2,              // Square corners
    fontFamily: 'monospace',      // Square/geometric font
  },
};

// ============================================
// THEME ARRAYS
// ============================================

// Child themes - Fun and playful (original childish themes)
export const CHILD_THEMES: Theme[] = [defaultTheme, princessTheme, heroTheme, unicornTheme, ninjaTheme, natureTheme];

// Parent themes - Professional and mature
export const PARENT_THEMES: Theme[] = [defaultTheme, coderTheme, minimalTheme];

// All themes (for backwards compatibility)
export const THEMES: Theme[] = [...CHILD_THEMES];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getThemeById = (id: ThemeType): Theme => {
  // Search in all possible themes
  const allThemes = [...CHILD_THEMES, ...PARENT_THEMES];
  return allThemes.find(t => t.id === id) || defaultTheme;
};

export const getParentThemeById = (id: ThemeType): Theme => {
  return PARENT_THEMES.find(t => t.id === id) || defaultTheme;
};

export const getChildThemeById = (id: ThemeType): Theme => {
  return CHILD_THEMES.find(t => t.id === id) || defaultTheme;
};

// For backwards compatibility with existing COLORS usage
export const getColorsFromTheme = (theme: Theme) => ({
  // Map theme colors to existing COLORS structure
  softBlue: theme.colors.primary,
  brightYellow: theme.colors.pointsColor,
  softGreen: theme.colors.accent,
  warmCoral: theme.colors.highlight,
  
  lightGray: theme.colors.lightGray,
  white: theme.colors.white,
  darkGray: theme.colors.darkGray,
  mediumGray: theme.colors.mediumGray,
  
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.error,
  info: theme.colors.info,
  
  // Category colors remain consistent
  hygiene: '#4A90E2',
  organization: '#9B59B6',
  education: '#3498DB',
  creativity: '#E91E63',
  health: '#7ED321',
  social: '#F5A623',
  environment: '#27AE60',
  responsibility: '#E67E22',
  routine: '#9B59B6',
  general: '#95A5A6',
});
