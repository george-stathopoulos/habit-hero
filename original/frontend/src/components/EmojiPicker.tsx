import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { HABIT_EMOJI_CATEGORIES, REWARD_EMOJI_CATEGORIES } from '../constants/avatars';

interface EmojiPickerProps {
  type: 'habit' | 'reward';
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ type, selectedEmoji, onSelect }: EmojiPickerProps) {
  const categories = type === 'habit' ? HABIT_EMOJI_CATEGORIES : REWARD_EMOJI_CATEGORIES;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Εικονίδιο</Text>
      
      {/* Selected emoji preview */}
      <View style={styles.selectedPreview}>
        <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
        <Text style={styles.selectedLabel}>Επιλεγμένο</Text>
      </View>
      
      {/* Categories */}
      <ScrollView style={styles.categoriesContainer} nestedScrollEnabled>
        {Object.entries(categories).map(([key, category]) => (
          <View key={key} style={styles.categorySection}>
            {/* Category header - expandable */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(key)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <View style={styles.categoryHeaderRight}>
                <Text style={styles.categoryCount}>{category.emojis.length}</Text>
                <Ionicons
                  name={expandedCategory === key ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.mediumGray}
                />
              </View>
            </TouchableOpacity>
            
            {/* Emojis grid - only show if expanded */}
            {expandedCategory === key && (
              <View style={styles.emojisGrid}>
                {category.emojis.map((emoji, index) => (
                  <TouchableOpacity
                    key={`${key}-${index}`}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => onSelect(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 36,
  },
  selectedLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  categoriesContainer: {
    maxHeight: 300,
  },
  categorySection: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.mediumGray,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 4,
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  emojiButtonSelected: {
    backgroundColor: COLORS.softBlue,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default EmojiPicker;
