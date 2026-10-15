import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../constants/colors';
import { useResponsiveScale } from './ScaledComponents';

interface TaskCardProps {
  habitId: string;
  nameEl: string;
  nameEn: string;
  points: number;
  category: string;
  verificationType: string;
  completed: boolean;
  status: string | null;
  emoji?: string;
  description?: string;
  whyImportant?: string;
  helpRequested?: boolean;
  // Progress props
  completedCount?: number;
  pendingCount?: number;
  requiredCount?: number;
  progressText?: string | null;
  remainingCount?: number;
  canRetry?: boolean;
  retryBlockedUntil?: string | null;
  // Postpone props
  isPostponed?: boolean;
  postponedReminderAt?: string | null;
  onComplete: () => void;
  onPostpone?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  // Theme props
  themeColors?: {
    cardBackground?: string;
    textPrimary?: string;
    textSecondary?: string;
  };
}

export function TaskCard({
  habitId,
  nameEl,
  nameEn,
  points,
  category,
  verificationType,
  completed,
  status,
  emoji,
  description,
  whyImportant,
  helpRequested,
  completedCount = 0,
  pendingCount = 0,
  requiredCount = 1,
  progressText,
  remainingCount = 0,
  canRetry = true,
  retryBlockedUntil,
  isPostponed = false,
  postponedReminderAt,
  onComplete,
  onPostpone,
  onPress,
  disabled,
  themeColors,
}: TaskCardProps) {
  const { fs, sp, sz, icon } = useResponsiveScale();
  const categoryColor = CATEGORY_COLORS[category] || COLORS.general;
  const isWaitingForHelp = helpRequested && !completed;
  const hasProgress = requiredCount > 1;
  const isPartiallyCompleted = completedCount > 0 && completedCount < requiredCount;
  
  // Use theme colors if provided, otherwise fallback to defaults
  const cardBg = themeColors?.cardBackground || COLORS.white;
  const textPrimary = themeColors?.textPrimary || COLORS.darkGray;
  const textSecondary = themeColors?.textSecondary || COLORS.mediumGray;
  
  // Cooldown ref to prevent fast clicking (1 second delay)
  const lastClickTime = useRef<number>(0);
  const CLICK_COOLDOWN_MS = 1000; // 1 second cooldown
  
  // Check if waiting for parent approval (can't submit more)
  const isWaitingForApproval = pendingCount > 0 && (completedCount + pendingCount >= requiredCount);
  const isFullyPending = pendingCount >= requiredCount;
  
  // Check if blocked by retry delay
  const isRetryBlocked = !canRetry && retryBlockedUntil;
  
  // Determine if the button should be blocked
  const isBlocked = isWaitingForApproval || completed || isWaitingForHelp || isRetryBlocked;
  
  // Calculate remaining retry time
  const getRetryTimeRemaining = () => {
    if (!retryBlockedUntil) return null;
    const blockedUntil = new Date(retryBlockedUntil);
    const now = new Date();
    const diffMs = blockedUntil.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} λεπτά`;
    }
    const diffHours = Math.ceil(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} ώρ${diffHours === 1 ? 'α' : 'ες'}`;
    }
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays} ημέρ${diffDays === 1 ? 'α' : 'ες'}`;
  };
  
  // Calculate remaining postpone time and check if expired
  const getPostponeTimeRemaining = () => {
    if (!postponedReminderAt) return null;
    // Ensure the date is parsed as UTC by adding Z if not present
    let reminderAtStr = postponedReminderAt;
    if (!reminderAtStr.endsWith('Z') && !reminderAtStr.includes('+')) {
      reminderAtStr = reminderAtStr + 'Z';
    }
    const reminderTime = new Date(reminderAtStr);
    const now = new Date();
    const diffMs = reminderTime.getTime() - now.getTime();
    if (diffMs <= 0) return 'τώρα!';
    
    const diffMins = Math.ceil(diffMs / 60000);
    return `${diffMins} λεπτά`;
  };
  
  // Check if postpone time has expired (30 mins passed)
  const isPostponeExpired = () => {
    if (!postponedReminderAt) return false;
    // Ensure the date is parsed as UTC by adding Z if not present
    let reminderAtStr = postponedReminderAt;
    if (!reminderAtStr.endsWith('Z') && !reminderAtStr.includes('+')) {
      reminderAtStr = reminderAtStr + 'Z';
    }
    const reminderTime = new Date(reminderAtStr);
    const now = new Date();
    
    return now.getTime() >= reminderTime.getTime();
  };
  
  const handlePress = () => {
    // Check cooldown to prevent fast clicking
    const now = Date.now();
    if (now - lastClickTime.current < CLICK_COOLDOWN_MS) {
      // Still in cooldown, ignore click
      return;
    }
    lastClickTime.current = now;
    
    if (isRetryBlocked) {
      const timeRemaining = getRetryTimeRemaining();
      Alert.alert(
        '⏳ Περίμενε λίγο!',
        `Πρέπει να περιμένεις ${timeRemaining || 'λίγο'} πριν ξαναδοκιμάσεις αυτή τη δραστηριότητα.\n\nΟι γονείς σου έχουν ορίσει αυτό το διάστημα ανάμεσα στις προσπάθειες.${needsApproval ? '\n\nΘυμήσου: θα χρειαστείς και έγκριση από τους γονείς σου! 💪' : ''}`,
        [{ text: 'Εντάξει!', style: 'default' }]
      );
      return;
    }
    if (onPress) {
      onPress();
    } else {
      onComplete();
    }
  };

  const handlePostpone = () => {
    if (onPostpone) {
      Alert.alert(
        '⏰ Αργότερα;',
        'Θα σου στείλω υπενθύμιση σε 30 λεπτά!',
        [
          { text: 'Άκυρο', style: 'cancel' },
          { text: 'Ναι, αργότερα!', onPress: onPostpone }
        ]
      );
    }
  };

  const getStatusIcon = () => {
    // Show hourglass for postponed tasks
    if (isPostponed) {
      const isExpired = isPostponeExpired();
      const hourglassColor = isExpired ? COLORS.warmCoral : COLORS.softGreen;
      return <Ionicons name="hourglass" size={28} color={hourglassColor} />;
    }
    if (isRetryBlocked) {
      return <Ionicons name="hourglass" size={28} color="#9E9E9E" />;
    }
    if (isWaitingForHelp) {
      return <Ionicons name="hand-left" size={28} color={COLORS.softBlue} />;
    }
    if (!completed) return null;
    
    switch (status) {
      case 'approved':
        return <Ionicons name="checkmark-circle" size={28} color={COLORS.softGreen} />;
      case 'pending':
        return <Ionicons name="time" size={28} color={COLORS.brightYellow} />;
      case 'rejected':
        return <Ionicons name="close-circle" size={28} color={COLORS.warmCoral} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (isRetryBlocked) {
      const timeRemaining = getRetryTimeRemaining();
      return `Περίμενε ${timeRemaining || '...'}`;
    }
    if (isWaitingForHelp) {
      return 'Αναμονή Βοήθειας';
    }
    if (isWaitingForApproval) {
      return `Περιμένει Έγκριση (${pendingCount})`;
    }
    if (!completed) return null;
    
    switch (status) {
      case 'approved':
        return 'Εγκρίθηκε';
      case 'pending':
        return 'Αναμονή';
      case 'rejected':
        return 'Απορρίφθηκε';
      default:
        return null;
    }
  };

  const needsApproval = verificationType === 'parent_verified' || verificationType === 'parent_verified_optional';
  
  // Determine card style based on state
  const cardStyles = [
    styles.container,
    { backgroundColor: cardBg },  // Use theme background
    completed && styles.completed,
    status === 'rejected' && styles.rejected,
    isRetryBlocked && styles.retryBlocked,
    isWaitingForHelp && styles.waitingForHelp,
    isWaitingForApproval && styles.waitingForApproval,
    isPostponed && styles.postponed, // NEW: orange highlight for postponed
  ];

  return (
    <>
    <TouchableOpacity
      style={cardStyles}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={isBlocked ? 0.9 : 0.7}
    >
      {emoji && (
        <View style={[
          styles.emojiContainer, 
          { width: sz(52), height: sz(52) },
          (isWaitingForHelp || isWaitingForApproval || isRetryBlocked) && styles.emojiContainerDisabled,
          isPostponed && styles.emojiContainerPostponed,
        ]}>
          <Text style={[
            styles.emoji, 
            { fontSize: fs(24) },
            (isWaitingForHelp || isWaitingForApproval || isRetryBlocked) && styles.emojiDisabled
          ]}>{emoji}</Text>
        </View>
      )}
      {!emoji && <View style={[
        styles.categoryIndicator, 
        { width: sz(6) },
        { backgroundColor: isPostponed ? '#FF9800' : (isWaitingForHelp || isWaitingForApproval || isRetryBlocked) ? COLORS.mediumGray : categoryColor }
      ]} />}
      
      <View style={[styles.content, { padding: sp(16) }]}>
        <Text style={[
          styles.name, 
          { fontSize: fs(16), color: textPrimary },
          completed && styles.nameCompleted, 
          isWaitingForHelp && styles.nameWaiting,
          isWaitingForApproval && styles.nameWaiting,
          isRetryBlocked && styles.nameWaiting,
          isPostponed && styles.namePostponed, // Bold + orange color
        ]}>
          {isPostponed && '⏰ '}{nameEl}
        </Text>
        <Text style={[styles.nameEn, { fontSize: fs(12), color: textSecondary }]}>{nameEn}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={icon(14)} color={COLORS.brightYellow} />
            <Text style={[styles.pointsText, { fontSize: fs(13) }]}>{points}</Text>
          </View>
          
          {hasProgress && (
            <View style={[
              styles.progressBadge,
              isPartiallyCompleted && styles.progressBadgeInProgress,
              completed && styles.progressBadgeComplete
            ]}>
              <Text style={[
                styles.progressText,
                isPartiallyCompleted && styles.progressTextInProgress,
                completed && styles.progressTextComplete
              ]}>
                {completedCount}/{requiredCount}
              </Text>
            </View>
          )}
          
          {isPostponed && postponedReminderAt && (
            <View style={styles.postponeBadge}>
              <Ionicons name="alarm" size={12} color="#FF9800" />
              <Text style={styles.postponeText}>σε {getPostponeTimeRemaining()}</Text>
            </View>
          )}
          
          {needsApproval && !isPostponed && (
            <View style={styles.verificationBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.softBlue} />
              <Text style={styles.verificationText}>Γονική επαλήθευση</Text>
            </View>
          )}
        </View>
      </View>

      {/* Right side - Icon only */}
      <View style={styles.iconContainer}>
        {isPostponed ? (
          // Postponed: show hourglass icon (green if waiting, red if expired)
          <View style={[
            styles.statusIconCircle,
            isPostponeExpired() ? styles.iconCirclePostponedExpired : styles.iconCirclePostponed,
          ]}>
            <Ionicons name="hourglass" size={24} color={COLORS.white} />
          </View>
        ) : (completed || isWaitingForHelp || isWaitingForApproval || isRetryBlocked) ? (
          // Status icons
          <View style={[
            styles.statusIconCircle,
            status === 'approved' && styles.iconCircleApproved,
            status === 'pending' && styles.iconCirclePending,
            status === 'rejected' && styles.iconCircleRejected,
            isWaitingForHelp && styles.iconCircleHelp,
            isWaitingForApproval && styles.iconCirclePendingApproval,
            isRetryBlocked && styles.iconCircleBlocked,
          ]}>
            {isRetryBlocked ? (
              <Ionicons name="hourglass" size={24} color={COLORS.white} />
            ) : isWaitingForApproval ? (
              <Ionicons name="hourglass" size={24} color={COLORS.white} />
            ) : isWaitingForHelp ? (
              <Ionicons name="hand-left" size={24} color={COLORS.white} />
            ) : status === 'approved' ? (
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
            ) : status === 'pending' ? (
              <Ionicons name="time" size={24} color={COLORS.white} />
            ) : status === 'rejected' ? (
              <Ionicons name="close" size={24} color={COLORS.white} />
            ) : (
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
            )}
          </View>
        ) : (
          // Action button (green checkmark)
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handlePress}
          >
            <Ionicons name="checkmark" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    
    {/* Status text row below the card */}
    {(completed || isWaitingForHelp || isWaitingForApproval || isRetryBlocked || isPostponed) && getStatusText() && (
      <View style={[
        styles.statusTextRow,
        status === 'approved' && styles.statusRowApproved,
        status === 'pending' && styles.statusRowPending,
        status === 'rejected' && styles.statusRowRejected,
        isWaitingForHelp && styles.statusRowHelp,
        isWaitingForApproval && styles.statusRowPendingApproval,
        isRetryBlocked && styles.statusRowBlocked,
        isPostponed && styles.statusRowPostponed,
      ]}>
        <Text style={[
          styles.statusRowText,
          status === 'approved' && styles.statusTextApproved,
          status === 'pending' && styles.statusTextPending,
          status === 'rejected' && styles.statusTextRejected,
          isWaitingForHelp && styles.statusTextHelp,
          isWaitingForApproval && styles.statusTextPendingApproval,
          isRetryBlocked && styles.statusTextBlocked,
          isPostponed && styles.statusTextPostponed,
        ]}>
          {isPostponed && postponedReminderAt 
            ? `⏰ Υπενθύμιση σε ${getPostponeTimeRemaining()}`
            : getStatusText()
          }
        </Text>
      </View>
    )}
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  completed: {
    opacity: 0.8,
    backgroundColor: '#F8FFF8',
  },
  rejected: {
    backgroundColor: '#FFF8F8',
  },
  waitingForHelp: {
    opacity: 0.6,
    backgroundColor: '#F0F8FF',
  },
  waitingForApproval: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  retryBlocked: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
    opacity: 0.8,
  },
  // NEW: Postponed styling
  postponed: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  categoryIndicator: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.mediumGray,
  },
  nameWaiting: {
    color: COLORS.mediumGray,
  },
  // NEW: Postponed name styling
  namePostponed: {
    fontWeight: '800',
    color: '#E65100',
  },
  nameEn: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verificationText: {
    fontSize: 10,
    color: COLORS.softBlue,
  },
  // NEW: Postpone badge
  postponeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  postponeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9800',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeInProgress: {
    backgroundColor: '#FFF3E0',
  },
  progressBadgeComplete: {
    backgroundColor: '#E8F5E9',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  progressTextInProgress: {
    color: '#FF9800',
  },
  progressTextComplete: {
    color: COLORS.softGreen,
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  statusBadge: {
    alignItems: 'center',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
  },
  statusApproved: {
    color: COLORS.softGreen,
  },
  statusPending: {
    color: COLORS.brightYellow,
  },
  statusRejected: {
    color: COLORS.warmCoral,
  },
  statusWaiting: {
    color: COLORS.softBlue,
  },
  statusWaitingApproval: {
    color: '#FF9800',
    fontWeight: '600',
  },
  statusBadgeRetryBlocked: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusRetryBlocked: {
    color: '#9E9E9E',
    fontWeight: '600',
  },
  // NEW: Action buttons container
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // NEW: Postpone button
  postponeButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB74D',
    gap: 4,
  },
  postponeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // NEW: Pulsing effect for postponed task check button
  checkButtonPostponed: {
    backgroundColor: '#FF9800',
  },
  emojiContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  emojiContainerDisabled: {
    backgroundColor: '#E8E8E8',
  },
  // NEW: Postponed emoji container
  emojiContainerPostponed: {
    backgroundColor: '#FFE0B2',
  },
  emoji: {
    fontSize: 24,
  },
  emojiDisabled: {
    opacity: 0.5,
  },
  // NEW: Icon container (right side - replaces statusContainer)
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
    paddingLeft: 8,
  },
  // Status icon circle styles
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.softGreen,
  },
  iconCircleApproved: {
    backgroundColor: COLORS.softGreen,
  },
  iconCirclePending: {
    backgroundColor: COLORS.brightYellow,
  },
  iconCircleRejected: {
    backgroundColor: COLORS.warmCoral,
  },
  iconCircleHelp: {
    backgroundColor: COLORS.softBlue,
  },
  iconCirclePendingApproval: {
    backgroundColor: '#FF9800',
  },
  iconCircleBlocked: {
    backgroundColor: '#9E9E9E',
  },
  // Postponed hourglass styles (green when waiting, red when expired)
  iconCirclePostponed: {
    backgroundColor: COLORS.softGreen,
  },
  iconCirclePostponedExpired: {
    backgroundColor: COLORS.warmCoral,
  },
  // Status text row below card
  statusTextRow: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 50,
    marginRight: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  statusRowApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusRowPending: {
    backgroundColor: '#FFFDE7',
  },
  statusRowRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusRowHelp: {
    backgroundColor: '#E3F2FD',
  },
  statusRowPendingApproval: {
    backgroundColor: '#FFF3E0',
  },
  statusRowBlocked: {
    backgroundColor: '#EEEEEE',
  },
  statusRowPostponed: {
    backgroundColor: '#FFF3E0',
  },
  statusRowText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: COLORS.darkGray,
  },
  statusTextApproved: {
    color: COLORS.softGreen,
  },
  statusTextPending: {
    color: '#F9A825',
  },
  statusTextRejected: {
    color: COLORS.warmCoral,
  },
  statusTextHelp: {
    color: COLORS.softBlue,
  },
  statusTextPendingApproval: {
    color: '#FF9800',
  },
  statusTextBlocked: {
    color: '#9E9E9E',
  },
  statusTextPostponed: {
    color: '#E65100',
  },
});
