import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

type NotificationType = 'help' | 'approval' | 'info' | 'redemption';

interface NotificationBadgeProps {
  type: NotificationType;
  count: number;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function NotificationBadge({ type, count, title, subtitle, onPress }: NotificationBadgeProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count === 0) return;

    let animation: Animated.CompositeAnimation;

    if (type === 'help') {
      // Urgent shake + glow animation for help requests
      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.sequence([
              Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]),
          Animated.delay(2000),
        ])
      );
    } else if (type === 'approval') {
      // Gentle pulse animation for approvals
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    } else if (type === 'redemption') {
      // Fun bounce animation for redemptions (gift)
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
        ])
      );
    }

    if (animation) {
      animation.start();
      return () => animation.stop();
    }
  }, [count, type]);

  if (count === 0) return null;

  const getConfig = () => {
    switch (type) {
      case 'help':
        return {
          icon: 'hand-left',
          iconColor: COLORS.white,
          bgColor: COLORS.warmCoral,
          borderColor: '#FFE0E0',
          cardBg: '#FFF5F5',
        };
      case 'approval':
        return {
          icon: 'checkmark-circle',
          iconColor: COLORS.white,
          bgColor: COLORS.softBlue,
          borderColor: '#E0F0FF',
          cardBg: '#F5FAFF',
        };
      case 'redemption':
        return {
          icon: 'gift',
          iconColor: COLORS.white,
          bgColor: '#9B59B6', // Purple for gifts
          borderColor: '#E8D5F0',
          cardBg: '#F9F3FC',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: COLORS.white,
          bgColor: COLORS.mediumGray,
          borderColor: '#E0E0E0',
          cardBg: COLORS.lightGray,
        };
    }
  };

  const config = getConfig();

  const shakeTransform = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const getTransform = () => {
    if (type === 'help') {
      return [{ rotate: shakeTransform }];
    } else if (type === 'approval') {
      return [{ scale: pulseAnim }];
    } else if (type === 'redemption') {
      return [{ translateY: bounceAnim }];
    }
    return [];
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          { 
            backgroundColor: config.cardBg,
            borderColor: config.borderColor,
            transform: getTransform(),
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.iconCircle,
            { backgroundColor: config.bgColor },
            type === 'help' && {
              shadowColor: config.bgColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowAnim,
              shadowRadius: 10,
            },
          ]}
        >
          <Ionicons name={config.icon as any} size={24} color={config.iconColor} />
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
