import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PARENT_THEMES, ThemeType } from '../../src/constants/themes';
import { useParentTheme } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useResponsiveScale } from '../../src/components/ScaledComponents';

export default function ThemeSelectorPage() {
  const router = useRouter();
  const { parentId } = useAuthStore();
  const { themeId, theme, setTheme } = useParentTheme(parentId);
  const { fs, sp, sz } = useResponsiveScale();

  // Debug logging
  console.log('=== THEME SELECTOR DEBUG ===');
  console.log('PARENT_THEMES count:', PARENT_THEMES.length);
  console.log('PARENT_THEMES:', PARENT_THEMES.map(t => ({ id: t.id, name: t.nameEl })));

  const handleSelect = (id: ThemeType) => {
    setTheme(id);
  };

  const currentTheme = PARENT_THEMES.find(t => t.id === themeId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.screenBackground }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.headerTint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.headerTint, fontSize: fs(18) }]}>
          🎨 Θέματα
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: sp(16) }]}
      >
        {/* Current Theme Banner */}
        <View style={[styles.currentBanner, { backgroundColor: currentTheme?.colors.primary }]}>
          <Text style={[styles.currentEmoji, { fontSize: fs(32) }]}>{currentTheme?.emoji}</Text>
          <View>
            <Text style={[styles.currentLabel, { fontSize: fs(12) }]}>Τρέχον Θέμα</Text>
            <Text style={[styles.currentName, { fontSize: fs(18) }]}>{currentTheme?.nameEl}</Text>
          </View>
        </View>

        {/* Counter */}
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: fs(18) }]}>
            Διαθέσιμα Θέματα
          </Text>
          <View style={[styles.counter, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.counterText, { fontSize: fs(14) }]}>{PARENT_THEMES.length}</Text>
          </View>
        </View>

        {/* Themes Grid - Badge Style */}
        <View style={styles.themesGrid}>
          {PARENT_THEMES.map((t) => {
            const isSelected = themeId === t.id;
            
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeCard,
                  { backgroundColor: t.colors.cardBackground },
                  isSelected && { borderColor: t.colors.primary, borderWidth: 3 },
                ]}
                onPress={() => handleSelect(t.id)}
                activeOpacity={0.8}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: t.colors.primary }]}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
                
                {/* Theme Emoji - Like badge icon */}
                <View style={[styles.emojiContainer, { backgroundColor: t.colors.screenBackground }]}>
                  <Text style={[styles.themeEmoji, { fontSize: fs(36) }]}>{t.emoji}</Text>
                </View>
                
                {/* Theme Name */}
                <Text style={[styles.themeName, { color: t.colors.textPrimary, fontSize: fs(14) }]}>
                  {t.nameEl}
                </Text>
                
                {/* Color dots preview */}
                <View style={styles.colorDots}>
                  <View style={[styles.colorDot, { backgroundColor: t.colors.primary }]} />
                  <View style={[styles.colorDot, { backgroundColor: t.colors.secondary }]} />
                  <View style={[styles.colorDot, { backgroundColor: t.colors.accent }]} />
                  <View style={[styles.colorDot, { backgroundColor: t.colors.screenBackground, borderWidth: 1, borderColor: t.colors.mediumGray }]} />
                </View>
                
                {/* Description */}
                <Text style={[styles.themeDesc, { color: t.colors.textSecondary, fontSize: fs(11) }]}>
                  {getThemeDescription(t.id)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: sp(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getThemeDescription(id: ThemeType): string {
  switch (id) {
    case 'default':
      return 'Κλασικά χρώματα για όλους';
    case 'coder':
      return 'Terminal στιλ, πράσινο σε μαύρο';
    case 'minimal':
      return 'Καθαρό, δύο τόνοι, γεωμετρικό';
    case 'princess':
      return 'Ροζ & μωβ για πριγκίπισσες';
    case 'hero':
      return 'Μπλε & πράσινο για ήρωες';
    case 'unicorn':
      return 'Μαγικά παστέλ με ουράνια τόξα';
    case 'ninja':
      return 'Σκοτεινό θέμα με αστέρια';
    case 'nature':
      return 'Πράσινο κήπος με πεταλούδες';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  currentEmoji: {
    
  },
  currentLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  currentName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeEmoji: {
    
  },
  themeName: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeDesc: {
    textAlign: 'center',
  },
});
