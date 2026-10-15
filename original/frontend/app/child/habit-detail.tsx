import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../src/constants/colors';
import { tasksAPI } from '../../src/services/api';
import { CelebrationAnimation, QuickCelebration } from '../../src/components/CelebrationAnimation';
import { useAuthStore } from '../../src/store/authStore';
import { Gender, getGenderedText } from '../../src/utils/greekGender';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HabitDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gender: storeGender } = useAuthStore();
  const gender: Gender = (storeGender === 'girl' ? 'girl' : 'boy');
  const genderedText = getGenderedText(gender);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  const [helpSent, setHelpSent] = useState(false);
  const [waitingForParent, setWaitingForParent] = useState(params.helpRequested === 'true');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  
  // Parse habit data from params
  const habit = {
    habit_id: params.habitId as string,
    name_el: params.name as string,
    description_el: params.description as string || '',
    why_important_el: params.whyImportant as string || '',
    emoji: params.emoji as string || '⭐',
    points: parseInt(params.points as string) || 10,
    category: params.category as string || 'general',
    completed: params.completed === 'true',
  };

  const categoryNames: Record<string, string> = {
    hygiene: 'Υγιεινή',
    organization: 'Οργάνωση',
    education: 'Εκπαίδευση',
    creativity: 'Δημιουργικότητα',
    health: 'Υγεία',
    social: 'Κοινωνικά',
    environment: 'Περιβάλλον',
    responsibility: 'Ευθύνη',
    routine: 'Ρουτίνα',
    general: 'Γενικά',
  };

  const handleComplete = async () => {
    // Prevent multiple rapid clicks
    if (isSubmitting || loading) {
      return;
    }
    
    if (habit.completed) {
      Alert.alert(genderedText.wellDone, 'Έχεις ήδη ολοκληρώσει αυτή τη συνήθεια σήμερα!');
      return;
    }
    
    if (waitingForParent || helpSent) {
      Alert.alert(
        '🤝 Περίμενε λίγο!',
        'Ο γονιός σου θα σε βοηθήσει σύντομα! Όταν τελειώσετε μαζί, θα επιβεβαιώσει ότι το έκανες.',
        [{ text: 'Εντάξει!' }]
      );
      return;
    }
    
    // Lock immediately to prevent double-clicks
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      await tasksAPI.complete(habit.habit_id);
      
      // Show celebration animations
      setShowCelebration(true);
      setShowPointsAnimation(true);
      
      // Navigate back after celebration - use safe navigation
      setTimeout(() => {
        try {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/child');
          }
        } catch (navError) {
          console.log('Navigation error, redirecting to home:', navError);
          router.replace('/child');
        }
      }, 3000);
      
    } catch (error: any) {
      setIsSubmitting(false); // Only unlock on error so they can retry
      Alert.alert('Ουπς!', 'Κάτι πήγε στραβά. Δοκίμασε ξανά!');
    } finally {
      setLoading(false);
    }
  };

  const handleNotFinished = async () => {
    // Prevent multiple rapid clicks
    if (isSubmitting || loading) {
      return;
    }
    
    // Lock immediately
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const result = await tasksAPI.postpone(habit.habit_id);
      Alert.alert(
        '⏰ Εντάξει!',
        `Θα σου θυμίσω για "${habit.name_el}" σε 30 λεπτά!`,
        [{ text: 'OK!', onPress: () => safeNavigateBack() }]
      );
    } catch (error: any) {
      console.error('Postpone error:', error);
      setIsSubmitting(false); // Unlock on error
      // Even if API fails, let them go back
      Alert.alert(
        'Μην ανησυχείς!',
        `Μπορείς να προσπαθήσεις ξανά αργότερα. ${genderedText.youCan}`,
        [{ text: 'Εντάξει!', onPress: () => safeNavigateBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNeedHelp = async () => {
    // Prevent multiple rapid clicks
    if (isSubmitting || loading) {
      return;
    }
    
    // Lock immediately
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/child/tasks/${habit.habit_id}/help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        setHelpSent(true);
        setWaitingForParent(true);
        setIsSubmitting(false); // Unlock since they stay on page
        Alert.alert(
          '📨 Στάλθηκε!',
          'Ο γονιός σου θα λάβει μήνυμα ότι χρειάζεσαι βοήθεια. Θα έρθει σύντομα να σε βοηθήσει!',
          [{ text: 'Εντάξει!', onPress: () => safeNavigateBack() }]
        );
      } else {
        throw new Error('Failed to send help request');
      }
    } catch (error) {
      setIsSubmitting(false); // Unlock on error
      Alert.alert(
        'Ουπς!', 
        'Δεν μπόρεσε να σταλεί το μήνυμα. Πες το στον γονιό σου!',
        [{ text: 'Εντάξει!', onPress: () => safeNavigateBack() }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Safe navigation helper
  const safeNavigateBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/child');
      }
    } catch (navError) {
      console.log('Navigation error, redirecting to home:', navError);
      router.replace('/child');
    }
  };

  return (
    <>
      {/* Celebration Animation - Outside SafeAreaView for proper z-index */}
      <CelebrationAnimation
        visible={showCelebration}
        type="confetti"
        message={`🎉 +${habit.points} πόντοι!`}
        onComplete={() => setShowCelebration(false)}
      />
      
      <QuickCelebration
        type="points"
        visible={showPointsAnimation}
        value={habit.points}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header with emoji */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[habit.category] || COLORS.mediumGray }]}>
            <Text style={styles.categoryText}>{categoryNames[habit.category]}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{habit.name_el}</Text>
        
        {/* Points */}
        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={24} color={COLORS.brightYellow} />
          <Text style={styles.pointsText}>+{habit.points} πόντοι</Text>
        </View>

        {/* Description Card */}
        {habit.description_el && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={24} color={COLORS.sunnyYellow} />
              <Text style={styles.cardTitle}>Τι πρέπει να κάνω;</Text>
            </View>
            <Text style={styles.cardText}>{habit.description_el}</Text>
          </View>
        )}

        {/* Why Important Card */}
        {habit.why_important_el && (
          <View style={[styles.card, styles.cardImportant]}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={24} color={COLORS.warmCoral} />
              <Text style={styles.cardTitle}>Γιατί είναι σημαντικό;</Text>
            </View>
            <Text style={styles.cardText}>{habit.why_important_el}</Text>
          </View>
        )}

        {/* Status */}
        {habit.completed && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.softGreen} />
            <Text style={styles.completedText}>Το έκανες σήμερα! {genderedText.wellDone} 🎉</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {!habit.completed ? (
          <>
            {/* Waiting for parent banner */}
            {(waitingForParent || helpSent) && (
              <View style={styles.waitingBanner}>
                <Ionicons name="hourglass" size={20} color={COLORS.softBlue} />
                <Text style={styles.waitingText}>
                  Περιμένεις τον γονιό σου να σε βοηθήσει!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                styles.buttonDone,
                (waitingForParent || helpSent || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleComplete}
              disabled={loading || isSubmitting}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={(waitingForParent || helpSent || isSubmitting) ? COLORS.mediumGray : COLORS.white} 
                  />
                  <Text style={[
                    styles.buttonTextDone,
                    (waitingForParent || helpSent || isSubmitting) && styles.buttonTextDisabled,
                  ]}>
                    {(waitingForParent || helpSent) ? 'Περιμένει βοήθεια...' : isSubmitting ? 'Περίμενε...' : 'Το έκανα!'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, isSubmitting && styles.buttonDisabled]}
                onPress={handleNotFinished}
                disabled={loading || isSubmitting}
              >
                <Ionicons name="time" size={20} color={isSubmitting ? COLORS.lightGray : COLORS.mediumGray} />
                <Text style={[styles.buttonTextSecondary, isSubmitting && { color: COLORS.lightGray }]}>Αργότερα</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonHelp, (helpSent || waitingForParent) && styles.buttonHelpSent, isSubmitting && styles.buttonDisabled]}
                onPress={handleNeedHelp}
                disabled={loading || helpSent || waitingForParent || isSubmitting}
              >
                <Ionicons name="hand-left" size={20} color={(helpSent || waitingForParent) ? COLORS.softGreen : isSubmitting ? COLORS.lightGray : COLORS.softBlue} />
                <Text style={[styles.buttonTextHelp, (helpSent || waitingForParent) && styles.buttonTextHelpSent]}>
                  {(helpSent || waitingForParent) ? 'Στάλθηκε!' : 'Βοήθεια'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonBack]}
            onPress={() => safeNavigateBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            <Text style={styles.buttonTextDone}>Πίσω</Text>
          </TouchableOpacity>
        )}
      </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 180,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardImportant: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warmCoral,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  cardText: {
    fontSize: 16,
    color: COLORS.darkGray,
    lineHeight: 26,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.softGreen,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonDone: {
    backgroundColor: COLORS.softGreen,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonTextDisabled: {
    color: COLORS.mediumGray,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  waitingText: {
    fontSize: 14,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  buttonBack: {
    backgroundColor: COLORS.softBlue,
  },
  buttonTextDone: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  buttonHelp: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  buttonHelpSent: {
    backgroundColor: '#E8F5E9',
  },
  buttonTextHelp: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  buttonTextHelpSent: {
    color: COLORS.softGreen,
  },
});
