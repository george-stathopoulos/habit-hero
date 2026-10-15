import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../src/constants/colors';
import { habitsAPI, childHabitsAPI } from '../../src/services/api';

interface Habit {
  habit_id: string;
  name_el: string;
  name_en: string;
  points: number;
  category: string;
  is_custom: boolean;
}

export default function ManageChildHabits() {
  const router = useRouter();
  const { childId, childName } = useLocalSearchParams<{ childId: string; childName: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [usedByOtherChildren, setUsedByOtherChildren] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Reload data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [childId])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all available habits
      const habits = await habitsAPI.getAll();
      setAllHabits(habits);
      
      // Load currently assigned habits for this child
      const assignment = await childHabitsAPI.getAssignedHabits(childId!);
      setSelectedHabits(new Set(assignment.habit_ids || []));
      
      // Load habits used by all children to show popular ones
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/parent/habits-usage`);
        if (response.ok) {
          const usageData = await response.json();
          setUsedByOtherChildren(new Set(usageData.used_habit_ids || []));
        }
      } catch (e) {
        // Silently fail - this is optional data
      }
      
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης συνηθειών');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = (habitId: string) => {
    const newSelected = new Set(selectedHabits);
    if (newSelected.has(habitId)) {
      newSelected.delete(habitId);
    } else {
      newSelected.add(habitId);
    }
    setSelectedHabits(newSelected);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await childHabitsAPI.assignHabits(childId!, Array.from(selectedHabits));
      Alert.alert(
        'Επιτυχία',
        `Αποθηκεύτηκαν ${selectedHabits.size} συνήθειες για ${childName}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving habits:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης συνηθειών');
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setSelectedHabits(new Set(allHabits.map(h => h.habit_id)));
    setHasChanges(true);
  };

  const selectNone = () => {
    setSelectedHabits(new Set());
    setHasChanges(true);
  };

  // Group habits by category and sort (used habits first)
  const getSortedHabitsByCategory = () => {
    // Sort habits: selected first, then used by other children, then rest
    const sortedHabits = [...allHabits].sort((a, b) => {
      const aSelected = selectedHabits.has(a.habit_id) ? 0 : 1;
      const bSelected = selectedHabits.has(b.habit_id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      
      const aUsed = usedByOtherChildren.has(a.habit_id) ? 0 : 1;
      const bUsed = usedByOtherChildren.has(b.habit_id) ? 0 : 1;
      return aUsed - bUsed;
    });

    const grouped: Record<string, Habit[]> = {};
    
    sortedHabits.forEach((habit: Habit) => {
      // Get categories array, or fallback to single category
      const categories = (habit as any).categories || [habit.category];
      
      // Add habit to each category it belongs to
      categories.forEach((cat: string) => {
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        // Only add if not already in this category
        if (!grouped[cat].find(h => h.habit_id === habit.habit_id)) {
          grouped[cat].push(habit);
        }
      });
    });
    
    return grouped;
  };

  const habitsByCategory = getSortedHabitsByCategory();

  const categoryNames: Record<string, string> = {
    hygiene: 'Υγιεινή',
    school: 'Σχολείο',
    education: 'Εκπαίδευση',
    physical: 'Άθληση',
    health: 'Υγεία',
    social: 'Κοινωνικά',
    responsibility: 'Ευθύνη',
    creativity: 'Δημιουργικότητα',
    organization: 'Οργάνωση',
    environment: 'Περιβάλλον',
    routine: 'Ρουτίνα',
    general: 'Γενικά',
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
          <Text style={styles.loadingText}>Φόρτωση συνηθειών...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Διαχείριση Συνηθειών</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Συνήθειες για {childName}</Text>
          <Text style={styles.headerSubtitle}>
            Επιλέξτε ποιες συνήθειες θα βλέπει το παιδί
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{selectedHabits.size}</Text>
              <Text style={styles.statLabel}>Επιλεγμένες</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{allHabits.length}</Text>
              <Text style={styles.statLabel}>Διαθέσιμες</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={selectAll}>
            <Ionicons name="checkmark-done" size={18} color={COLORS.softGreen} />
            <Text style={styles.quickActionText}>Επιλογή όλων</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={selectNone}>
            <Ionicons name="close-circle-outline" size={18} color={COLORS.warmCoral} />
            <Text style={styles.quickActionText}>Καμία</Text>
          </TouchableOpacity>
        </View>

        {/* Habits by Category */}
        {Object.entries(habitsByCategory).map(([category, habits]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || COLORS.mediumGray }]} />
              <Text style={styles.categoryTitle}>
                {categoryNames[category] || category}
              </Text>
              <Text style={styles.categoryCount}>
                {habits.filter(h => selectedHabits.has(h.habit_id)).length}/{habits.length}
              </Text>
            </View>

            {habits.map((habit) => (
              <View key={habit.habit_id} style={styles.habitItemContainer}>
                <TouchableOpacity
                  style={[
                    styles.habitItem,
                    selectedHabits.has(habit.habit_id) && styles.habitItemSelected,
                  ]}
                  onPress={() => toggleHabit(habit.habit_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitInfo}>
                    <Text style={[
                      styles.habitName,
                      selectedHabits.has(habit.habit_id) && styles.habitNameSelected,
                    ]}>
                      {(habit as any).emoji || '📋'} {habit.name_el}
                    </Text>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitPoints}>+{habit.points} πόντοι</Text>
                      {/* Frequency badge */}
                      {(habit as any).frequency_type && (habit as any).frequency_type !== 'daily' && (
                        <View style={styles.frequencyBadge}>
                          <Text style={styles.frequencyBadgeText}>
                            {(habit as any).frequency_type === 'weekly' ? 'Εβδομ.' : 
                             (habit as any).frequency_type === 'monthly' ? 'Μηνιαία' : 
                             (habit as any).frequency_type === 'once' ? 'Μία φορά' : ''}
                          </Text>
                        </View>
                      )}
                      {(habit as any).frequency_count > 1 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{(habit as any).frequency_count}x</Text>
                        </View>
                      )}
                      {habit.is_custom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                      )}
                      {!habit.is_custom && usedByOtherChildren.has(habit.habit_id) && !selectedHabits.has(habit.habit_id) && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>⭐</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedHabits.has(habit.habit_id) && styles.checkboxSelected,
                  ]}>
                    {selectedHabits.has(habit.habit_id) && (
                      <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    )}
                  </View>
                </TouchableOpacity>
                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editHabitButton}
                  onPress={() => router.push({
                    pathname: '/parent/edit-habit',
                    params: { 
                      habit: JSON.stringify(habit),
                      fromChildId: childId,
                      isAssignedToChild: selectedHabits.has(habit.habit_id) ? 'true' : 'false'
                    }
                  })}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.softBlue} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="save" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Αποθήκευση</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.softBlue,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  habitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  habitItemSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  habitNameSelected: {
    fontWeight: '500',
    color: COLORS.softBlue,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitPoints: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  customBadge: {
    backgroundColor: COLORS.sunnyYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: 10,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  popularBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.softGreen,
    borderColor: COLORS.softGreen,
  },
  habitItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editHabitButton: {
    width: 36,
    height: 36,
    backgroundColor: '#E8F4FD',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  frequencyBadge: {
    backgroundColor: '#E8F0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  frequencyBadgeText: {
    fontSize: 10,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    color: COLORS.warmCoral,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
