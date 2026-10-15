import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { childNotificationsAPI } from '../services/api';

interface Notification {
  notification_id: string;
  type: string;
  title?: string;
  message?: string;
  message_el?: string;
  full_message?: string;
  habit_name?: string;
  points?: number;
  amount?: number;
  icon_emoji?: string;
  credits_claimed?: boolean;
  read?: boolean;
  is_read?: boolean;
  created_at: string;
}

interface AnimatedEnvelopeProps {
  count: number;
  notifications: Notification[];
  onPress: () => void;
  onMarkAllRead: () => void;
  onPointsClaimed?: (points: number) => void;
}

export function AnimatedEnvelope({
  count,
  notifications,
  onPress,
  onMarkAllRead,
  onPointsClaimed,
}: AnimatedEnvelopeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [claimedNotifications, setClaimedNotifications] = useState<Set<string>>(new Set());
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      // Start continuous animations when there are notifications
      startBounceAnimation();
      startShakeAnimation();
      startGlowAnimation();
    }
  }, [count]);

  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.15,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handlePress = () => {
    setModalVisible(true);
    onPress();
  };

  const handleClose = () => {
    setModalVisible(false);
    if (notifications.length > 0) {
      onMarkAllRead();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_approved':
        return { name: 'checkmark-circle', color: COLORS.softGreen, emoji: '✅' };
      case 'task_rejected':
        return { name: 'close-circle', color: COLORS.warmCoral, emoji: '❌' };
      case 'encourage_retry':
        return { name: 'refresh-circle', color: COLORS.softBlue, emoji: '💪' };
      case 'help_resolved':
        return { name: 'chatbubble-ellipses', color: '#9C27B0', emoji: '💬' };
      case 'help_response':
        return { name: 'heart-circle', color: COLORS.warmCoral, emoji: '❤️' };
      case 'reward_ready':
        return { name: 'gift', color: '#FF9800', emoji: '🎁' };
      case 'love_credits':
        return { name: 'heart', color: '#E91E63', emoji: '💝' };
      case 'postpone_set':
        return { name: 'time', color: '#FF9800', emoji: '⏰' };
      case 'postpone_reminder':
        return { name: 'alarm', color: '#FF9800', emoji: '⏰' };
      default:
        return { name: 'mail', color: COLORS.softBlue, emoji: '📬' };
    }
  };

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.8)'],
  });

  const handleNotificationPress = async (notif: Notification) => {
    // Love credits are already added when parent sends them
    // Just show a nice message when child views it
    if (notif.type === 'love_credits') {
      const displayPoints = notif.points || notif.amount || 0;
      Alert.alert(
        '💝 Πόντοι Αγάπης!',
        `${notif.message || notif.full_message || 'Ο γονιός σου σου έστειλε πόντους αγάπης!'}\n\n+${displayPoints} πόντοι προστέθηκαν!`,
        [{ text: 'Τέλεια! 🎉' }]
      );
    }
  };

  if (count === 0) {
    return null;
  }

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.envelopeContainer,
            {
              transform: [
                { scale: bounceAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowEffect,
              { backgroundColor: glowInterpolate },
            ]}
          />
          <View style={styles.envelope}>
            <Text style={styles.envelopeEmoji}>💌</Text>
          </View>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💌 Μηνύματα από τους Γονείς</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📭</Text>
                  <Text style={styles.emptyText}>Δεν υπάρχουν νέα μηνύματα</Text>
                </View>
              ) : (
                notifications.map((notif) => {
                  const icon = getNotificationIcon(notif.type);
                  // Get display values with fallbacks
                  const displayEmoji = notif.icon_emoji || icon.emoji;
                  const displayTitle = notif.title || notif.message_el || 'Μήνυμα';
                  const displayMessage = notif.message || notif.full_message || '';
                  const displayPoints = notif.points || notif.amount || 0;
                  const isLoveCredits = notif.type === 'love_credits';
                  const isClaimed = notif.credits_claimed || claimedNotifications.has(notif.notification_id);
                  
                  return (
                    <TouchableOpacity 
                      key={notif.notification_id} 
                      style={[
                        styles.notificationCard,
                        isLoveCredits && styles.loveCreditsCard,
                        isLoveCredits && isClaimed && styles.claimedCard
                      ]}
                      onPress={() => handleNotificationPress(notif)}
                      activeOpacity={isLoveCredits && !isClaimed ? 0.7 : 1}
                    >
                      <View style={[styles.notificationIcon, { backgroundColor: icon.color + '20' }]}>
                        <Text style={styles.notificationEmoji}>{displayEmoji}</Text>
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{displayTitle}</Text>
                        {displayMessage ? (
                          <Text style={styles.notificationMessage}>{displayMessage}</Text>
                        ) : null}
                        {displayPoints > 0 && (
                          <View style={styles.pointsBadge}>
                            <Ionicons name="star" size={14} color={COLORS.brightYellow} />
                            <Text style={styles.pointsText}>
                              +{displayPoints} πόντοι
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity onPress={handleClose} style={styles.gotItButton}>
              <Text style={styles.gotItText}>Κατάλαβα! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  envelopeContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  envelope: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  envelopeEmoji: {
    fontSize: 32,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.warmCoral,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationEmoji: {
    fontSize: 28,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 4,
  },
  gotItButton: {
    backgroundColor: COLORS.softGreen,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gotItText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Love Credits specific styles
  loveCreditsCard: {
    backgroundColor: '#FFF0F5',
    borderWidth: 2,
    borderColor: '#FFB6C1',
  },
  claimedCard: {
    backgroundColor: '#F0F0F0',
    borderColor: '#CCC',
  },
  claimedBadge: {
    backgroundColor: '#E0E0E0',
  },
  claimedText: {
    color: '#888',
  },
});
