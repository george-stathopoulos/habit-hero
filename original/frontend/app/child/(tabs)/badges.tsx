import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../../src/constants/colors';
import { tasksAPI, gamificationAPI } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';
import { Gender } from '../../../src/utils/greekGender';

// Gendered badge names
const getBadges = (gender: Gender) => {
  const isFemale = gender === 'girl';
  return [
    // Original badges
    { badge_id: 'first_task', name_el: 'Πρώτη Αποστολή', name_en: 'First Mission', description_el: 'Ολοκλήρωσε την πρώτη σου συνήθεια', icon: '🌟' },
    { badge_id: 'streak_3', name_el: 'Τριήμερο Σερί', name_en: '3-Day Streak', description_el: 'Διατήρησε 3 μέρες σερί', icon: '🔥' },
    { badge_id: 'streak_7', name_el: isFemale ? 'Εβδομαδιαία Ηρωίδα' : 'Εβδομαδιαίος Ήρωας', name_en: 'Weekly Hero', description_el: 'Διατήρησε 7 μέρες σερί', icon: '⚡' },
    { badge_id: 'streak_30', name_el: isFemale ? 'Μηνιαία Πρωταθλήτρια' : 'Μηνιαίος Πρωταθλητής', name_en: 'Monthly Champion', description_el: 'Διατήρησε 30 μέρες σερί', icon: '🏆' },
    { badge_id: 'points_100', name_el: isFemale ? 'Συλλέκτρια Πόντων' : 'Συλλέκτης Πόντων', name_en: 'Point Collector', description_el: 'Συγκέντρωσε 100 πόντους', icon: '💎' },
    { badge_id: 'points_500', name_el: isFemale ? 'Θησαυροφύλακας' : 'Θησαυροφύλακας', name_en: 'Treasure Keeper', description_el: 'Συγκέντρωσε 500 πόντους', icon: '👑' },
    { badge_id: 'points_1000', name_el: isFemale ? 'Χρυσή Ηρωίδα' : 'Χρυσός Ήρωας', name_en: 'Golden Hero', description_el: 'Συγκέντρωσε 1000 πόντους', icon: '🥇' },
    { badge_id: 'helper', name_el: isFemale ? 'Βοηθός' : 'Βοηθός', name_en: 'Helper', description_el: 'Βοήθησε 5 φορές', icon: '🤝' },
    { badge_id: 'creative', name_el: isFemale ? 'Δημιουργός' : 'Δημιουργός', name_en: 'Creator', description_el: 'Ολοκλήρωσε 10 δημιουργικές δραστηριότητες', icon: '🎨' },
    { badge_id: 'active', name_el: isFemale ? 'Αθλήτρια' : 'Αθλητής', name_en: 'Athlete', description_el: 'Ολοκλήρωσε 10 φυσικές δραστηριότητες', icon: '🏃' },
    // Independence badges (no help)
    { badge_id: 'independent_1day', name_el: isFemale ? 'Ανεξάρτητη Μαχήτρια' : 'Ανεξάρτητος Μαχητής', name_en: 'Independent Fighter', description_el: '1 μέρα χωρίς βοήθεια', icon: '💪' },
    { badge_id: 'independent_7days', name_el: isFemale ? 'Αυτόνομη Ηρωίδα' : 'Αυτόνομος Ήρωας', name_en: 'Self-Reliant Hero', description_el: '1 εβδομάδα χωρίς βοήθεια', icon: '🦸' },
    { badge_id: 'independent_30days', name_el: 'Μάστερ Ανεξαρτησίας', name_en: 'Independence Master', description_el: '1 μήνας χωρίς βοήθεια', icon: '🎖️' },
    // Focus badges (no postpones)
    { badge_id: 'focused_1day', name_el: isFemale ? 'Εστιασμένη' : 'Εστιασμένος', name_en: 'Focused', description_el: '1 μέρα χωρίς αναβολές', icon: '🎯' },
    { badge_id: 'focused_7days', name_el: isFemale ? 'Συγκεντρωμένη Ηρωίδα' : 'Συγκεντρωμένος Ήρωας', name_en: 'Concentrated Hero', description_el: '1 εβδομάδα χωρίς αναβολές', icon: '🧠' },
    { badge_id: 'focused_30days', name_el: 'Μάστερ Εστίασης', name_en: 'Focus Master', description_el: '1 μήνας χωρίς αναβολές', icon: '🏅' },
    // Spending badge
    { badge_id: 'big_spender', name_el: isFemale ? 'Μεγάλη Ξοδεύτρα' : 'Μεγάλος Ξοδευτής', name_en: 'Big Spender', description_el: 'Ξόδεψε 500+ πόντους σε έπαθλα', icon: '💸' },
  ];
};

export default function ChildBadges() {
  const { gender: storeGender } = useAuthStore();
  const gender: Gender = (storeGender === 'girl' ? 'girl' : 'boy');
  const BADGES = getBadges(gender);
  
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBadges = async () => {
    try {
      const progress = await tasksAPI.getProgress();
      setEarnedBadges(progress.badges || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBadges();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brightYellow} />
      </View>
    );
  }

  const earned = BADGES.filter((b) => earnedBadges.includes(b.badge_id));
  const locked = BADGES.filter((b) => !earnedBadges.includes(b.badge_id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.brightYellow}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Τα Επιτεύγματά μου</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {earned.length}/{BADGES.length}
          </Text>
        </View>
      </View>

      {earned.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Κερδισμένα 🎉</Text>
          <View style={styles.badgesGrid}>
            {earned.map((badge) => (
              <View key={badge.badge_id} style={styles.badgeCard}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name_el}</Text>
                <Text style={styles.badgeDesc}>{badge.description_el}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {locked.length > 0 ? 'Κλειδωμένα 🔒' : 'Μπράβο! Τα πήρες όλα!'}
        </Text>
        <View style={styles.badgesGrid}>
          {locked.map((badge) => (
            <View key={badge.badge_id} style={[styles.badgeCard, styles.lockedBadge]}>
              <Text style={[styles.badgeIcon, styles.lockedIcon]}>{badge.icon}</Text>
              <Text style={[styles.badgeName, styles.lockedText]}>{badge.name_el}</Text>
              <Text style={[styles.badgeDesc, styles.lockedText]}>{badge.description_el}</Text>
            </View>
          ))}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  counter: {
    backgroundColor: COLORS.brightYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedBadge: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 4,
  },
  lockedText: {
    color: COLORS.mediumGray,
  },
});
