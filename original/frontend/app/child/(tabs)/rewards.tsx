import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { rewardsAPI, pointsHistoryAPI, loveCreditsAPI, childAPI } from '../../../src/services/api';
import { CelebrationAnimation } from '../../../src/components/CelebrationAnimation';
import { useAuthStore } from '../../../src/store/authStore';
import { Gender, getGenderedText } from '../../../src/utils/greekGender';

export default function ChildRewards() {
  const { gender: storeGender } = useAuthStore();
  const gender: Gender = (storeGender === 'girl' ? 'girl' : 'boy');
  const genderedText = getGenderedText(gender);
  
  const [rewards, setRewards] = useState<any[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [history, setHistory] = useState<any>(null);
  const [loveCreditsStats, setLoveCreditsStats] = useState({ total_points: 0, total_count: 0 });
  const [loveCreditsHistory, setLoveCreditsHistory] = useState<any[]>([]);
  
  // Animation for points
  const pointsAnim = useRef(new Animated.Value(1)).current;

  const loadRewards = async () => {
    try {
      const [rewardsData, historyData, loveStats, loveHistory] = await Promise.all([
        rewardsAPI.getForChild(),
        pointsHistoryAPI.getChildHistory().catch(() => null),
        loveCreditsAPI.getChildStats().catch(() => ({ total_points: 0, total_count: 0 })),
        loveCreditsAPI.getChildHistory().catch(() => []),
      ]);
      setRewards(rewardsData.rewards || []);
      setCurrentPoints(rewardsData.current_points || 0);
      setHistory(historyData);
      setLoveCreditsStats(loveStats);
      setLoveCreditsHistory(loveHistory || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRewards();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRewards();
  };

  const handleRedeem = async (reward: any) => {
    if (!reward.can_redeem) {
      Alert.alert(
        '💫 Λίγο ακόμα!',
        `Χρειάζεσαι ${reward.points_needed} ακόμα πόντους για αυτό το έπαθλο. ${genderedText.keepGoing}`
      );
      return;
    }

    Alert.alert(
      '🎁 Εξαργύρωση',
      `Θέλεις να εξαργυρώσεις "${reward.name_el}" για ${reward.points_cost} πόντους;`,
      [
        { text: 'Όχι', style: 'cancel' },
        {
          text: 'Ναι!',
          onPress: async () => {
            setRedeeming(reward.reward_id);
            try {
              const result = await rewardsAPI.redeem(reward.reward_id);
              
              // Animate points decrease
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

              setCurrentPoints(result.remaining_points);
              setShowCelebration(true);
              
              // Reload rewards
              loadRewards();
              
              Alert.alert('🎉 ' + genderedText.wellDone, result.message);
            } catch (error: any) {
              Alert.alert('Ουπς!', error.message || 'Κάτι πήγε στραβά');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brightYellow} />
      </View>
    );
  }

  return (
    <>
      <CelebrationAnimation
        visible={showCelebration}
        type="stars"
        message="🎁 Έπαθλο!"
        onComplete={() => setShowCelebration(false)}
      />
      
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

      {/* Points Header */}
      <View style={styles.pointsHeader}>
        <Text style={styles.pointsLabel}>Οι Πόντοι σου</Text>
        <Animated.View style={[styles.pointsContainer, { transform: [{ scale: pointsAnim }] }]}>
          <Ionicons name="star" size={32} color={COLORS.brightYellow} />
          <Text style={styles.pointsValue}>{currentPoints}</Text>
        </Animated.View>
      </View>

      {/* Love Credits Stats */}
      {loveCreditsStats.total_count > 0 && (
        <View style={styles.loveCreditsCard}>
          <View style={styles.loveCreditsHeader}>
            <Ionicons name="heart" size={24} color="#E91E63" />
            <Text style={styles.loveCreditsTitle}>Πόντοι Αγάπης από τους Γονείς</Text>
          </View>
          <View style={styles.loveCreditsStats}>
            <View style={styles.loveStatItem}>
              <Text style={styles.loveStatValue}>{loveCreditsStats.total_points}</Text>
              <Text style={styles.loveStatLabel}>Συνολικοί Πόντοι</Text>
            </View>
            <View style={styles.loveStatDivider} />
            <View style={styles.loveStatItem}>
              <Text style={styles.loveStatValue}>{loveCreditsStats.total_count}</Text>
              <Text style={styles.loveStatLabel}>{loveCreditsStats.total_count === 1 ? 'Φορά' : 'Φορές'}</Text>
            </View>
          </View>
          
          {/* Love Credits History */}
          {loveCreditsHistory.length > 0 && (
            <View style={styles.loveCreditsHistorySection}>
              <Text style={styles.loveHistoryTitle}>💕 Ιστορικό Δώρων</Text>
              {loveCreditsHistory.slice(0, 5).map((item: any, index: number) => (
                <View key={index} style={styles.loveHistoryItem}>
                  <View style={styles.loveHistoryLeft}>
                    <Text style={styles.loveHistoryIcon}>{item.icon || '💝'}</Text>
                    <View style={styles.loveHistoryText}>
                      <Text style={styles.loveHistoryMessage} numberOfLines={2}>
                        {item.message || 'Δώρο αγάπης!'}
                      </Text>
                      <Text style={styles.loveHistoryDate}>
                        {new Date(item.created_at).toLocaleDateString('el-GR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.loveHistoryPoints}>+{item.points} ⭐</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>🎁 Διαθέσιμα Έπαθλα</Text>

      {rewards.length > 0 ? (
        rewards.map((reward) => (
          <TouchableOpacity
            key={reward.reward_id}
            style={[
              styles.rewardCard,
              !reward.can_redeem && styles.rewardCardLocked,
            ]}
            onPress={() => handleRedeem(reward)}
            disabled={redeeming === reward.reward_id}
            activeOpacity={0.7}
          >
            <View style={styles.rewardEmoji}>
              <Text style={styles.emojiText}>{reward.emoji || '🎁'}</Text>
            </View>
            
            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardName, !reward.can_redeem && styles.rewardNameLocked]}>
                {reward.name_el}
              </Text>
              {reward.description_el && (
                <Text style={styles.rewardDescription}>{reward.description_el}</Text>
              )}
              <View style={styles.rewardCost}>
                <Ionicons name="star" size={16} color={reward.can_redeem ? COLORS.brightYellow : COLORS.mediumGray} />
                <Text style={[styles.costText, !reward.can_redeem && styles.costTextLocked]}>
                  {reward.points_cost} πόντοι
                </Text>
              </View>
            </View>

            <View style={styles.rewardStatus}>
              {redeeming === reward.reward_id ? (
                <ActivityIndicator size="small" color={COLORS.softGreen} />
              ) : reward.can_redeem ? (
                <View style={styles.redeemButton}>
                  <Ionicons name="gift" size={20} color={COLORS.white} />
                </View>
              ) : (
                <View style={styles.lockedInfo}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.mediumGray} />
                  <Text style={styles.neededText}>-{reward.points_needed}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyTitle}>Δεν υπάρχουν έπαθλα ακόμα</Text>
          <Text style={styles.emptyText}>
            Ζήτα από τους γονείς σου να προσθέσουν έπαθλα!
          </Text>
        </View>
      )}

      {/* Points Summary & History */}
      {history && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📊 Τα Στατιστικά σου</Text>
          
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="arrow-up" size={24} color={COLORS.softGreen} />
              <Text style={styles.statValue}>{history.total_earned}</Text>
              <Text style={styles.statLabel}>Κερδισμένοι</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="arrow-down" size={24} color={COLORS.warmCoral} />
              <Text style={styles.statValue}>{history.total_spent}</Text>
              <Text style={styles.statLabel}>Ξοδευμένοι</Text>
            </View>
          </View>

          {/* Recent Redemptions */}
          {history.redemption_history && history.redemption_history.length > 0 && (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>🛒 Πρόσφατες Αγορές</Text>
              {history.redemption_history.slice(0, 5).map((item: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyReward}>{item.reward_name}</Text>
                  <Text style={styles.historyPoints}>-{item.points_spent} ⭐</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      </ScrollView>
    </>
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
  pointsHeader: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  // Love Credits Card styles
  loveCreditsCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFB6C1',
  },
  loveCreditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loveCreditsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
  loveCreditsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loveStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  loveStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C2185B',
  },
  loveStatLabel: {
    fontSize: 12,
    color: '#E91E63',
    marginTop: 2,
  },
  loveStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#FFB6C1',
    marginHorizontal: 16,
  },
  // Love Credits History styles
  loveCreditsHistorySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFB6C1',
    paddingTop: 12,
  },
  loveHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C2185B',
    marginBottom: 10,
  },
  loveHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  loveHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loveHistoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  loveHistoryText: {
    flex: 1,
  },
  loveHistoryMessage: {
    fontSize: 13,
    color: '#880E4F',
  },
  loveHistoryDate: {
    fontSize: 11,
    color: '#E91E63',
    marginTop: 2,
  },
  loveHistoryPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C2185B',
    marginLeft: 8,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rewardCardLocked: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  rewardEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 28,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  rewardNameLocked: {
    color: COLORS.mediumGray,
  },
  rewardDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 6,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  costTextLocked: {
    color: COLORS.mediumGray,
  },
  rewardStatus: {
    alignItems: 'center',
  },
  redeemButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedInfo: {
    alignItems: 'center',
  },
  neededText: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
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
  // Points history styles
  historySection: {
    marginTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  historyReward: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warmCoral,
  },
});
