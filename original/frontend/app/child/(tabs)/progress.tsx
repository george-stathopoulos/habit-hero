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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { tasksAPI } from '../../../src/services/api';
import { AVATARS, AVATAR_LEVELS } from '../../../src/constants/avatars';

export default function ChildProgress() {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgress = async () => {
    try {
      const data = await tasksAPI.getProgress();
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProgress();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brightYellow} />
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Δεν βρέθηκαν δεδομένα</Text>
      </View>
    );
  }

  const avatar = AVATARS.find((a) => a.id === progress.avatar_id) || AVATARS[0];
  const currentLevel = AVATAR_LEVELS.find((l) => l.level === progress.avatar_level) || AVATAR_LEVELS[0];
  const nextLevel = AVATAR_LEVELS.find((l) => l.level === progress.avatar_level + 1);

  const progressToNextLevel = nextLevel
    ? ((progress.total_points - currentLevel.points_required) / (nextLevel.points_required - currentLevel.points_required)) * 100
    : 100;

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
      {/* Avatar Card */}
      <View style={styles.avatarCard}>
        <Text style={styles.avatarEmoji}>{avatar.image}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelEmoji}>{currentLevel.badge}</Text>
        </View>
        <Text style={styles.avatarName}>{avatar.name_el}</Text>
        <Text style={styles.levelName}>{currentLevel.name_el}</Text>
        
        {nextLevel && (
          <View style={styles.levelProgress}>
            <View style={styles.levelProgressBar}>
              <View
                style={[
                  styles.levelProgressFill,
                  { width: `${Math.min(progressToNextLevel, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.levelProgressText}>
              {progress.total_points}/{nextLevel.points_required} πόντοι
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="star" size={32} color={COLORS.brightYellow} />
          <Text style={styles.statValue}>{progress.total_points}</Text>
          <Text style={styles.statLabel}>Συνολικοί Πόντοι</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color={COLORS.warmCoral} />
          <Text style={styles.statValue}>{progress.current_streak}</Text>
          <Text style={styles.statLabel}>Τρέχον Σερί</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color={COLORS.softGreen} />
          <Text style={styles.statValue}>{progress.longest_streak}</Text>
          <Text style={styles.statLabel}>Καλύτερο Σερί</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="ribbon" size={32} color={COLORS.softBlue} />
          <Text style={styles.statValue}>{progress.badges?.length || 0}</Text>
          <Text style={styles.statLabel}>Εμβλήματα</Text>
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={styles.weeklyCard}>
        <Text style={styles.weeklyTitle}>Αυτή η εβδομάδα</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyValue}>{progress.weekly_completions}</Text>
            <Text style={styles.weeklyLabel}>Εργασίες</Text>
          </View>
          <View style={styles.weeklyDivider} />
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyValue}>{progress.weekly_points}</Text>
            <Text style={styles.weeklyLabel}>Πόντοι</Text>
          </View>
        </View>
      </View>

      {/* Level Progress */}
      <View style={styles.levelsSection}>
        <Text style={styles.sectionTitle}>Εξέλιξη Επιπέδων</Text>
        {AVATAR_LEVELS.map((level) => (
          <View
            key={level.level}
            style={[
              styles.levelItem,
              progress.avatar_level >= level.level && styles.levelUnlocked,
            ]}
          >
            <Text style={styles.levelItemBadge}>{level.badge}</Text>
            <View style={styles.levelItemInfo}>
              <Text style={styles.levelItemName}>{level.name_el}</Text>
              <Text style={styles.levelItemPoints}>
                {level.points_required} πόντοι
              </Text>
            </View>
            {progress.avatar_level >= level.level ? (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.softGreen} />
            ) : (
              <Ionicons name="lock-closed" size={24} color={COLORS.mediumGray} />
            )}
          </View>
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
  avatarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 80,
  },
  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.brightYellow,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 20,
  },
  avatarName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 12,
  },
  levelName: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  levelProgress: {
    width: '100%',
    marginTop: 16,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: COLORS.brightYellow,
    borderRadius: 4,
  },
  levelProgressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  weeklyCard: {
    backgroundColor: COLORS.softBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyStat: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  weeklyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  weeklyLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  weeklyDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  levelsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    opacity: 0.6,
  },
  levelUnlocked: {
    opacity: 1,
  },
  levelItemBadge: {
    fontSize: 24,
    marginRight: 12,
  },
  levelItemInfo: {
    flex: 1,
  },
  levelItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  levelItemPoints: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
});
