import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { analyticsAPI } from '../../src/services/api';
import { AVATARS, AVATAR_LEVELS } from '../../src/constants/avatars';

export default function ChildAnalytics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const data = await analyticsAPI.getChildAnalytics(params.childId as string);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Δεν βρέθηκαν δεδομένα</Text>
      </View>
    );
  }

  const { child, daily_stats, weekly_completions, weekly_points, monthly_completions, monthly_points } = analytics;
  const avatar = AVATARS.find((a) => a.id === child.avatar_id) || AVATARS[0];
  const level = AVATAR_LEVELS.find((l) => l.level === child.avatar_level) || AVATAR_LEVELS[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Στατιστικά</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Child Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.avatarSection}>
          <Text style={styles.avatarEmoji}>{avatar.image}</Text>
          <View style={styles.avatarInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.levelText}>{level.name_el} {level.badge}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.overviewStat}>
            <Ionicons name="star" size={24} color={COLORS.brightYellow} />
            <Text style={styles.overviewStatValue}>{child.total_points}</Text>
            <Text style={styles.overviewStatLabel}>Πόντοι</Text>
          </View>
          <View style={styles.overviewStat}>
            <Ionicons name="flame" size={24} color={COLORS.warmCoral} />
            <Text style={styles.overviewStatValue}>{child.current_streak}</Text>
            <Text style={styles.overviewStatLabel}>Σερί</Text>
          </View>
          <View style={styles.overviewStat}>
            <Ionicons name="ribbon" size={24} color={COLORS.softBlue} />
            <Text style={styles.overviewStatValue}>{child.badges?.length || 0}</Text>
            <Text style={styles.overviewStatLabel}>Εμβλήματα</Text>
          </View>
        </View>
      </View>

      {/* Period Stats */}
      <View style={styles.periodCardsRow}>
        <View style={[styles.periodCard, { backgroundColor: COLORS.softGreen }]}>
          <Text style={styles.periodTitle}>Εβδομάδα</Text>
          <Text style={styles.periodValue}>{weekly_completions}</Text>
          <Text style={styles.periodLabel}>εργασίες</Text>
          <Text style={styles.periodPoints}>{weekly_points} πόντοι</Text>
        </View>
        <View style={[styles.periodCard, { backgroundColor: COLORS.softBlue }]}>
          <Text style={styles.periodTitle}>Μήνας</Text>
          <Text style={styles.periodValue}>{monthly_completions}</Text>
          <Text style={styles.periodLabel}>εργασίες</Text>
          <Text style={styles.periodPoints}>{monthly_points} πόντοι</Text>
        </View>
      </View>

      {/* Daily Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ημερήσια Δραστηριότητα (τελευταίες 7 μέρες)</Text>
        <View style={styles.dailyChart}>
          {daily_stats.reverse().map((day: any, index: number) => {
            const dayName = new Date(day.date).toLocaleDateString('el-GR', { weekday: 'short' });
            const barHeight = Math.max(day.completions * 15, 5);
            return (
              <View key={day.date} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayBar,
                    {
                      height: barHeight,
                      backgroundColor: day.completions > 0 ? COLORS.softGreen : COLORS.lightGray,
                    },
                  ]}
                />
                <Text style={styles.dayLabel}>{dayName}</Text>
                <Text style={styles.dayCount}>{day.completions}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Ionicons name="bulb" size={24} color={COLORS.brightYellow} />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Συμβουλή</Text>
          <Text style={styles.tipsText}>
            {child.current_streak > 0
              ? `Μπράβο! Ο ${child.name} έχει ${child.current_streak} μέρες σερί. Συνεχίστε!`
              : `Ενθαρρύνετε τον ${child.name} να ξεκινήσει ένα νέο σερί σήμερα!`}
          </Text>
        </View>
      </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  avatarInfo: {
    marginLeft: 16,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  levelText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 4,
  },
  overviewStatLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  periodCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  periodTitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  periodValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  periodLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  periodPoints: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 8,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  dailyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayBar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: COLORS.mediumGray,
  },
  dayCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
});
