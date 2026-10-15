import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { TaskCard } from '../../../src/components/TaskCard';
import { AnimatedEnvelope } from '../../../src/components/AnimatedEnvelope';
import { useResponsiveScale } from '../../../src/components/ScaledComponents';
import { tasksAPI, pointsHistoryAPI, childNotificationsAPI, rewardsAPI, customAvatarAPI } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';
import { useChildTheme } from '../../../src/store/themeStore';
import { getGenderedText, getPronouns, Gender } from '../../../src/utils/greekGender';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATARS } from '../../../src/constants/avatars';

// Fun greeting based on time and gender
const getGreeting = (gender: Gender) => {
  const hour = new Date().getHours();
  const isFemale = gender === 'girl';
  
  if (hour < 12) return { text: 'Καλημέρα', emoji: '🌅' };
  if (hour < 17) return { text: 'Καλό μεσημέρι', emoji: '☀️' };
  if (hour < 21) return { text: 'Καλό απόγευμα', emoji: '🌆' };
  return { text: 'Καληνύχτα', emoji: '🌙' };
};

// Fun motivational messages with gender support
const getMotivationalMessage = (gender: Gender) => {
  const isFemale = gender === 'girl';
  const messages = isFemale ? [
    'Είσαι σούπερ ηρωίδα! 🦸‍♀️',
    'Συνέχισε έτσι! 💪',
    'Μπράβο σου! ⭐',
    'Είσαι φανταστική! 🌟',
    'Τα καταφέρνεις! 🎯',
  ] : [
    'Είσαι σούπερ ήρωας! 🦸',
    'Συνέχισε έτσι! 💪',
    'Μπράβο σου! ⭐',
    'Είσαι φανταστικός! 🌟',
    'Τα καταφέρνεις! 🎯',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function ChildHome() {
  const router = useRouter();
  const { name, gender: storeGender, childId } = useAuthStore();
  const gender: Gender = (storeGender === 'girl' ? 'girl' : 'boy');
  const { fs, sp, sz, icon, isTablet } = useResponsiveScale();
  const { theme } = useChildTheme(childId);
  const themeColors = theme.colors;
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [postponing, setPostponing] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Notifications state
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Postponed habits state
  const [postponedHabits, setPostponedHabits] = useState<{[key: string]: any}>({});
  
  // Rewards state for "funny message"
  const [affordableReward, setAffordableReward] = useState<any>(null);
  
  // Custom avatar state
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<number>(0);
  
  // Animation values
  const welcomeScale = useRef(new Animated.Value(0)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pointsAnim = useRef(new Animated.Value(1)).current;

  const greeting = getGreeting(gender);
  const motivation = getMotivationalMessage(gender);
  const genderedText = getGenderedText(gender);

  useEffect(() => {
    // Welcome animation
    Animated.parallel([
      Animated.spring(welcomeScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous bounce animation for emojis
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Hide welcome after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowWelcome(false));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, dashboardData, notifData, rewardsData, postponedData] = await Promise.all([
        tasksAPI.getTasks(),
        pointsHistoryAPI.getChildDashboard().catch(() => null),
        childNotificationsAPI.getAll().catch(() => []),
        rewardsAPI.getForChild().catch(() => ({ rewards: [], current_points: 0 })),
        tasksAPI.getPostponed().catch(() => ({ postponed_habits: {} })),
      ]);
      
      setTasks(tasksData);
      setDashboard(dashboardData);
      setNotifications(notifData || []);
      setNotificationCount(notifData?.length || 0);
      setPostponedHabits(postponedData?.postponed_habits || {});
      
      // Find an affordable reward for the "funny message"
      const affordable = rewardsData?.rewards?.find((r: any) => r.can_redeem);
      setAffordableReward(affordable || null);
      
      // Load custom avatar status
      try {
        const avatarStatus = await customAvatarAPI.getStatus();
        if (avatarStatus.custom_avatar) {
          setCustomAvatar(avatarStatus.custom_avatar);
        }
      } catch (e) {
        // Custom avatar not available, ignore
      }
      
      // Get avatar_id from dashboard
      if (dashboardData?.avatar_id) {
        setAvatarId(dashboardData.avatar_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleMarkNotificationsRead = async () => {
    try {
      await childNotificationsAPI.markAllRead();
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications read:', error);
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

  const handleComplete = async (habitId: string, habitName: string) => {
    setCompleting(habitId);
    try {
      const result = await tasksAPI.complete(habitId);
      
      // Animate points
      if (result.points_earned > 0) {
        Animated.sequence([
          Animated.timing(pointsAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pointsAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      // Update local state
      setTasks(tasks.map((t) =>
        t.habit_id === habitId
          ? { ...t, completed: true, status: result.status }
          : t
      ));

      if (result.status === 'approved') {
        Alert.alert(
          '🎉 ' + genderedText.wellDone,
          `Κέρδισες ${result.points_earned} πόντους!`
        );
      } else if (result.status === 'pending') {
        Alert.alert(
          '✅ Καταχωρήθηκε!',
          'Περιμένει έγκριση από τον γονέα σου.'
        );
      }
      
      // Reload dashboard to get updated stats
      loadData();
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setCompleting(null);
    }
  };

  const handlePostpone = async (habitId: string, habitName: string) => {
    setPostponing(habitId);
    try {
      const result = await tasksAPI.postpone(habitId);
      
      // Update local postponed state
      setPostponedHabits(prev => ({
        ...prev,
        [habitId]: {
          reminder_at: result.reminder_at,
        }
      }));
      
      Alert.alert(
        '⏰ Εντάξει!',
        `Θα σου θυμίσω για "${habitName}" σε 30 λεπτά!`
      );
      
      // Reload to update notifications
      loadData();
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setPostponing(null);
    }
  };

  const handleTaskPress = (task: any) => {
    router.push({
      pathname: '/child/habit-detail',
      params: {
        habitId: task.habit_id,
        name: task.name_el,
        description: task.description_el || '',
        whyImportant: task.why_important_el || '',
        emoji: task.emoji || '⭐',
        points: task.points.toString(),
        category: task.category,
        completed: task.completed ? 'true' : 'false',
      },
    });
  };

  // Calculate progress - count tasks that are either fully completed OR have at least one approved completion
  const completedCount = tasks.filter((t) => t.completed || t.completed_count > 0).length;
  const fullyCompletedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => t.pending_count > 0 && !t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((fullyCompletedCount / totalCount) * 100) : 0;
  
  // Rainbow progress bar color based on percentage
  const getProgressColor = (percent: number) => {
    if (percent === 0) return '#D1D5DB'; // Gray
    if (percent <= 20) return '#EF4444'; // Red
    if (percent <= 40) return '#F97316'; // Orange
    if (percent <= 60) return '#EAB308'; // Yellow
    if (percent <= 80) return '#22C55E'; // Green
    if (percent < 100) return '#3B82F6'; // Blue
    return '#8B5CF6'; // Purple/Violet for 100%
  };
  
  const progressColor = getProgressColor(progressPercent);

  // Get current date in Greek
  const currentDate = new Date().toLocaleDateString('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  const currentTime = new Date().toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brightYellow} />
        <Text style={styles.loadingText}>Φορτώνουμε τις περιπέτειες σου...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.screenBackground }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={themeColors.primary}
        />
      }
    >
      {/* Animated Welcome Banner */}
      {showWelcome && (
        <Animated.View
          style={[
            styles.welcomeBanner,
            {
              opacity: welcomeOpacity,
              transform: [{ scale: welcomeScale }],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.welcomeEmoji,
              {
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
              },
            ]}
          >
            🌟
          </Animated.Text>
          <Text style={[styles.welcomeText, { fontSize: fs(20) }]}>Καλώς ήρθες πίσω!</Text>
          <Animated.Text
            style={[
              styles.welcomeEmoji,
              {
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
              },
            ]}
          >
            🎉
          </Animated.Text>
        </Animated.View>
      )}

      {/* Animated Envelope for Notifications */}
      {notificationCount > 0 && (
        <View style={styles.envelopeContainer}>
          <AnimatedEnvelope
            count={notificationCount}
            notifications={notifications}
            onPress={() => {}}
            onMarkAllRead={handleMarkNotificationsRead}
            onPointsClaimed={(points) => {
              // Refresh data to update points display
              loadData();
            }}
          />
          <Text style={[styles.envelopeHint, { fontSize: fs(16) }]}>Έχεις μηνύματα! 💌</Text>
        </View>
      )}

      {/* Playful Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Avatar */}
          <View style={styles.homeAvatarContainer}>
            {customAvatar ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${customAvatar}` }}
                style={styles.homeAvatarImage}
              />
            ) : (
              <Text style={styles.homeAvatarEmoji}>
                {AVATARS.find(a => a.id === avatarId)?.image || '🦸'}
              </Text>
            )}
          </View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { fontSize: fs(22) }]}>{greeting.text}, {name}! {greeting.emoji}</Text>
            <Text style={[styles.motivationText, { fontSize: fs(14) }]}>{motivation}</Text>
          </View>
        </View>
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar" size={16} color={COLORS.softBlue} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time" size={16} color={COLORS.softBlue} />
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>
      </View>

      {/* Points & Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: themeColors.cardBackground }]}>
        <Animated.View style={[styles.pointsSection, { transform: [{ scale: pointsAnim }] }]}>
          <Ionicons name="star" size={icon(32)} color={themeColors.pointsColor} />
          <Text style={[styles.pointsValue, { fontSize: fs(36), color: themeColors.textPrimary }]}>{dashboard?.current_points || 0}</Text>
          <Text style={[styles.pointsLabel, { fontSize: fs(14), color: themeColors.textSecondary }]}>Πόντοι</Text>
        </Animated.View>
        
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: fs(22), color: themeColors.textPrimary }]}>{dashboard?.current_streak || 0}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(12), color: themeColors.textSecondary }]}>🔥 Σερί</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.lightGray }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: fs(22), color: themeColors.textPrimary }]}>{dashboard?.week?.total_completions || 0}</Text>
            <Text style={[styles.statLabel, { fontSize: fs(12), color: themeColors.textSecondary }]}>📅 Εβδομάδα</Text>
          </View>
        </View>
      </View>

      {/* Funny Message for Affordable Rewards */}
      {affordableReward && (
        <TouchableOpacity 
          style={[styles.rewardHintCard, { backgroundColor: themeColors.cardBackground }]}
          onPress={() => router.push('/child/rewards')}
          activeOpacity={0.8}
        >
          <View style={styles.rewardHintContent}>
            <Text style={[styles.rewardHintEmoji, { fontSize: fs(40) }]}>{affordableReward.emoji || '🎁'}</Text>
            <View style={styles.rewardHintTextContainer}>
              <Text style={[styles.rewardHintTitle, { fontSize: fs(15), color: themeColors.textPrimary }]}>🎉 Έχεις αρκετούς πόντους!</Text>
              <Text style={[styles.rewardHintText, { fontSize: fs(14), color: themeColors.textSecondary }]}>
                Μπορείς να πάρεις: "{affordableReward.name_el}"!
              </Text>
              <Text style={[styles.rewardHintCta, { fontSize: fs(13) }]}>Πάτα εδώ για να δεις τα έπαθλα! 🏃</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Today's Progress */}
      <View style={[styles.progressCard, { backgroundColor: themeColors.cardBackground }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { fontSize: fs(16), color: themeColors.textPrimary }]}>📋 Σημερινές Αποστολές</Text>
          <View style={[styles.progressBadge, { backgroundColor: progressColor }]}>
            <Text style={[styles.progressBadgeText, { fontSize: fs(14) }]}>{fullyCompletedCount}/{totalCount}</Text>
          </View>
        </View>
        
        <View style={[styles.progressBarContainer, { backgroundColor: themeColors.lightGray }]}>
          <View style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: themeColors.progressBar }]} />
          {progressPercent === 100 && (
            <View style={styles.rainbowOverlay}>
              <Text style={[styles.rainbowEmoji, { fontSize: fs(14) }]}>🌈✨🎉</Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressFooter}>
          {progressPercent === 100 ? (
            <Text style={[styles.progressComplete, { fontSize: fs(14), color: themeColors.success }]}>🎊 Τα κατάφερες όλα! {genderedText.wellDone} 🌈</Text>
          ) : progressPercent >= 75 ? (
            <Text style={[styles.progressGood, { fontSize: fs(14), color: themeColors.textPrimary }]}>🔥 Σχεδόν τα κατάφερες! Λίγο ακόμα!</Text>
          ) : progressPercent >= 50 ? (
            <Text style={[styles.progressGood, { fontSize: fs(14), color: themeColors.textPrimary }]}>💪 {genderedText.keepGoing} Είσαι κοντά!</Text>
          ) : progressPercent > 0 ? (
            <Text style={[styles.progressStart, { fontSize: fs(14), color: themeColors.textSecondary }]}>⭐ Καλή αρχή! Συνέχισε!</Text>
          ) : (
            <Text style={[styles.progressStart, { fontSize: fs(14), color: themeColors.textSecondary }]}>🚀 Ας ξεκινήσουμε τις αποστολές!</Text>
          )}
          {pendingCount > 0 && (
            <Text style={[styles.pendingText, { color: themeColors.textSecondary }]}>⏳ {pendingCount} περιμένουν έγκριση</Text>
          )}
        </View>
      </View>

      {/* Recent Achievements */}
      {dashboard?.recent_achievements && dashboard.recent_achievements.length > 0 && (
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>🏆 Πρόσφατα Επιτεύγματα</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dashboard.recent_achievements.slice(0, 5).map((achievement: any, index: number) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementPoints}>+{achievement.points} ⭐</Text>
                <Text style={styles.achievementName} numberOfLines={1}>{achievement.habit_name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Redemptions (if any) */}
      {dashboard?.recent_redemptions && dashboard.recent_redemptions.length > 0 && (
        <View style={styles.redemptionsCard}>
          <Text style={styles.sectionTitle}>🎁 Πρόσφατες Ανταμοιβές</Text>
          {dashboard.recent_redemptions.slice(0, 3).map((redemption: any, index: number) => (
            <View key={index} style={styles.redemptionItem}>
              <Text style={styles.redemptionName}>{redemption.reward_name}</Text>
              <Text style={styles.redemptionCost}>-{redemption.points_spent} ⭐</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tasks List */}
      <Text style={styles.tasksTitle}>📝 Οι εργασίες σου</Text>

      {tasks.map((task) => {
        // Check if task has been postponed (has data in postponedHabits)
        const postponeData = postponedHabits[task.habit_id];
        const isActivelyPostponed = !!postponeData;
        
        return (
          <TaskCard
            key={task.habit_id}
            habitId={task.habit_id}
            nameEl={task.name_el}
            nameEn={task.name_en}
            points={task.points}
            category={task.category}
            verificationType={task.verification_type}
            completed={task.completed}
            status={task.status}
            emoji={task.emoji}
            description={task.description_el}
            whyImportant={task.why_important_el}
            helpRequested={task.help_requested}
            completedCount={task.completed_count || 0}
            pendingCount={task.pending_count || 0}
            requiredCount={task.required_count || 1}
            progressText={task.progress_text}
            remainingCount={task.remaining_count || 0}
            canRetry={task.can_retry !== false}
            retryBlockedUntil={task.retry_blocked_until}
            isPostponed={isActivelyPostponed}
            postponedReminderAt={postponeData?.reminder_at}
            onComplete={() => handleComplete(task.habit_id, task.name_el)}
            onPress={() => handleTaskPress(task)}
            disabled={completing === task.habit_id}
            themeColors={{
              cardBackground: themeColors.cardBackground,
              textPrimary: themeColors.textPrimary,
              textSecondary: themeColors.textSecondary,
            }}
          />
        );
      })}

      {tasks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎮</Text>
          <Text style={styles.emptyTitle}>Δεν υπάρχουν αποστολές σήμερα</Text>
          <Text style={styles.emptyText}>Ζήτα από τους γονείς σου να προσθέσουν!</Text>
        </View>
      )}
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  welcomeEmoji: {
    fontSize: 32,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  envelopeContainer: {
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFDE7',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  envelopeHint: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeAvatarContainer: {
    marginRight: 12,
  },
  homeAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.softBlue,
  },
  homeAvatarEmoji: {
    fontSize: 48,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  motivationText: {
    fontSize: 16,
    color: COLORS.softBlue,
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsSection: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  pointsLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  statsSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
  },
  progressCard: {
    backgroundColor: COLORS.brightYellow,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 6,
  },
  rainbowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rainbowEmoji: {
    fontSize: 10,
  },
  progressFooter: {
    alignItems: 'center',
  },
  progressComplete: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressGood: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressStart: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  pendingText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  achievementsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  achievementItem: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  achievementPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  achievementName: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginTop: 4,
    textAlign: 'center',
  },
  redemptionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  redemptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  redemptionName: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  redemptionCost: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warmCoral,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  // Reward Hint Card Styles
  rewardHintCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.brightYellow,
    borderStyle: 'dashed',
  },
  rewardHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardHintEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  rewardHintTextContainer: {
    flex: 1,
  },
  rewardHintTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  rewardHintText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  rewardHintCta: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
});
