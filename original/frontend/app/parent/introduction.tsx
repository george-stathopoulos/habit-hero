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
    emoji: '👋',
    title: 'Καλώς ήρθατε στο Habit Hero!',
    description: 'Η εφαρμογή που βοηθά τα παιδιά σας να αναπτύξουν θετικές συνήθειες μέσα από το παιχνίδι. Εσείς είστε ο οδηγός τους σε αυτό το ταξίδι!',
    color: '#7DD3FC',
    icon: 'home',
  },
  {
    id: 2,
    emoji: '📋',
    title: 'Ορίστε Συνήθειες',
    description: 'Επιλέξτε από έτοιμες συνήθειες ή δημιουργήστε δικές σας. Κάθε συνήθεια έχει πόντους που κερδίζει το παιδί όταν την ολοκληρώνει.',
    color: '#86EFAC',
    icon: 'list',
    examples: [
      { emoji: '🦷', text: 'Βούρτσισμα δοντιών - 10 πόντοι' },
      { emoji: '📚', text: 'Διάβασμα - 20 πόντοι' },
      { emoji: '🛏️', text: 'Στρώσιμο κρεβατιού - 10 πόντοι' },
    ],
  },
  {
    id: 3,
    emoji: '👦👧',
    title: 'Προσθέστε τα Παιδιά σας',
    description: 'Κάθε παιδί έχει το δικό του PIN για να συνδέεται. Μπορείτε να προσαρμόσετε τις συνήθειες ανά παιδί με βάση την ηλικία του.',
    color: '#FCD34D',
    icon: 'people',
    tip: '💡 Χρησιμοποιήστε απλά PIN που τα παιδιά θυμούνται εύκολα',
  },
  {
    id: 4,
    emoji: '🎁',
    title: 'Δημιουργήστε Ανταμοιβές!',
    description: 'Ορίστε έπαθλα που τα παιδιά μπορούν να εξαργυρώσουν με τους πόντους τους. Βραδιά σινεμά, παγωτό, παιχνίδι στο πάρκο - ό,τι τους αρέσει!',
    color: '#A78BFA',
    icon: 'gift',
    features: [
      { icon: 'repeat', text: 'Επαναλαμβανόμενα', description: 'Μπορούν να τα πάρουν πολλές φορές' },
      { icon: 'flash', text: 'Μοναδικά', description: 'Μία φορά μόνο (πιο ακριβά)' },
    ],
  },
  {
    id: 5,
    emoji: '💰',
    title: 'Συμβουλές για Ανταμοιβές',
    description: 'Οι επαναλαμβανόμενες ανταμοιβές είναι για καθημερινές χαρές (20-50 πόντοι). Οι μοναδικές για μεγάλους στόχους (100+ πόντοι).',
    color: '#F472B6',
    icon: 'bulb',
    examples: [
      { emoji: '🍦', text: 'Παγωτό - 30 πόντοι (Επαναλαμβανόμενο)' },
      { emoji: '🎬', text: 'Βραδιά σινεμά - 50 πόντοι' },
      { emoji: '🎡', text: 'Λούνα παρκ - 150 πόντοι (Μοναδικό)' },
    ],
    tip: '💡 Τα μοναδικά έπαθλα δίνουν κίνητρο για μακροπρόθεσμους στόχους!',
  },
  {
    id: 6,
    emoji: '✅',
    title: 'Εγκρίνετε & Επιβραβεύστε',
    description: 'Όταν το παιδί ολοκληρώνει μια συνήθεια, μπορείτε να την εγκρίνετε. Για ορισμένες συνήθειες η έγκριση είναι αυτόματη!',
    color: '#34D399',
    icon: 'checkmark-circle',
    features: [
      { icon: 'checkmark-done', text: 'Αυτόματη έγκριση' },
      { icon: 'hand-right', text: 'Χειροκίνητη επιβεβαίωση' },
    ],
  },
  {
    id: 7,
    emoji: '🆘',
    title: 'Βοηθήστε Όταν Χρειάζεται',
    description: 'Αν το παιδί δυσκολεύεται με μια συνήθεια, μπορεί να ζητήσει βοήθεια. Θα λάβετε ειδοποίηση και συμβουλές για το πώς να βοηθήσετε!',
    color: '#60A5FA',
    icon: 'hand-left',
    tip: '💡 Οι συμβουλές είναι προσαρμοσμένες σε κάθε συνήθεια',
  },
  {
    id: 8,
    emoji: '📊',
    title: 'Παρακολουθήστε την Πρόοδο',
    description: 'Δείτε στατιστικά για κάθε παιδί: ποιες συνήθειες κάνει, πώς ξοδεύει τους πόντους του, και πόσο έχει βελτιωθεί με τον καιρό.',
    color: '#FB923C',
    icon: 'analytics',
  },
  {
    id: 9,
    emoji: '🚀',
    title: 'Είστε Έτοιμοι!',
    description: 'Ήρθε η ώρα να ξεκινήσετε! Προσθέστε το πρώτο σας παιδί, ορίστε συνήθειες και δημιουργήστε έπαθλα που θα τα κινητοποιήσουν!',
    color: '#34D399',
    icon: 'rocket',
    cta: true,
  },
];

export default function ParentIntroduction() {
  const router = useRouter();
  const { userId, name } = useAuthStore();
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

    // Subtle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
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
    // If user is already logged in, go back to dashboard, otherwise to role-select
    if (userId) {
      router.replace('/parent/(tabs)');
    } else {
      router.replace('/auth/role-select');
    }
  };

  const handleStart = async () => {
    await markIntroSeen();
    // If user is already logged in, go back to dashboard, otherwise to role-select
    if (userId) {
      router.replace('/parent/(tabs)');
    } else {
      router.replace('/auth/role-select');
    }
  };

  const markIntroSeen = async () => {
    if (userId) {
      await AsyncStorage.setItem(`parent_intro_seen_${userId}`, 'true');
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
        style={[
          styles.slide,
          { transform: [{ scale }], opacity },
        ]}
      >
        <View style={[styles.slideContent, { backgroundColor: slide.color + '15' }]}>
          {/* Animated Emoji */}
          <Animated.Text
            style={[
              styles.slideEmoji,
              {
                transform: [
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
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
                  <Ionicons name={feature.icon as any} size={20} color={slide.color} />
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

          {/* Tip */}
          {slide.tip && (
            <View style={[styles.tipContainer, { borderLeftColor: slide.color }]}>
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
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.welcomeText}>Γεια σας{name ? `, ${name}` : ''}!</Text>
        {currentSlide < INTRO_SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Παράλειψη</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
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
  backButton: {
    padding: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    flex: 1,
    textAlign: 'center',
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
    fontSize: 56,
    marginBottom: 12,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
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
    fontSize: 20,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.darkGray,
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
    borderWidth: 1,
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
  tipContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 20,
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
    paddingVertical: 16,
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
