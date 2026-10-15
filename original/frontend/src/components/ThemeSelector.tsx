import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PARENT_THEMES, CHILD_THEMES, ThemeType, defaultTheme } from '../constants/themes';
import { useParentTheme, useChildTheme } from '../store/themeStore';

interface ThemeSelectorProps {
  userType: 'parent' | 'child';
  userId: string | null;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ userType, userId }) => {
  // Use the appropriate hook based on user type
  const parentTheme = useParentTheme(userType === 'parent' ? userId : null);
  const childTheme = useChildTheme(userType === 'child' ? userId : null);
  
  const { themeId, theme, setTheme } = userType === 'parent' ? parentTheme : childTheme;
  
  // Select the appropriate theme list based on user type
  const availableThemes = userType === 'parent' ? PARENT_THEMES : CHILD_THEMES;

  const handleSelect = (id: ThemeType) => {
    setTheme(id);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.darkGray }]}>
        🎨 Επιλογή Θέματος
      </Text>
      <View style={styles.themesRow}>
        {availableThemes.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.themeCard,
              { 
                backgroundColor: t.colors.lightGray,
                borderColor: themeId === t.id ? t.colors.primary : 'transparent',
              },
            ]}
            onPress={() => handleSelect(t.id)}
            activeOpacity={0.7}
          >
            {/* Selected indicator */}
            {themeId === t.id && (
              <View style={[styles.selectedBadge, { backgroundColor: t.colors.primary }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            )}
            
            {/* Theme preview */}
            <Text style={styles.themeEmoji}>{t.emoji}</Text>
            
            {/* Color preview circles */}
            <View style={styles.colorPreview}>
              <View style={[styles.colorDot, { backgroundColor: t.colors.primary }]} />
              <View style={[styles.colorDot, { backgroundColor: t.colors.secondary }]} />
              <View style={[styles.colorDot, { backgroundColor: t.colors.accent }]} />
            </View>
            
            <Text style={[styles.themeName, { color: t.colors.darkGray }]}>
              {t.nameEl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  themesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  themeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
