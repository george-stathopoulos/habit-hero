import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface SuccessAnimationProps {
  message?: string;
  points?: number;
  onComplete?: () => void;
}

export function SuccessAnimation({ 
  message = 'Μπράβο!', 
  points,
  onComplete 
}: SuccessAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Pop in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      // Wiggle
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Confetti animation
    Animated.loop(
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Auto-complete callback
    if (onComplete) {
      setTimeout(onComplete, 2500);
    }
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 80 + Math.random() * 40;
    const delay = Math.random() * 500;
    
    return (
      <Animated.View
        key={i}
        style={[
          styles.confetti,
          {
            backgroundColor: [
              COLORS.warmCoral,
              COLORS.sunnyYellow,
              COLORS.softGreen,
              COLORS.softBlue,
              COLORS.softPurple,
            ][i % 5],
            transform: [
              {
                translateX: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos((angle * Math.PI) / 180) * distance],
                }),
              },
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin((angle * Math.PI) / 180) * distance],
                }),
              },
              {
                scale: confettiAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ],
          },
        ]}
      />
    );
  });

  return (
    <View style={styles.container}>
      {confettiPieces}
      
      <Animated.View
        style={[
          styles.badge,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={80} color={COLORS.softGreen} />
      </Animated.View>

      <Animated.Text
        style={[
          styles.message,
          { opacity: scaleAnim },
        ]}
      >
        {message}
      </Animated.Text>

      {points && (
        <Animated.View
          style={[
            styles.pointsContainer,
            { opacity: scaleAnim },
          ]}
        >
          <Text style={styles.pointsText}>+{points}</Text>
          <Ionicons name="star" size={24} color={COLORS.brightYellow} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  badge: {
    marginBottom: 16,
  },
  message: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
