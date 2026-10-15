import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AVATARS } from '../constants/avatars';
import { COLORS } from '../constants/colors';

interface AvatarSelectorProps {
  selectedId: number;
  onSelect: (id: number) => void;
  size?: 'small' | 'medium' | 'large';
}

export function AvatarSelector({ selectedId, onSelect, size = 'medium' }: AvatarSelectorProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return { avatar: 50, font: 24 };
      case 'large': return { avatar: 80, font: 40 };
      default: return { avatar: 64, font: 32 };
    }
  };

  const dimensions = getSize();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.hint}>👆 Σύρετε για περισσότερα avatars →</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.container}
      >
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarButton,
              { width: dimensions.avatar, height: dimensions.avatar },
              selectedId === avatar.id && styles.selected,
            ]}
            onPress={() => onSelect(avatar.id)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: dimensions.font }}>{avatar.image}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  hint: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  avatarButton: {
    borderRadius: 32,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: COLORS.softBlue,
    backgroundColor: '#E8F4FD',
  },
});
