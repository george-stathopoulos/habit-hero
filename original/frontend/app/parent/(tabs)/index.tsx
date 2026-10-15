import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { ChildCard } from '../../../src/components/ChildCard';
import { Button } from '../../../src/components/Button';
import { NotificationBadge } from '../../../src/components/NotificationBadge';
import { SuggestionsCard } from '../../../src/components/SuggestionsCard';
import { InsightsCard } from '../../../src/components/InsightsCard';
import { LoveCreditsModal } from '../../../src/components/LoveCreditsModal';
import { AnalyticsPreview } from '../../../src/components/AnalyticsPreview';
import { childrenAPI, approvalAPI, childHabitsAPI, habitsAPI, rewardsAPI, loveCreditsAPI } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';
import { AVATARS } from '../../../src/constants/avatars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ParentHome() {
  const router = useRouter();
  const { name, userId, avatar, avatarType } = useAuthStore();
  const [parentPhoto, setParentPhoto] = useState<string | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [helpRequestsCount, setHelpRequestsCount] = useState(0);
  const [pendingRedemptionsCount, setPendingRedemptionsCount] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habitStats, setHabitStats] = useState<any>({});
  const [allHabits, setAllHabits] = useState<any[]>([]);
  const [behaviorStats, setBehaviorStats] = useState<any>(null);
  
  // Love Credits state
  const [showLoveCreditsModal, setShowLoveCreditsModal] = useState(false);
  const [loveCreditsReminder, setLoveCreditsReminder] = useState<any>(null);
  const [showHeartButton, setShowHeartButton] = useState(false);
  const heartFadeAnim = useRef(new Animated.Value(0)).current;

  // Load parent photo on mount when userId is available
  useEffect(() => {
    if (userId) {
      loadParentPhoto();
    }
  }, [userId]);

  const loadParentPhoto = async () => {
    try {
      if (!userId) return;
      const savedPhoto = await AsyncStorage.getItem(`parent_photo_${userId}`);
      const savedAvatar = await AsyncStorage.getItem(`parent_avatar_${userId}`);
      console.log('Home: Loading parent photo/avatar for userId:', userId, 'Photo:', !!savedPhoto, 'Avatar:', savedAvatar);
      if (savedPhoto) {
        setParentPhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading parent photo:', error);
    }
  };

  // Handle scroll to show/hide heart button
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    
    if (isAtBottom && !showHeartButton) {
      setShowHeartButton(true);
      Animated.timing(heartFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!isAtBottom && showHeartButton) {
      Animated.timing(heartFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowHeartButton(false));
    }
  };

  const loadData = async () => {
    try {
      const [childrenData, pendingData, habitsData] = await Promise.all([
        childrenAPI.getAll(),
        approvalAPI.getPending(),
        habitsAPI.getAll(),
      ]);
      setChildren(childrenData);
      setPendingCount(pendingData.length);
      setAllHabits(habitsData);
      
      // Load help requests
      try {
        const helpResponse = await fetch(`${BACKEND_URL}/api/parent/help-requests`, {
          credentials: 'include',
        });
        if (helpResponse.ok) {
          const helpData = await helpResponse.json();
          setHelpRequestsCount(helpData.length);
        }
      } catch (e) {
        console.log('Help requests not available');
      }

      // Load pending redemptions count and details
      try {
        const redemptionsData = await rewardsAPI.getPendingRedemptions();
        setPendingRedemptions(redemptionsData || []);
        setPendingRedemptionsCount(redemptionsData?.length || 0);
      } catch (e) {
        console.log('Redemptions not available');
      }

      // Load behavior stats
      try {
        const behaviorResponse = await fetch(`${BACKEND_URL}/api/parent/behavior-stats`, {
          credentials: 'include',
        });
        if (behaviorResponse.ok) {
          const behaviorData = await behaviorResponse.json();
          setBehaviorStats(behaviorData);
        }
      } catch (e) {
        console.log('Behavior stats not available');
      }

      // Check love credits reminder
      try {
        const reminderData = await loveCreditsAPI.checkReminder();
        setLoveCreditsReminder(reminderData);
      } catch (e) {
        console.log('Love credits reminder not available');
      }

      // Load habit stats for each child
      const stats: any = {};
      for (const child of childrenData) {
        try {
          const childHabits = await childHabitsAPI.getAssignedHabits(child.child_id);
          const habitIds = childHabits.habit_ids || [];
          
          // Count by category - support multiple categories per habit
          const categoryCount: Record<string, number> = {};
          habitIds.forEach((id: string) => {
            const habit = habitsData.find((h: any) => h.habit_id === id);
            if (habit) {
              // Use categories array if available, otherwise fallback to single category
              const categories = habit.categories || [habit.category];
              categories.forEach((cat: string) => {
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
              });
            }
          });
          
          stats[child.child_id] = {
            total: habitIds.length,
            byCategory: Object.entries(categoryCount).map(([category, count]) => ({
              category,
              count,
            })),
          };
        } catch (e) {
          stats[child.child_id] = { total: 0, byCategory: [] };
        }
      }
      setHabitStats(stats);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // Auto-refresh every 3 seconds when screen is focused
      const refreshInterval = setInterval(() => {
        loadData();
      }, 3000);
      
      return () => clearInterval(refreshInterval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleChildPress = (child: any) => {
    router.push({
      pathname: '/parent/child-analytics',
      params: { childId: child.child_id, childName: child.name },
    });
  };

  const handleEditChild = (child: any) => {
    router.push({
      pathname: '/parent/edit-child',
      params: { childId: child.child_id, childName: child.name },
    });
  };

  const handleManageHabits = (child: any) => {
    router.push({
      pathname: '/parent/manage-habits',
      params: { childId: child.child_id, childName: child.name },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Καλημέρα, {name}!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('el-GR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAvatar}
          onPress={() => router.push('/parent/profile')}
        >
          {parentPhoto ? (
            <Image source={{ uri: parentPhoto }} style={styles.headerAvatarImage} />
          ) : avatar && avatarType === 'emoji' ? (
            <Text style={styles.headerAvatarEmoji}>{avatar}</Text>
          ) : (
            <Ionicons name="person" size={24} color={COLORS.softBlue} />
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      {(helpRequestsCount > 0 || pendingCount > 0 || pendingRedemptionsCount > 0) && (
        <View style={styles.notificationsSection}>
          {helpRequestsCount > 0 && (
            <NotificationBadge
              type="help"
              count={helpRequestsCount}
              title="Αιτήματα Βοήθειας"
              subtitle="Τα παιδιά σας χρειάζονται βοήθεια"
              onPress={() => router.push('/parent/(tabs)/approvals')}
            />
          )}
          {pendingCount > 0 && (
            <NotificationBadge
              type="approval"
              count={pendingCount}
              title="Εκκρεμείς Εγκρίσεις"
              subtitle="Πατήστε για να δείτε"
              onPress={() => router.push('/parent/(tabs)/approvals')}
            />
          )}
          {pendingRedemptionsCount > 0 && (
            <NotificationBadge
              type="redemption"
              count={pendingRedemptionsCount}
              title="Εξαργυρώσεις Επάθλων"
              subtitle={
                pendingRedemptions.length > 0
                  ? pendingRedemptions.length === 1
                    ? `${pendingRedemptions[0].child_name} → ${pendingRedemptions[0].reward_name}`
                    : `${pendingRedemptions[0].child_name} → ${pendingRedemptions[0].reward_name} (+${pendingRedemptions.length - 1})`
                  : "Τα παιδιά εξαργύρωσαν πόντους!"
              }
              onPress={() => router.push('/parent/(tabs)/rewards')}
            />
          )}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Τα παιδιά μου</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/parent/add-child')}
          >
            <Ionicons name="add" size={20} color={COLORS.softBlue} />
            <Text style={styles.addButtonText}>Προσθήκη</Text>
          </TouchableOpacity>
        </View>

        {children.length > 0 ? (
          children.map((child) => (
            <ChildCard
              key={child.child_id}
              name={child.name}
              avatarId={child.avatar_id}
              totalPoints={child.total_points}
              currentStreak={child.current_streak}
              avatarLevel={child.avatar_level}
              customAvatar={child.custom_avatar}
              onPress={() => handleChildPress(child)}
              onEdit={() => handleEditChild(child)}
              onManageHabits={() => handleManageHabits(child)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color={COLORS.mediumGray} />
            <Text style={styles.emptyText}>
              Δεν έχετε προσθέσει παιδιά ακόμα
            </Text>
            <Button
              title="Προσθήκη Παιδιού"
              onPress={() => router.push('/parent/add-child')}
              style={styles.emptyButton}
            />
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Γρήγορες Ενέργειες</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/parent/add-habit')}
          >
            <Ionicons name="add-circle" size={32} color={COLORS.softBlue} />
            <Text style={styles.actionText}>Νέα Συνήθεια</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/parent/(tabs)/approvals')}
          >
            <Ionicons name="checkmark-done" size={32} color={COLORS.softGreen} />
            <Text style={styles.actionText}>Εγκρίσεις</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/parent/points-history')}
          >
            <Ionicons name="star" size={32} color={COLORS.brightYellow} />
            <Text style={styles.actionText}>Ιστορικό Πόντων</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/parent/(tabs)/rewards')}
          >
            <Ionicons name="gift" size={32} color={COLORS.warmCoral} />
            <Text style={styles.actionText}>Έπαθλα</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestions Section - at the bottom */}
      {children.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Προτάσεις & Στατιστικά</Text>
          {children.map((child) => {
            const stats = habitStats[child.child_id] || { total: 0, byCategory: [] };
            return (
              <SuggestionsCard
                key={child.child_id}
                childName={child.name}
                habits={stats.byCategory}
                totalTasks={stats.total}
              />
            );
          })}
        </View>
      )}

      {/* Behavior Insights Section */}
      {behaviorStats && (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Αιτήματα Βοήθειας</Text>
          <InsightsCard
            insights={behaviorStats.insights || []}
            helpRequestsToday={behaviorStats.help_requests_today || 0}
            helpRequestsTotal={behaviorStats.help_requests_total || 0}
            onPress={() => router.push('/parent/(tabs)/approvals')}
          />
        </View>
      )}

      {/* Analytics Preview Section */}
      {children.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>📊 Στατιστικά</Text>
          <AnalyticsPreview 
            childIds={children.map((c: any) => c.child_id)}
          />
        </View>
      )}

      {/* Love Credits Reminder */}
      {loveCreditsReminder?.should_remind && (
        <TouchableOpacity 
          style={styles.loveReminderCard}
          onPress={() => setShowLoveCreditsModal(true)}
        >
          <Text style={styles.loveReminderEmoji}>💝</Text>
          <View style={styles.loveReminderContent}>
            <Text style={styles.loveReminderTitle}>Στείλτε λίγη αγάπη!</Text>
            <Text style={styles.loveReminderText}>{loveCreditsReminder.message}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#E91E63" />
        </TouchableOpacity>
      )}

      {/* Spacer for floating button */}
      <View style={{ height: 80 }} />
    </ScrollView>

    {/* Floating Love Credits Heart Button - only shows when scrolled to bottom */}
    {showHeartButton && (
      <Animated.View style={[styles.floatingHeartButton, { opacity: heartFadeAnim }]}>
        <TouchableOpacity
          onPress={() => setShowLoveCreditsModal(true)}
          activeOpacity={0.8}
          style={styles.heartButtonInner}
        >
          <Ionicons name="heart" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>
    )}

    {/* Love Credits Modal */}
    <LoveCreditsModal
      visible={showLoveCreditsModal}
      onClose={() => setShowLoveCreditsModal(false)}
      onSuccess={loadData}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
    paddingBottom: 120, // Extra padding for floating heart button
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
  headerLeft: {
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginLeft: 12,
  },
  headerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerAvatarEmoji: {
    fontSize: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  date: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brightYellow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  pendingSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    minWidth: 160,
  },
  notificationsSection: {
    marginBottom: 20,
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  insightsSection: {
    marginBottom: 20,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
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
  actionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // Love Credits styles
  loveReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE4EC',
  },
  loveReminderEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  loveReminderContent: {
    flex: 1,
  },
  loveReminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E91E63',
  },
  loveReminderText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  floatingHeartButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 99,
    zIndex: 999,
  },
  heartButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
