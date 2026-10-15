import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { childHabitsAPI } from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';

const PRESET_HABITS = [
  { habit_id: 'preset_0', name_el: 'Βούρτσισμα δοντιών', points: 10, category: 'hygiene', emoji: '🦷' },
  { habit_id: 'preset_1', name_el: 'Πλύσιμο χεριών', points: 5, category: 'hygiene', emoji: '🧼' },
  { habit_id: 'preset_2', name_el: 'Στρώσιμο κρεβατιού', points: 10, category: 'organization', emoji: '🛏️' },
  { habit_id: 'preset_3', name_el: 'Καθαρισμός δωματίου', points: 20, category: 'organization', emoji: '🧹' },
  { habit_id: 'preset_4', name_el: 'Κάνοντας τα μαθήματα', points: 25, category: 'education', emoji: '📚' },
  { habit_id: 'preset_5', name_el: 'Ανάγνωση 20-30 λεπτά', points: 20, category: 'education', emoji: '📖' },
  { habit_id: 'preset_6', name_el: 'Ζωγραφική / Δημιουργία', points: 15, category: 'creativity', emoji: '🎨' },
  { habit_id: 'preset_7', name_el: '30 λεπτά άσκηση', points: 20, category: 'health', emoji: '🏃' },
  { habit_id: 'preset_8', name_el: 'Τακτοποίηση παιχνιδιών', points: 10, category: 'organization', emoji: '🧸' },
  { habit_id: 'preset_9', name_el: 'Προετοιμασία για ύπνο', points: 15, category: 'routine', emoji: '🌙' },
  { habit_id: 'preset_10', name_el: 'Πρωινό ξύπνημα', points: 15, category: 'routine', emoji: '☀️' },
  { habit_id: 'preset_11', name_el: 'Φροντίδα κατοικίδιου', points: 20, category: 'responsibility', emoji: '🐕' },
  { habit_id: 'preset_12', name_el: 'Βοήθεια στο σπίτι', points: 15, category: 'responsibility', emoji: '🏠' },
  { habit_id: 'preset_13', name_el: 'Ανακύκλωση', points: 10, category: 'environment', emoji: '♻️' },
];

const CATEGORIES = [
  { id: 'all', label: 'Όλα', icon: 'apps' },
  { id: 'hygiene', label: 'Υγιεινή', icon: 'water' },
  { id: 'organization', label: 'Οργάνωση', icon: 'folder' },
  { id: 'education', label: 'Εκπαίδευση', icon: 'school' },
  { id: 'health', label: 'Υγεία', icon: 'fitness' },
  { id: 'routine', label: 'Ρουτίνα', icon: 'time' },
  { id: 'responsibility', label: 'Ευθύνη', icon: 'heart' },
];

export default function SetupHabits() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useAuthStore();
  const childId = params.childId as string;
  const childName = params.childName as string;
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const navigateToNextScreen = async () => {
    console.log('=== NAVIGATE TO NEXT SCREEN ===');
    console.log('userId:', userId);
    
    // Check if parent has seen the onboarding guide
    const storageKey = userId ? `parent_onboarding_guide_seen_${userId}` : 'parent_onboarding_guide_seen';
    console.log('storageKey:', storageKey);
    
    const guideSeen = await AsyncStorage.getItem(storageKey);
    console.log('guideSeen:', guideSeen);
    
    if (!guideSeen) {
      // First time - show onboarding guide
      console.log('Navigating to: /parent/onboarding-guide');
      router.replace('/parent/onboarding-guide');
    } else {
      // Already seen - go to parent dashboard
      console.log('Navigating to: /parent/(tabs)');
      router.replace('/parent/(tabs)');
    }
  };

  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return PRESET_HABITS;
    return PRESET_HABITS.filter(h => h.category === selectedCategory);
  }, [selectedCategory]);

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleComplete = async () => {
    if (selectedHabits.length === 0) {
      Alert.alert('Προσοχή', 'Επιλέξτε τουλάχιστον μία συνήθεια για το παιδί');
      return;
    }

    setLoading(true);
    try {
      await childHabitsAPI.assignHabits(childId, selectedHabits);
      setLoading(false);
      
      // Navigate directly to onboarding guide (first time) or dashboard
      await navigateToNextScreen();
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Navigate directly to onboarding guide (first time) or dashboard
    await navigateToNextScreen();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Επιλέξτε Συνήθειες</Text>
        <Text style={styles.subtitle}>
          Ποιες συνήθειες θέλετε να παρακολουθεί {childName};
        </Text>
        <Text style={styles.selectedCount}>
          {selectedHabits.length} επιλεγμένες
        </Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? COLORS.white : COLORS.darkGray}
            />
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.id && styles.categoryLabelSelected
            ]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Habits List */}
      <ScrollView style={styles.habitsList} contentContainerStyle={styles.habitsContent}>
        {filteredHabits.map(habit => {
          const isSelected = selectedHabits.includes(habit.habit_id);
          const categoryColor = CATEGORY_COLORS[habit.category] || COLORS.softBlue;
          
          return (
            <TouchableOpacity
              key={habit.habit_id}
              style={[
                styles.habitCard,
                isSelected && { borderColor: categoryColor, borderWidth: 2 }
              ]}
              onPress={() => toggleHabit(habit.habit_id)}
              activeOpacity={0.7}
            >
              <View style={styles.habitContent}>
                <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name_el}</Text>
                  <View style={styles.habitMeta}>
                    <Ionicons name="star" size={14} color={COLORS.brightYellow} />
                    <Text style={styles.habitPoints}>{habit.points} πόντοι</Text>
                  </View>
                </View>
              </View>
              <View style={[
                styles.checkbox,
                isSelected && { backgroundColor: categoryColor }
              ]}>
                {isSelected && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Παράλειψη"
          onPress={handleSkip}
          variant="outline"
          style={styles.skipButton}
        />
        <Button
          title={`Ολοκλήρωση (${selectedHabits.length})`}
          onPress={handleComplete}
          loading={loading}
          disabled={selectedHabits.length === 0}
          style={styles.completeButton}
        />
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    maxHeight: 50,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.softBlue,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  categoryLabelSelected: {
    color: COLORS.white,
  },
  habitsList: {
    flex: 1,
    marginTop: 16,
  },
  habitsContent: {
    padding: 24,
    paddingTop: 8,
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitPoints: {
    fontSize: 14,
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
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  skipButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
});
