import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../../src/constants/colors';
import { habitsAPI } from '../../../src/services/api';
import { Button } from '../../../src/components/Button';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Helper function to get frequency label in Greek
const getFrequencyLabel = (habit: any): string => {
  const freqType = habit.frequency_type || 'daily';
  const freqCount = habit.frequency_count || 1;
  const weeklyMode = habit.weekly_mode || 'count';
  const freqDays = habit.frequency_days || [];
  
  const DAYS_SHORT = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
  
  switch (freqType) {
    case 'daily':
      return freqCount === 1 ? '1x/ημέρα' : `${freqCount}x/ημέρα`;
    case 'weekly':
      if (weeklyMode === 'specific' && freqDays.length > 0) {
        const dayLabels = freqDays.map((d: number) => DAYS_SHORT[d]).join(', ');
        return dayLabels;
      }
      return freqCount === 1 ? '1x/εβδομάδα' : `${freqCount}x/εβδομάδα`;
    case 'monthly':
      return freqCount === 1 ? '1x/μήνα' : `${freqCount}x/μήνα`;
    case 'once':
      return 'Μία φορά';
    default:
      return '1x/ημέρα';
  }
};

export default function ParentHabits() {
  const router = useRouter();
  const [habits, setHabits] = useState<any[]>([]);
  const [usedHabitIds, setUsedHabitIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHabits = async () => {
    try {
      const data = await habitsAPI.getAll();
      setHabits(data);
      
      // Load used habits
      try {
        const response = await fetch(`${BACKEND_URL}/api/parent/habits-usage`, {
          credentials: 'include',
        });
        if (response.ok) {
          const usageData = await response.json();
          setUsedHabitIds(new Set(usageData.used_habit_ids || []));
        }
      } catch (e) {
        // Silently fail
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits();
  };

  const handleDeleteHabit = (habitId: string, habitName: string) => {
    Alert.alert(
      'Διαγραφή Συνήθειας',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε τη συνήθεια "${habitName}";`,
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await habitsAPI.delete(habitId);
              setHabits(habits.filter((h) => h.habit_id !== habitId));
            } catch (error: any) {
              Alert.alert('Σφάλμα', error.message);
            }
          },
        },
      ]
    );
  };

  const handleHabitPress = (habit: any) => {
    router.push({
      pathname: '/parent/edit-habit',
      params: { habit: JSON.stringify(habit) },
    });
  };

  const presetHabits = habits.filter((h) => !h.is_custom);
  const customHabits = habits.filter((h) => h.is_custom);
  
  // Sort presets: used ones first
  const sortedPresetHabits = [...presetHabits].sort((a, b) => {
    const aUsed = usedHabitIds.has(a.habit_id) ? 0 : 1;
    const bUsed = usedHabitIds.has(b.habit_id) ? 0 : 1;
    return aUsed - bUsed;
  });
  
  const usedPresets = sortedPresetHabits.filter(h => usedHabitIds.has(h.habit_id));
  const unusedPresets = sortedPresetHabits.filter(h => !usedHabitIds.has(h.habit_id));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.headerTitle}>Διαχείριση Συνηθειών</Text>
      
      {/* Add New Habit Button - Separate */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/parent/add-habit')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Προσθήκη Νέας Συνήθειας</Text>
      </TouchableOpacity>

      {customHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Προσαρμοσμένες Συνήθειες</Text>
          {customHabits.map((habit) => (
            <TouchableOpacity 
              key={habit.habit_id} 
              style={styles.habitCard}
              onPress={() => handleHabitPress(habit)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: CATEGORY_COLORS[habit.category] || COLORS.general },
                ]}
              />
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.emoji || '📋'} {habit.name_el}</Text>
                <View style={styles.habitMeta}>
                  <View style={styles.pointsBadge}>
                    <Ionicons name="star" size={12} color={COLORS.brightYellow} />
                    <Text style={styles.pointsText}>{habit.points}</Text>
                  </View>
                  {/* Frequency badge */}
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>
                      {getFrequencyLabel(habit)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteHabit(habit.habit_id, habit.name_el);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.warmCoral} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Used Habits Section */}
      {usedPresets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Χρησιμοποιούνται</Text>
            <Text style={styles.sectionCount}>{usedPresets.length} συνήθειες</Text>
          </View>
          {usedPresets.map((habit) => (
            <TouchableOpacity 
              key={habit.habit_id} 
              style={[styles.habitCard, styles.usedHabitCard]}
              onPress={() => handleHabitPress(habit)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: CATEGORY_COLORS[habit.category] || COLORS.general },
                ]}
              />
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.emoji || '📋'} {habit.name_el}</Text>
                <View style={styles.habitMeta}>
                  <View style={styles.pointsBadge}>
                    <Ionicons name="star" size={12} color={COLORS.brightYellow} />
                    <Text style={styles.pointsText}>{habit.points}</Text>
                  </View>
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>
                      {getFrequencyLabel(habit)}
                    </Text>
                  </View>
                  <View style={styles.usedBadge}>
                    <Text style={styles.usedBadgeText}>Ενεργή</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Available/Unused Habits Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Διαθέσιμες Συνήθειες</Text>
          <Text style={styles.sectionHint}>Πατήστε για ανάθεση</Text>
        </View>
        {unusedPresets.map((habit) => (
          <TouchableOpacity 
            key={habit.habit_id} 
            style={styles.habitCard}
            onPress={() => handleHabitPress(habit)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CATEGORY_COLORS[habit.category] || COLORS.general },
              ]}
            />
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.emoji || '📋'} {habit.name_el}</Text>
              <View style={styles.habitMeta}>
                <View style={styles.pointsBadge}>
                  <Ionicons name="star" size={12} color={COLORS.brightYellow} />
                  <Text style={styles.pointsText}>{habit.points}</Text>
                </View>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>
                    {getFrequencyLabel(habit)}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.softGreen,
    fontWeight: '500',
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.softBlue,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  usedHabitCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.softGreen,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  habitNameEn: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 6,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  verificationText: {
    fontSize: 10,
    color: COLORS.softBlue,
  },
  usedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  usedBadgeText: {
    fontSize: 10,
    color: COLORS.softGreen,
    fontWeight: '500',
  },
  frequencyBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 10,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
  },
});
