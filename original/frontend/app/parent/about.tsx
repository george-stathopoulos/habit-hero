import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

const { height } = Dimensions.get('window');

export default function AboutScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef(0);

  // Floating hearts animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Auto-scroll effect - 30% faster, stoppable by user interaction
  useEffect(() => {
    const scrollSpeed = 0.65; // 30% faster than 0.5
    
    const autoScroll = () => {
      if (autoScrollEnabled) {
        scrollPositionRef.current += scrollSpeed;
        scrollViewRef.current?.scrollTo({
          y: scrollPositionRef.current,
          animated: false,
        });
      }
    };

    // Start auto-scroll after a short delay
    const startDelay = setTimeout(() => {
      intervalRef.current = setInterval(autoScroll, 16); // ~60fps
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoScrollEnabled]);

  // Handle user scroll - disable auto-scroll when user interacts
  const handleScrollBeginDrag = () => {
    setAutoScrollEnabled(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Update scroll position when user scrolls manually
  const handleScroll = (event: any) => {
    if (!autoScrollEnabled) {
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
    }
  };

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const floatTranslate2 = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Η Ιστορία μας</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Floating decorative elements */}
      <Animated.View style={[styles.floatingHeart, styles.heart1, { transform: [{ translateY: floatTranslate }] }]}>
        <Text style={styles.floatingEmoji}>💕</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingHeart, styles.heart2, { transform: [{ translateY: floatTranslate2 }] }]}>
        <Text style={styles.floatingEmoji}>✨</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingHeart, styles.heart3, { transform: [{ translateY: floatTranslate }] }]}>
        <Text style={styles.floatingEmoji}>🌟</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingHeart, styles.heart4, { transform: [{ translateY: floatTranslate2 }] }]}>
        <Text style={styles.floatingEmoji}>💖</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingHeart, styles.heart5, { transform: [{ translateY: floatTranslate }] }]}>
        <Text style={styles.floatingEmoji}>🦸‍♀️</Text>
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={handleScroll}
      >
        {/* Spacer at top */}
        <View style={styles.topSpacer} />

        {/* App Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.appEmoji}>🦸‍♂️</Text>
          <Text style={styles.appName}>Habit Hero</Text>
          <Text style={styles.heartsDecor}>💝 💖 💗 💓 💕</Text>
        </View>

        {/* The Story - One continuous flowing text */}
        <View style={styles.storyContainer}>
          <Text style={styles.storyText}>
            Η ιδέα για αυτό το application ξεκίνησε από κάτι πολύ απλό και πολύ αληθινό:
          </Text>
          
          <Text style={styles.storyTextHighlight}>
            την κόρη μου. 👧💕
          </Text>
          
          <Text style={styles.storyText}>
            Είναι κακομαθημένη. 🙈
          </Text>
          
          <Text style={styles.storyText}>
            Όχι επειδή φταίει εκείνη, αλλά επειδή την αγαπώ πολύ. ❤️
          </Text>
          
          <Text style={styles.storyTextItalic}>
            Και όταν αγαπάς πολύ… κακομαθαίνεις λίγο. 🤷‍♀️
          </Text>

          <View style={styles.divider}>
            <Text style={styles.dividerEmoji}>✨ ✨ ✨</Text>
          </View>
          
          <Text style={styles.storyText}>
            Κάπου εκεί κατάλαβα πόσο σημαντικό είναι τα παιδιά να έχουν από νωρίς μικρές σταθερές, 🏠
          </Text>
          
          <Text style={styles.storyText}>
            μια απλή δομή στην καθημερινότητά τους 📋
          </Text>
          
          <Text style={styles.storyText}>
            και καλές συνήθειες που τα βοηθούν να μεγαλώνουν πιο ήρεμα και πιο ανεξάρτητα. 🌱
          </Text>

          <View style={styles.divider}>
            <Text style={styles.dividerEmoji}>💫 💫 💫</Text>
          </View>
          
          <Text style={styles.storyText}>
            Έτσι γεννήθηκε η ιδέα για ένα application που βοηθά γονείς και παιδιά να χτίζουν καλές συνήθειες 🏗️
          </Text>
          
          <Text style={styles.storyTextHighlight}>
            με τρόπο ευχάριστο και παιχνιδιάρικο. 🎮🎪
          </Text>
          
          <Text style={styles.storyText}>
            Χωρίς φωνές, χωρίς πίεση. 🤫
          </Text>
          
          <Text style={styles.storyText}>
            Με μικρούς στόχους, 🎯
          </Text>
          
          <Text style={styles.storyText}>
            χαμόγελα, 😊
          </Text>
          
          <Text style={styles.storyText}>
            επιβράβευση 🏆
          </Text>
          
          <Text style={styles.storyText}>
            και λίγο παιχνίδι στην καθημερινότητα. 🎈
          </Text>

          <View style={styles.divider}>
            <Text style={styles.dividerEmoji}>💝 💝 💝</Text>
          </View>

          <Text style={styles.storyTextFinal}>
            Για την κόρη μου.
          </Text>
          
          <Text style={styles.storyTextFinal}>
            Και για κάθε παιδί. 👧👦
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.heartsRow}>💝 💖 💗 💓 💕 💞 💘</Text>
          <Text style={styles.madeWith}>Φτιαγμένο με αγάπη 🇬🇷</Text>
          <Text style={styles.version}>v1.0.0</Text>
          
          {/* Privacy Policy Link */}
          <TouchableOpacity 
            style={styles.privacyLink}
            onPress={() => router.push('/parent/privacy-policy')}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.softBlue} />
            <Text style={styles.privacyLinkText}>Πολιτική Απορρήτου</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacer for scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  placeholder: {
    width: 40,
  },
  floatingHeart: {
    position: 'absolute',
    zIndex: 10,
  },
  heart1: {
    top: 120,
    right: 25,
  },
  heart2: {
    top: 250,
    left: 20,
  },
  heart3: {
    top: 400,
    right: 35,
  },
  heart4: {
    top: 550,
    left: 30,
  },
  heart5: {
    top: 700,
    right: 20,
  },
  floatingEmoji: {
    fontSize: 28,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
  },
  topSpacer: {
    height: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.softBlue,
    marginBottom: 16,
  },
  heartsDecor: {
    fontSize: 20,
    letterSpacing: 4,
  },
  storyContainer: {
    alignItems: 'center',
  },
  storyText: {
    fontSize: 24,
    lineHeight: 40,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '400',
  },
  storyTextHighlight: {
    fontSize: 26,
    lineHeight: 42,
    color: '#DB7093',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
  },
  storyTextItalic: {
    fontSize: 24,
    lineHeight: 40,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 28,
    fontStyle: 'italic',
  },
  storyTextFinal: {
    fontSize: 28,
    lineHeight: 44,
    color: '#C71585',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  divider: {
    marginVertical: 40,
  },
  dividerEmoji: {
    fontSize: 24,
    letterSpacing: 8,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    marginTop: 60,
    paddingVertical: 40,
  },
  heartsRow: {
    fontSize: 24,
    letterSpacing: 4,
    marginBottom: 24,
  },
  madeWith: {
    fontSize: 18,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: COLORS.mediumGray,
    opacity: 0.6,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    gap: 6,
  },
  privacyLinkText: {
    fontSize: 14,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: height * 0.3,
  },
});
