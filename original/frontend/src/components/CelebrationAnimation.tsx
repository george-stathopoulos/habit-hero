import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  emoji?: string;
}

interface CelebrationAnimationProps {
  visible: boolean;
  type?: 'confetti' | 'thumbsUp' | 'stars' | 'hearts';
  onComplete?: () => void;
  message?: string;
}

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F8B500',
  '#FF9F1C', '#7B68EE', '#00CED1', '#FF69B4', '#32CD32',
];

const CELEBRATION_EMOJIS = {
  confetti: ['🎉', '🎊', '✨', '🌟', '💫', '⭐'],
  thumbsUp: ['👍', '💪', '🙌', '👏', '🤩', '😎'],
  stars: ['⭐', '🌟', '✨', '💫', '🌠', '☀️'],
  hearts: ['❤️', '💕', '💖', '💗', '💓', '🥰'],
};

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  type = 'confetti',
  onComplete,
  message,
}) => {
  const pieces = useRef<ConfettiPiece[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Create confetti pieces
      pieces.current = Array.from({ length: 30 }, () => ({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-50),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        emoji: CELEBRATION_EMOJIS[type][Math.floor(Math.random() * CELEBRATION_EMOJIS[type].length)],
      }));

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate message
      Animated.sequence([
        Animated.spring(messageScale, {
          toValue: 1.2,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(messageScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate each piece
      pieces.current.forEach((piece, index) => {
        const delay = index * 30;
        const duration = 2000 + Math.random() * 1000;

        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.x._value + (Math.random() - 0.5) * 200,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(piece.rotate, {
              toValue: 360,
              duration: 1000,
              useNativeDriver: true,
            })
          ),
        ]).start();
      });

      // Auto hide after animation
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, 2500);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="none">
      {pieces.current.map((piece, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.confettiPiece,
            {
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: piece.scale },
              ],
            },
          ]}
        >
          {piece.emoji}
        </Animated.Text>
      ))}
      
      {message && (
        <Animated.View
          style={[
            styles.messageContainer,
            { transform: [{ scale: messageScale }] },
          ]}
        >
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Quick celebration effects for specific actions
export const QuickCelebration: React.FC<{
  type: 'success' | 'points' | 'streak' | 'badge';
  visible: boolean;
  value?: number | string;
}> = ({ type, visible, value }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500);
    }
  }, [visible]);

  if (!visible) return null;

  const getContent = () => {
    switch (type) {
      case 'success':
        return { emoji: '✅', text: 'Μπράβο!', color: COLORS.softGreen };
      case 'points':
        return { emoji: '⭐', text: `+${value} πόντοι!`, color: COLORS.brightYellow };
      case 'streak':
        return { emoji: '🔥', text: `${value} μέρες!`, color: '#FF6B6B' };
      case 'badge':
        return { emoji: '🏆', text: 'Νέο Badge!', color: '#FFD700' };
      default:
        return { emoji: '🎉', text: 'Τέλεια!', color: COLORS.softBlue };
    }
  };

  const content = getContent();

  return (
    <Animated.View
      style={[
        styles.quickContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: content.color,
        },
      ]}
    >
      <Text style={styles.quickEmoji}>{content.emoji}</Text>
      <Text style={styles.quickText}>{content.text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 24,
    zIndex: 99999,
    elevation: 99999,
  },
  messageContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  messageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  quickContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -80,
    width: 160,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 99999,
    zIndex: 99999,
  },
  quickEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  quickText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
});
