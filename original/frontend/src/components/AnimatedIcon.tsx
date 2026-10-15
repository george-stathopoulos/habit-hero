import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface AnimatedIconProps {
  type: 'pulse' | 'shake' | 'bounce' | 'glow';
  icon: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function AnimatedIcon({ 
  type, 
  icon, 
  size = 24, 
  color = COLORS.white,
  backgroundColor = COLORS.warmCoral 
}: AnimatedIconProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (type) {
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.2,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'shake':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 100,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: -1,
              duration: 100,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 100,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.delay(1000),
          ])
        );
        break;

      case 'bounce':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: -10,
              duration: 300,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 300,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
            Animated.delay(500),
          ])
        );
        break;

      case 'glow':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 800,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 800,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        );
        break;
    }

    animation.start();
    return () => animation.stop();
  }, [type]);

  const getTransform = () => {
    switch (type) {
      case 'pulse':
        return [{ scale: scaleValue }];
      case 'shake':
        return [{ translateX: Animated.multiply(animValue, 5) }];
      case 'bounce':
        return [{ translateY: animValue }];
      case 'glow':
        return [{ scale: Animated.add(1, Animated.multiply(animValue, 0.1)) }];
      default:
        return [];
    }
  };

  const glowOpacity = type === 'glow' 
    ? Animated.add(0.3, Animated.multiply(animValue, 0.4))
    : 1;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor },
        { transform: getTransform() },
        type === 'glow' && { opacity: glowOpacity },
      ]}
    >
      <Ionicons name={icon as any} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
