import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

const INTRO_SLIDES = [
  {
    id: 1,
    emoji: '🎮',
    title: 'Καλώς ήρθες στο Habit Hero!',
    description: 'Αυτό είναι το δικό σου παιχνίδι για να γίνεις ήρωας των συνηθειών! Κάθε μέρα θα έχεις διασκεδαστικές αποστολές να ολοκληρώσεις.',
    color: '#FFE066',
    icon: 'game-controller',
  },
  {
    id: 2,
    emoji: '✨',
    title: 'Οι Αποστολές σου',
    description: 'Κάθε αποστολή είναι μια καλή συνήθεια! Βούρτσισε τα δόντια σου, τακτοποίησε το δωμάτιό σου, διάβασε ένα βιβλίο... Κάθε φορά που τα κάνεις, κερδίζεις πόντους!',
    color: '#7DD3FC',
    icon: 'checkbox',
    examples: [
      { emoji: '🦷', text: 'Βούρτσισμα δοντιών' },
      { emoji: '📚', text: 'Διάβασμα' },
      { emoji: '🛏️', text: 'Στρώσιμο κρεβατιού' },
    ],
  },
  {
    id: 3,
    emoji: '🌈',
    title: 'Παρακολούθησε την Πρόοδο!',
    description: 'Η μπάρα προόδου αλλάζει χρώματα καθώς ολοκληρώνεις αποστολές! Ξεκινά γκρι και γίνεται ουράνιο τόξο όταν τα καταφέρεις όλα!',
    color: '#A78BFA',
    icon: 'trending-up',
    highlight: '🔴 🟠 🟡 🟢 🔵 🟣',
  },
  {
    id: 4,
    emoji: '⭐',
    title: 'Κέρδισε Πόντους & Ανέβα Επίπεδο!',
    description: 'Κάθε φορά που ολοκληρώνεις μια αποστολή, κερδίζεις αστέρια! Μάζεψε αρκετά και θα ανεβείς επίπεδο - μπορείς να φτάσεις μέχρι το επίπεδο 15!',
    color: '#FCD34D',
    icon: 'star',
    highlight: 'Επίπεδο 1 → 15 🚀',
  },
  {
    id: 5,
    emoji: '🎁',
    title: 'Πάρε Δώρα με τους Πόντους!',
    description: 'Με τους πόντους που μαζεύεις μπορείς να αγοράσεις υπέροχα δώρα! Και θα δεις ένα αστείο μήνυμα όταν έχεις αρκετούς πόντους για κάτι!',
    color: '#F472B6',
    icon: 'gift',
    examples: [
      { emoji: '🍦', text: 'Παγωτό - 30 πόντοι' },
      { emoji: '🎬', text: 'Βραδιά σινεμά - 50 πόντοι' },
      { emoji: '🎡', text: 'Λούνα παρκ - 150 πόντοι' },
    ],
  },
  {
    id: 6,
    emoji: '⏰',
    title: 'Περίμενε Λίγο Μεταξύ Προσπαθειών!',
    description: 'Μερικές αποστολές έχουν χρόνο αναμονής. Αν δεν πέρασε αρκετή ώρα, η κάρτα θα είναι γκρι και θα σου πει πότε μπορείς να ξαναδοκιμάσεις!',
    color: '#60A5FA',
    icon: 'time',
    tip: '💡 Η υπομονή είναι δύναμη!',
  },
  {
    id: 7,
    emoji: '📬',
    title: 'Μηνύματα από τους Γονείς!',
    description: 'Κάθε φορά που οι γονείς σου εγκρίνουν μια αποστολή ή σου στέλνουν ενθάρρυνση, θα δεις ένα φάκελο με το μήνυμά τους! Πάτα τον να δεις τι λένε!',
    color: '#34D399',
    icon: 'mail',
    tip: '✉️ Κοίτα για το animated φάκελο!',
  },
  {
    id: 8,
    emoji: '🆘',
    title: 'Ζήτα Βοήθεια Όποτε Θέλεις!',
    description: 'Δεν είσαι μόνος σου! Αν χρειαστείς βοήθεια με κάποια αποστολή, πάτα το κουμπί "Βοήθεια" και οι γονείς σου θα έρθουν να σε βοηθήσουν!',
    color: '#FB923C',
    icon: 'help-circle',
    tip: '💪 Οι γονείς σου πιστεύουν σε σένα!',
  },
  {
    id: 9,
    emoji: '🔜',
    title: 'Περισσότερα Έρχονται!',
    description: 'Σύντομα θα έχουμε ακόμα περισσότερα! Ειδοποιήσεις, νέα badges, streaks και πολλές εκπλήξεις! Μείνε συντονισμένος!',
    color: '#8B5CF6',
    icon: 'sparkles',
  },
  {
    id: 10,
    emoji: '🚀',
    title: 'Είσαι Έτοιμος!',
    description: 'Τώρα ξέρεις τα πάντα! Ήρθε η ώρα να ξεκινήσεις τις αποστολές σου, να μαζέψεις πόντους και να πάρεις φανταστικά δώρα! Πάμε!',
    color: '#22C55E',
    icon: 'rocket',
    cta: true,
  },
];

export default function ChildIntroduction() {
  const router = useRouter();
  const { childId, name } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<ScrollView>(null);
  
  // Animation values
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Bounce animation for emojis
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
    if (currentSlide < INTRO_SLIDES.length - 1) {
      slideRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = async () => {
    await markIntroSeen();
    router.replace('/child/(tabs)');
  };

  const handleStart = async () => {
    await markIntroSeen();
    router.replace('/child/(tabs)');
  };

  const markIntroSeen = async () => {
    if (childId) {
      await AsyncStorage.setItem(`child_intro_seen_${childId}`, 'true');
    }
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

  const renderSlide = (slide: typeof INTRO_SLIDES[0], index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
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
        style={[
          styles.slide,
          { transform: [{ scale }], opacity },
        ]}
      >
        <View style={[styles.slideContent, { backgroundColor: slide.color + '20' }]}>
          {/* Animated Emoji */}
          <Animated.Text
            style={[
              styles.slideEmoji,
              {
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {slide.emoji}
          </Animated.Text>

          {/* Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: slide.color }]}>
            <Ionicons name={slide.icon as any} size={24} color={COLORS.white} />
          </View>

          {/* Title */}
          <Text style={styles.slideTitle}>{slide.title}</Text>

          {/* Description */}
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {/* Examples if any */}
          {slide.examples && (
            <View style={styles.examplesContainer}>
              {slide.examples.map((example, idx) => (
                <View key={idx} style={styles.exampleItem}>
                  <Text style={styles.exampleEmoji}>{example.emoji}</Text>
                  <Text style={styles.exampleText}>{example.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Features with descriptions */}
          {slide.features && (
            <View style={styles.featuresContainer}>
              {slide.features.map((feature: any, idx) => (
                <View key={idx} style={[styles.featureItem, { borderColor: slide.color }]}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureText}>{feature.text}</Text>
                    {feature.description && (
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Highlight */}
          {slide.highlight && (
            <View style={styles.highlightContainer}>
              <Text style={styles.highlightText}>{slide.highlight}</Text>
            </View>
          )}

          {/* Badges */}
          {slide.badges && (
            <View style={styles.badgesContainer}>
              {slide.badges.map((badge, idx) => (
                <Animated.Text
                  key={idx}
                  style={[
                    styles.badgeEmoji,
                    {
                      transform: [
                        {
                          scale: bounceAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {badge}
                </Animated.Text>
              ))}
            </View>
          )}

          {/* Tip */}
          {slide.tip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>{slide.tip}</Text>
            </View>
          )}

          {/* CTA Button on last slide */}
          {slide.cta && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Ας Ξεκινήσουμε!</Text>
              <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Skip */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Γεια σου, {name}! 👋</Text>
        </View>
        {currentSlide < INTRO_SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Παράλειψη</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={slideRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {INTRO_SLIDES.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {INTRO_SLIDES.map((_, index) => {
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
                  backgroundColor: INTRO_SLIDES[currentSlide].color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Next Button (not on last slide) */}
      {currentSlide < INTRO_SLIDES.length - 1 && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: INTRO_SLIDES[currentSlide].color }]}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {},
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
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
    padding: 24,
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  examplesContainer: {
    width: '100%',
    gap: 8,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  exampleEmoji: {
    fontSize: 24,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  highlightContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  highlightText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.brightYellow,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  tipContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
