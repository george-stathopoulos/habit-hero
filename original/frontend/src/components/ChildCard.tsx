import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS } from '../constants/avatars';
import { COLORS } from '../constants/colors';

interface ChildCardProps {
  name: string;
  avatarId: number;
  totalPoints: number;
  currentStreak: number;
  avatarLevel: number;
  customAvatar?: string | null;
  onPress: () => void;
  onEdit?: () => void;
  onManageHabits?: () => void;
}

export function ChildCard({
  name,
  avatarId,
  totalPoints,
  currentStreak,
  avatarLevel,
  customAvatar,
  onPress,
  onEdit,
  onManageHabits,
}: ChildCardProps) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {customAvatar ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${customAvatar}` }}
            style={styles.customAvatarImage}
          />
        ) : (
          <Text style={styles.avatarEmoji}>{avatar.image}</Text>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{avatarLevel}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={16} color={COLORS.brightYellow} />
            <Text style={styles.statValue}>{totalPoints}</Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="flame" size={16} color={COLORS.warmCoral} />
            <Text style={styles.statValue}>{currentStreak}</Text>
          </View>
        </View>
      </View>

      {onManageHabits && (
        <TouchableOpacity style={styles.habitsButton} onPress={onManageHabits}>
          <Ionicons name="list" size={20} color={COLORS.softBlue} />
        </TouchableOpacity>
      )}

      {onEdit && (
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="settings-outline" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      )}

      <Ionicons name="chevron-forward" size={24} color={COLORS.mediumGray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  customAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.softBlue,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  habitsButton: {
    padding: 8,
    marginRight: 4,
  },
});
