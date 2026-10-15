import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { authAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function Welcome() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const setParentAuth = useAuthStore((state) => state.setParentAuth);
  const setFamilyInfo = useAuthStore((state) => state.setFamilyInfo);

  // Handle session_id from URL (after OAuth redirect)
  useEffect(() => {
    const handleRedirect = async () => {
      let sessionId: string | null = null;
      
      if (Platform.OS === 'web') {
        const hash = window.location.hash;
        if (hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0];
        }
        const query = window.location.search;
        if (query.includes('session_id=')) {
          sessionId = new URLSearchParams(query).get('session_id');
        }
      }

      if (sessionId) {
        await processSessionId(sessionId);
      }
    };

    handleRedirect();
  }, []);

  const processSessionId = async (sessionId: string) => {
    setProcessingAuth(true);
    try {
      console.log('Processing session ID:', sessionId);
      const result = await authAPI.exchangeSession(sessionId);
      console.log('Exchange session result:', JSON.stringify(result));
      
      if (result.needs_pin_setup) {
        // New user - need to set up PIN
        console.log('New user - redirecting to setup-pin');
        router.replace({
          pathname: '/auth/setup-pin',
          params: {
            tempSessionId: sessionId,
            email: result.email,
            name: result.name,
            picture: result.picture || '',
          },
        });
      } else if (result.needs_pin_verification) {
        // Existing user returning - need PIN verification
        console.log('Existing user - redirecting to verify-pin');
        router.replace({
          pathname: '/auth/verify-pin',
          params: {
            userId: result.user_id,
            email: result.email,
            name: result.name,
            picture: result.picture || '',
            tempSessionToken: result.temp_session_token,
            childrenJson: JSON.stringify(result.children || []),
          },
        });
      } else {
        // Direct login (shouldn't happen normally, but handle it)
        console.log('Direct login - going to dashboard');
        setFamilyInfo({
          parentId: result.user_id,
          parentName: result.name,
          children: result.children || [],
        });
        setParentAuth({
          userId: result.user_id,
          name: result.name,
          email: result.email,
          picture: result.picture,
          sessionToken: result.session_token,
        });
        router.replace('/parent/(tabs)');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setProcessingAuth(false);
      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // For native apps, use the web-based OAuth callback endpoint
      // This redirects through the server which then redirects to the app
      const redirectUrl = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? window.location.origin + '/auth/welcome' : `${BACKEND_URL}/auth/welcome`)
        : `${BACKEND_URL}/api/oauth-callback`;

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, Linking.createURL('/auth/google-callback'));
        
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          let sessionId = url.hash.includes('session_id=')
            ? url.hash.split('session_id=')[1]?.split('&')[0]
            : url.searchParams.get('session_id');
          
          if (sessionId) {
            await processSessionId(sessionId);
          } else {
            // If no session_id in redirect, show error
            Alert.alert('Σφάλμα', 'Δεν ολοκληρώθηκε η σύνδεση. Παρακαλώ δοκιμάστε ξανά.');
          }
        } else if (result.type === 'cancel') {
          // User cancelled - do nothing
        } else {
          Alert.alert('Σφάλμα', 'Η σύνδεση ακυρώθηκε ή απέτυχε.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με Google');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkRequest = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email');
      return;
    }

    setMagicLinkLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMagicLinkSent(true);
      } else {
        Alert.alert('Σφάλμα', data.detail || 'Αποτυχία αποστολής email');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποστολής magic link');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (processingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
          <Text style={styles.loadingText}>Επεξεργασία σύνδεσης...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Magic Link Sent Success Screen
  if (magicLinkSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>📧</Text>
            <Text style={styles.successTitle}>Ελέγξτε το email σας!</Text>
            <Text style={styles.successText}>
              Στείλαμε ένα σύνδεσμο σύνδεσης στο{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Πατήστε τον σύνδεσμο στο email για να συνδεθείτε.
              {'\n'}Ο σύνδεσμος λήγει σε 15 λεπτά.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setMagicLinkSent(false);
                setShowMagicLink(false);
                setEmail('');
              }}
            >
              <Text style={styles.backButtonText}>← Επιστροφή</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Magic Link Input Screen
  if (showMagicLink) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>✉️</Text>
              <Text style={styles.title}>Magic Link</Text>
              <Text style={styles.subtitle}>Σύνδεση με Email</Text>
            </View>

            <View style={styles.magicLinkForm}>
              <Text style={styles.formLabel}>
                Εισάγετε το email σας και θα σας στείλουμε έναν σύνδεσμο σύνδεσης.
              </Text>
              
              <TextInput
                style={styles.emailInput}
                placeholder="email@example.com"
                placeholderTextColor={COLORS.mediumGray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />

              <TouchableOpacity
                style={[styles.magicLinkButton, magicLinkLoading && styles.buttonDisabled]}
                onPress={handleMagicLinkRequest}
                disabled={magicLinkLoading}
              >
                {magicLinkLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={COLORS.white} />
                    <Text style={styles.magicLinkButtonText}>Αποστολή Συνδέσμου</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchMethodButton}
                onPress={() => setShowMagicLink(false)}
              >
                <Text style={styles.switchMethodText}>← Άλλες μέθοδοι σύνδεσης</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main Welcome Screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏆</Text>
          <Text style={styles.title}>Habit Hero</Text>
          <Text style={styles.subtitle}>Ήρωας Συνηθειών</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.welcomeTitle}>Καλωσήρθατε!</Text>
          <Text style={styles.welcomeText}>
            Για να ξεκινήσετε, ο γονέας πρέπει πρώτα να εγγραφεί.
          </Text>
          <Text style={styles.welcomeText}>
            Επιλέξτε έναν τρόπο σύνδεσης παρακάτω.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.darkGray} />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>Συνέχεια με Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.magicLinkOption}
          onPress={() => setShowMagicLink(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={24} color={COLORS.softBlue} />
          <Text style={styles.magicLinkOptionText}>Συνέχεια με Email</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.softGreen} />
            <Text style={styles.featureText}>Παρακολούθηση συνηθειών</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trophy" size={20} color={COLORS.brightYellow} />
            <Text style={styles.featureText}>Πόντοι & Εμβλήματα</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="people" size={20} color={COLORS.softBlue} />
            <Text style={styles.featureText}>Για όλη την οικογένεια</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Για παιδιά και γονείς στην Ελλάδα 🇬🇷
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.softBlue,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 22,
    marginBottom: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  magicLinkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  magicLinkOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  magicLinkForm: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  formLabel: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  magicLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  magicLinkButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchMethodButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchMethodText: {
    fontSize: 15,
    color: COLORS.softBlue,
  },
  successContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailHighlight: {
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  successHint: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  features: {
    marginTop: 32,
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  footer: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});
