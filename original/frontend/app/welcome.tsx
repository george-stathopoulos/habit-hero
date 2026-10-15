import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../src/store/authStore';
import { PinInput } from '../src/components/PinInput';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

const WELCOME_SLIDES = [
  {
    id: 1,
    emoji: '🏆',
    title: 'Καλώς ήρθατε στο Habit Hero!',
    description: 'Η εφαρμογή που μετατρέπει τις καθημερινές συνήθειες σε συναρπαστικές περιπέτειες για όλη την οικογένεια!',
    color: '#4A90E2',
  },
  {
    id: 2,
    emoji: '📋',
    title: 'Ευέλικτες Συνήθειες',
    description: 'Δημιουργήστε συνήθειες με πολλαπλές κατηγορίες, custom tips και οδηγίες για τα παιδιά. Αναθέστε τες εύκολα σε ένα ή περισσότερα παιδιά!',
    color: '#7ED321',
  },
  {
    id: 3,
    emoji: '✅',
    title: 'Έγκριση & Ενθάρρυνση',
    description: 'Εγκρίνετε, απορρίψτε ή ενθαρρύνετε τα παιδιά να δοκιμάσουν ξανά! Ορίστε χρονικά διαστήματα μεταξύ προσπαθειών για όλες τις συνήθειες.',
    color: '#F5A623',
  },
  {
    id: 4,
    emoji: '⏰',
    title: 'Αναβολή "Αργότερα"',
    description: 'Τα παιδιά μπορούν να αναβάλουν μια δραστηριότητα και να λάβουν υπενθύμιση σε 30 λεπτά! Βλέπετε πόσες φορές αναβάλλουν στα στατιστικά.',
    color: '#FF9800',
  },
  {
    id: 5,
    emoji: '💝',
    title: 'Πόντοι Αγάπης',
    description: 'Στείλτε δωρεάν πόντους στα παιδιά σας με ένα προσωπικό μήνυμα! Επιλέξτε καρδιά 💝, δώρο 🎁 ή φιλί 💋 και δείξτε τους την αγάπη σας!',
    color: '#E91E63',
  },
  {
    id: 6,
    emoji: '⭐',
    title: 'Πόντοι & Επίπεδα',
    description: 'Τα παιδιά κερδίζουν πόντους και ανεβαίνουν επίπεδο! Με 10+ επίπεδα μέχρι 10.000 πόντους, η πρόοδος δεν σταματά ποτέ!',
    color: '#9B59B6',
  },
  {
    id: 7,
    emoji: '🎁',
    title: 'Έπαθλα & Ιστορικό',
    description: 'Δημιουργήστε έπαθλα (επαναλαμβανόμενα ή μοναδικά) και παρακολουθήστε όλες τις εξαργυρώσεις και εγκρίσεις στο ιστορικό!',
    color: '#E74C3C',
  },
  {
    id: 8,
    emoji: '📬',
    title: 'Ειδοποιήσεις & Μηνύματα',
    description: 'Κάθε ενέργειά σας στέλνει animated μήνυμα στο παιδί! Έγκριση ✅, απόρριψη ❌, ενθάρρυνση 💪, πόντοι αγάπης 💝 - όλα με εικονίδια!',
    color: '#1ABC9C',
  },
  {
    id: 9,
    emoji: '📊',
    title: 'Στατιστικά & Insights',
    description: 'Δείτε πόσες φορές τα παιδιά ζητούν βοήθεια, αναβάλλουν ή ολοκληρώνουν συνήθειες. Λάβετε υπενθυμίσεις αν δεν στείλετε αγάπη για 7 μέρες!',
    color: '#8E44AD',
  },
  {
    id: 10,
    emoji: '🚀',
    title: 'Ας Ξεκινήσουμε!',
    description: 'Συνδεθείτε με το Google για να δημιουργήσετε τον λογαριασμό της οικογένειάς σας και να ξεκινήσετε την περιπέτεια!',
    color: '#4A90E2',
    cta: true,
  },
];

export default function Welcome() {
  const router = useRouter();
  const { setParentAuth, setFamilyInfo } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef<any>(null);
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  // Modal states
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'pin'>('email');
  const [foundParent, setFoundParent] = useState<any>(null);

  useEffect(() => {
    // Animations
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
    if (currentSlide < WELCOME_SLIDES.length - 1) {
      slideRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('welcome_seen', 'true');
    // This shouldn't be called anymore, Google login is the way to proceed
  };

  const handleGoogleLogin = async () => {
    // Mark welcome as seen since user is taking action
    await AsyncStorage.setItem('welcome_seen', 'true');
    
    // For native apps, use the web-based OAuth callback endpoint
    // This redirects through the server which then redirects to the app
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    const redirectUrl = Platform.OS === 'web'
      ? `${window.location.origin}/auth/google-callback`
      : `${BACKEND_URL}/api/oauth-callback`;

    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, Linking.createURL('/auth/google-callback'));
      if (result.type === 'success' && result.url) {
        // Extract session_id and navigate to callback
        const url = new URL(result.url);
        const sessionId = url.searchParams.get('session_id') || url.hash.split('session_id=')[1]?.split('&')[0];
        if (sessionId) {
          router.replace(`/auth/google-callback?session_id=${sessionId}`);
        } else {
          Alert.alert('Σφάλμα', 'Δεν ολοκληρώθηκε η σύνδεση. Παρακαλώ δοκιμάστε ξανά.');
        }
      } else if (result.type === 'cancel') {
        // User cancelled - do nothing
      }
    }
  };

  const handleSkip = async () => {
    // Skip to last slide where Google login is
    slideRef.current?.scrollTo({
      x: (WELCOME_SLIDES.length - 1) * width,
      animated: true,
    });
    setCurrentSlide(WELCOME_SLIDES.length - 1);
  };

  // Email signup (magic link)
  const handleEmailSignup = async () => {
    const emailToUse = email.trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε έγκυρο email');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMagicLinkSent(true);
      } else {
        Alert.alert('Σφάλμα', data.detail || 'Αποτυχία αποστολής email');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με τον server');
    } finally {
      setLoading(false);
    }
  };

  // Email lookup for existing account
  const handleEmailLookup = async () => {
    const emailToLookup = loginEmail.trim().toLowerCase();
    if (!emailToLookup || !emailToLookup.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε έγκυρο email');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/lookup-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToLookup }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.found) {
        setFoundParent(data);
        setLoginStep('pin');
      } else {
        Alert.alert('Δεν βρέθηκε', 'Δεν υπάρχει λογαριασμός με αυτό το email. Δοκιμάστε να εγγραφείτε.');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με τον server');
    } finally {
      setLoading(false);
    }
  };

  // PIN login for existing account
  const handlePinLogin = async () => {
    if (loginPin.length !== 4) {
      Alert.alert('Σφάλμα', 'Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/parent-pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: foundParent.user_id, pin: loginPin }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('welcome_seen', 'true');
        
        setParentAuth({
          userId: data.user_id,
          name: data.name,
          email: data.email,
          picture: data.picture,
          sessionToken: data.session_token,
        });
        
        setFamilyInfo({
          parentId: data.user_id,
          parentName: data.name,
          parentEmail: data.email,
          parentPicture: data.picture,
          children: foundParent.children || [],
        });
        
        setShowEmailLogin(false);
        router.replace('/parent/(tabs)');
      } else {
        Alert.alert('Λάθος PIN', data.detail || 'Το PIN δεν είναι σωστό');
        setLoginPin('');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης');
    } finally {
      setLoading(false);
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

  const renderSlide = (slide: typeof WELCOME_SLIDES[0], index: number) => {
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

          <View style={[styles.iconBadge, { backgroundColor: slide.color }]}>
            <Ionicons
              name={
                index === 0 ? 'home' :
                index === 1 ? 'people' :
                index === 2 ? 'star' :
                index === 3 ? 'game-controller' : 'rocket'
              }
              size={24}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {slide.cta && (
            <View style={styles.ctaContainer}>
              <TouchableOpacity style={styles.startButton} onPress={handleGoogleLogin}>
                <Ionicons name="logo-google" size={24} color={COLORS.white} />
                <Text style={styles.startButtonText}>Σύνδεση με Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emailSignupButton} 
                onPress={() => setShowEmailSignup(true)}
              >
                <Ionicons name="mail-outline" size={24} color={slide.color} />
                <Text style={[styles.emailSignupText, { color: slide.color }]}>Εγγραφή με Email</Text>
              </TouchableOpacity>
              
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ή</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.existingAccountButton} 
                onPress={() => setShowEmailLogin(true)}
              >
                <Text style={styles.existingAccountText}>Έχω ήδη λογαριασμό</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {currentSlide < WELCOME_SLIDES.length - 1 && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Παράλειψη</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slides */}
      <Animated.ScrollView
        ref={slideRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {WELCOME_SLIDES.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        {WELCOME_SLIDES.map((_, index) => {
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
                  backgroundColor: WELCOME_SLIDES[currentSlide].color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Next button */}
      {currentSlide < WELCOME_SLIDES.length - 1 && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: WELCOME_SLIDES[currentSlide].color }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Επόμενο</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
      
      {/* Email Signup Modal */}
      <Modal visible={showEmailSignup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowEmailSignup(false);
                  setMagicLinkSent(false);
                  setEmail('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
              
              {!magicLinkSent ? (
                <>
                  <Text style={styles.modalEmoji}>📧</Text>
                  <Text style={styles.modalTitle}>Εγγραφή με Email</Text>
                  <Text style={styles.modalSubtitle}>
                    Θα σας στείλουμε έναν σύνδεσμο για να ολοκληρώσετε την εγγραφή
                  </Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <TouchableOpacity
                    style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                    onPress={handleEmailSignup}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.modalButtonText}>Αποστολή συνδέσμου</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalEmoji}>✅</Text>
                  <Text style={styles.modalTitle}>Έλεγξτε το email σας!</Text>
                  <Text style={styles.modalSubtitle}>
                    Στείλαμε έναν σύνδεσμο στο {email}. Κάντε κλικ για να συνεχίσετε.
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowEmailSignup(false);
                      setMagicLinkSent(false);
                      setEmail('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Κλείσιμο</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Email + PIN Login Modal */}
      <Modal visible={showEmailLogin} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowEmailLogin(false);
                  setLoginStep('email');
                  setLoginEmail('');
                  setLoginPin('');
                  setFoundParent(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
              
              {loginStep === 'email' ? (
                <>
                  <Text style={styles.modalEmoji}>👤</Text>
                  <Text style={styles.modalTitle}>Σύνδεση</Text>
                  <Text style={styles.modalSubtitle}>
                    Εισάγετε το email του λογαριασμού σας
                  </Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="email@example.com"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <TouchableOpacity
                    style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                    onPress={handleEmailLookup}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.modalButtonText}>Συνέχεια</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalEmoji}>🔐</Text>
                  <Text style={styles.modalTitle}>Καλώς ήρθατε!</Text>
                  <Text style={styles.modalSubtitle}>{foundParent?.name}</Text>
                  
                  <PinInput
                    value={loginPin}
                    onChange={setLoginPin}
                    label="Εισάγετε το 4-ψήφιο PIN σας"
                  />
                  
                  <TouchableOpacity
                    style={[styles.modalButton, (loading || loginPin.length !== 4) && styles.modalButtonDisabled]}
                    onPress={handlePinLogin}
                    disabled={loading || loginPin.length !== 4}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.modalButtonText}>Σύνδεση</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => {
                      setLoginStep('email');
                      setLoginPin('');
                    }}
                  >
                    <Text style={styles.modalBackText}>← Αλλαγή email</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    fontSize: 80,
    marginBottom: 16,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    gap: 12,
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
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emailSignupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    width: '100%',
  },
  emailSignupText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  existingAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  existingAccountText: {
    fontSize: 15,
    color: COLORS.mediumGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalPinInput: {
    width: 160,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 16,
    marginBottom: 16,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  modalBackText: {
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  pinLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
});
