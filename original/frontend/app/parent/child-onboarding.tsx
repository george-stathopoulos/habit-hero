import React, { useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../src/constants/colors';
import { habitsAPI, childHabitsAPI } from '../../src/services/api';
import { Button } from '../../src/components/Button';

// Goals with their associated categories
const GOALS = [
  { id: 'school', name: 'Σχολικές Δραστηριότητες', icon: '📚', categories: ['school'] },
  { id: 'hygiene', name: 'Προσωπική Υγιεινή', icon: '🧼', categories: ['hygiene'] },
  { id: 'physical', name: 'Φυσική Δραστηριότητα', icon: '🏃', categories: ['physical'] },
  { id: 'social', name: 'Κοινωνικές Δεξιότητες', icon: '🤝', categories: ['social'] },
  { id: 'responsibility', name: 'Υπευθυνότητα', icon: '✅', categories: ['responsibility'] },
  { id: 'creativity', name: 'Δημιουργικότητα', icon: '🎨', categories: ['creativity'] },
];

interface Habit {
  habit_id: string;
  name_el: string;
  name_en: string;
  points: number;
  category: string;
  is_custom: boolean;
}

type Step = 'goals' | 'habits';

export default function ChildOnboarding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ childId: string; childName: string }>();
  
  const [step, setStep] = useState<Step>('goals');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (goalId: string) => {
    const newSelected = new Set(selectedGoals);
    if (newSelected.has(goalId)) {
      newSelected.delete(goalId);
    } else {
      newSelected.add(goalId);
    }
    setSelectedGoals(newSelected);
  };

  const handleGoalsNext = async () => {
    if (selectedGoals.size === 0) {
      Alert.alert('Προσοχή', 'Παρακαλώ επιλέξτε τουλάχιστον έναν στόχο');
      return;
    }

    setLoading(true);
    try {
      // Get all habits
      const habits = await habitsAPI.getAll();
      setAllHabits(habits);

      // Get categories from selected goals
      const selectedCategories = new Set<string>();
      selectedGoals.forEach(goalId => {
        const goal = GOALS.find(g => g.id === goalId);
        if (goal) {
          goal.categories.forEach(cat => selectedCategories.add(cat));
        }
      });

      // Pre-select habits that match the selected categories
      const preSelected = new Set<string>();
      habits.forEach((habit: Habit) => {
        if (selectedCategories.has(habit.category)) {
          preSelected.add(habit.habit_id);
        }
      });
      setSelectedHabits(preSelected);
      
      setStep('habits');
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
  };

  const handleSaveHabits = async () => {
    if (selectedHabits.size === 0) {
      Alert.alert('Προσοχή', 'Παρακαλώ επιλέξτε τουλάχιστον μία συνήθεια');
      return;
    }

    setSaving(true);
    try {
      await childHabitsAPI.assignHabits(params.childId!, Array.from(selectedHabits));
      Alert.alert(
        'Επιτυχία!',
        `Αποθηκεύτηκαν ${selectedHabits.size} συνήθειες για ${params.childName}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving habits:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  // Get categories from selected goals for filtering
  const getSelectedCategories = (): Set<string> => {
    const cats = new Set<string>();
    selectedGoals.forEach(goalId => {
      const goal = GOALS.find(g => g.id === goalId);
      if (goal) {
        goal.categories.forEach(cat => cats.add(cat));
      }
    });
    return cats;
  };

  // Group habits by category
  const habitsByCategory = allHabits.reduce((acc, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = [];
    }
    acc[habit.category].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const categoryNames: Record<string, string> = {
    hygiene: 'Υγιεινή',
    school: 'Σχολείο',
    physical: 'Άθληση',
    social: 'Κοινωνικά',
    responsibility: 'Ευθύνη',
    creativity: 'Δημιουργικότητα',
    general: 'Γενικά',
  };

  // Step 1: Goals Selection
  if (step === 'goals') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="close" size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎯 Στόχοι</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Επιλέξτε Στόχους</Text>
            <Text style={styles.subtitle}>
              Τι θέλετε να επικεντρωθεί το {params.childName};
            </Text>
          </View>

          <View style={styles.goalsGrid}>
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoals.has(goal.id) && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.goalEmoji}>{goal.icon}</Text>
                <Text style={[
                  styles.goalName,
                  selectedGoals.has(goal.id) && styles.goalNameSelected,
                ]}>
                  {goal.name}
                </Text>
                {selectedGoals.has(goal.id) && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={loading ? 'Φόρτωση...' : `Επόμενο (${selectedGoals.size} επιλεγμένα)`}
            onPress={handleGoalsNext}
            loading={loading}
            disabled={selectedGoals.size === 0}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Habits Selection
  const selectedCategories = getSelectedCategories();
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="close" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Συνήθειες</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={styles.title}>Επιλέξτε Συνήθειες</Text>
          <Text style={styles.subtitle}>
            Προτείνονται βάσει των στόχων σας. Μπορείτε να προσαρμόσετε.
          </Text>
        </View>

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {selectedHabits.size} συνήθειες επιλεγμένες
          </Text>
        </View>

        {/* Recommended habits (from selected categories) */}
        {Array.from(selectedCategories).map((category) => {
          const habits = habitsByCategory[category] || [];
          if (habits.length === 0) return null;
          
          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || COLORS.mediumGray }]} />
                <Text style={styles.categoryTitle}>
                  {categoryNames[category] || category}
                </Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Προτεινόμενα</Text>
                </View>
              </View>

              {habits.map((habit) => (
                <TouchableOpacity
                  key={habit.habit_id}
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
                      {habit.name_el}
                    </Text>
                    <Text style={styles.habitPoints}>+{habit.points} πόντοι</Text>
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
              ))}
            </View>
          );
        })}

        {/* Other habits */}
        {Object.entries(habitsByCategory)
          .filter(([category]) => !selectedCategories.has(category))
          .map(([category, habits]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] || COLORS.mediumGray }]} />
                <Text style={styles.categoryTitle}>
                  {categoryNames[category] || category}
                </Text>
              </View>

              {habits.map((habit) => (
                <TouchableOpacity
                  key={habit.habit_id}
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
                      {habit.name_el}
                    </Text>
                    <Text style={styles.habitPoints}>+{habit.points} πόντοι</Text>
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
              ))}
            </View>
          ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('goals')}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.mediumGray} />
            <Text style={styles.backButtonText}>Πίσω</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Button
              title={`Αποθήκευση (${selectedHabits.size})`}
              onPress={handleSaveHabits}
              loading={saving}
              disabled={selectedHabits.size === 0}
            />
          </View>
        </View>
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  goalCardSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  goalEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  goalNameSelected: {
    color: COLORS.softBlue,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.softBlue,
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
  recommendedBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  habitPoints: {
    fontSize: 12,
    color: COLORS.mediumGray,
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
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});
