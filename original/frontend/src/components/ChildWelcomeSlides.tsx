import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CHILD_WELCOME_SLIDES = [
  {
    id: 1,
    emoji: '🦸',
    title: 'Γεια σου, Ηρωα!',
    description: 'Είσαι έτοιμος να γίνεις Habit Hero; Κάνε τις καθημερινές σου δραστηριότητες και κέρδισε πόντους!',
    color: '#4A90E2',
  },
  {
    id: 2,
    emoji: '✅',
    title: 'Ολοκλήρωσε Συνήθειες',
    description: 'Πάτα το ✓ όταν κάνεις κάτι! Αν χρειάζεται έγκριση, θα περιμένεις τους γονείς σου.',
    color: '#7ED321',
  },
  {
    id: 3,
    emoji: '⏰',
    title: 'Πες "Αργότερα"',
    description: 'Δεν προλαβαίνεις τώρα; Πάτα το ⏰ και θα σου θυμίσουμε σε 30 λεπτά! Η δραστηριότητα θα γίνει πορτοκαλί.',
    color: '#FF9800',
  },
  {
    id: 4,
    emoji: '⭐',
    title: 'Κέρδισε Πόντους',
    description: 'Κάθε δραστηριότητα δίνει πόντους! Ανέβα επίπεδο και γίνε Legendary Hero με 10.000 πόντους!',
    color: '#9B59B6',
  },
  {
    id: 5,
    emoji: '🎁',
    title: 'Πάρε Δώρα',
    description: 'Με τους πόντους σου μπορείς να πάρεις δώρα! Δες τι έχουν ετοιμάσει οι γονείς σου στα Έπαθλα.',
    color: '#E74C3C',
  },
  {
    id: 6,
    emoji: '💝',
    title: 'Έκπληξη Αγάπης!',
    description: 'Μερικές φορές οι γονείς σου θα σου στείλουν πόντους αγάπης! Δες το 💌 για μηνύματα!',
    color: '#E91E63',
  },
  {
    id: 7,
    emoji: '💬',
    title: 'Ζήτα Βοήθεια',
    description: 'Αν κάτι είναι δύσκολο, πάτα το χέρι ✋ για να ζητήσεις βοήθεια από τους γονείς σου!',
    color: '#3498DB',
  },
  {
    id: 8,
    emoji: '🚀',
    title: 'Πάμε!',
    description: 'Είσαι έτοιμος! Κάνε τις δραστηριότητές σου, κέρδισε πόντους και γίνε ο καλύτερος Habit Hero!',
    color: '#4A90E2',
    cta: true,
  },
];

interface ChildWelcomeProps {
  onComplete: () => void;
}

export function ChildWelcomeSlides({ onComplete }: ChildWelcomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<any>(null);
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    if (currentSlide < CHILD_WELCOME_SLIDES.length - 1) {
      slideRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    slideRef.current?.scrollTo({
      x: (CHILD_WELCOME_SLIDES.length - 1) * width,
      animated: true,
    });
    setCurrentSlide(CHILD_WELCOME_SLIDES.length - 1);
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('child_welcome_seen', 'true');
    onComplete();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (slideIndex !== currentSlide) {
          setCurrentSlide(slideIndex);
        }
      },
    }
  );

  const renderSlide = (slide: typeof CHILD_WELCOME_SLIDES[0], index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={slide.id}
        style={[styles.slide, { transform: [{ scale }], opacity }]}
      >
        <View style={[styles.slideContent, { backgroundColor: slide.color + '15' }]}>
          <Animated.Text
            style={[
              styles.slideEmoji,
              {
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {slide.emoji}
          </Animated.Text>

          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {slide.cta && (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: slide.color }]} onPress={handleStart}>
              <Text style={styles.startButtonText}>Ας Ξεκινήσουμε!</Text>
              <Ionicons name="rocket" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentSlide < CHILD_WELCOME_SLIDES.length - 1 && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Παράλειψη</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.ScrollView
        ref={slideRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {CHILD_WELCOME_SLIDES.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      <View style={styles.pagination}>
        {CHILD_WELCOME_SLIDES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: CHILD_WELCOME_SLIDES[currentSlide].color,
                },
              ]}
            />
          );
        })}
      </View>

      {currentSlide < CHILD_WELCOME_SLIDES.length - 1 && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: CHILD_WELCOME_SLIDES[currentSlide].color }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Επόμενο</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  slideContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 18,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});
