import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { authAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { PinInput } from '../../src/components/PinInput';
import { Button } from '../../src/components/Button';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type Step = 'choose' | 'google' | 'magic-link' | 'magic-link-sent' | 'pin' | 'email-pin-login' | 'email-pin-enter';

export default function ParentReauth() {
  const router = useRouter();
  const { familyInfo, setParentAuth, setFamilyInfo } = useAuthStore();
  
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [googleVerified, setGoogleVerified] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  
  // PIN state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Magic link state
  const [email, setEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [pollToken, setPollToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  
  // Email + PIN login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [foundParent, setFoundParent] = useState<any>(null);
  const [emailPinLoading, setEmailPinLoading] = useState(false);

  // Poll for magic link verification
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (pollToken && step === 'magic-link-sent') {
      setPolling(true);
      
      const checkStatus = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/magic-link/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll_token: pollToken }),
          });
          
          const data = await response.json();
          
          if (data.status === 'verified' && data.session_token) {
            // User verified in browser! Log them in
            setPolling(false);
            if (pollInterval) clearInterval(pollInterval);
            
            setParentAuth({
              userId: data.user_id,
              name: data.name,
              email: data.email,
              picture: data.picture,
              sessionToken: data.session_token,
            });
            
            router.replace('/parent/(tabs)');
          } else if (data.status === 'expired') {
            setPolling(false);
            if (pollInterval) clearInterval(pollInterval);
            Alert.alert('Σφάλμα', 'Ο σύνδεσμος έληξε. Δοκιμάστε ξανά.');
            setStep('choose');
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      };
      
      // Check immediately, then every 3 seconds
      checkStatus();
      pollInterval = setInterval(checkStatus, 3000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollToken, step]);

  // Handle OAuth redirect
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
      const result = await authAPI.exchangeSession(sessionId);
      
      console.log('parent-reauth processSessionId result:', JSON.stringify(result));
      
      // Check if this user already exists and needs PIN verification
      if (result.needs_pin_verification) {
        // Existing user - verify PIN
        // Check if this is the same parent as the logged out one
        if (familyInfo?.parentId && result.user_id !== familyInfo.parentId) {
          Alert.alert('Σφάλμα', 'Αυτός ο λογαριασμός Google δεν αντιστοιχεί στον καταχωρημένο γονέα.');
          return;
        }
        
        // Store session data for PIN verification
        setSessionData({ ...result, sessionId });
        setGoogleVerified(true);
        setStep('pin');
      } else if (result.needs_pin_setup) {
        // This is a new user trying to log in from the reauth screen
        // Redirect them to the proper signup flow
        Alert.alert(
          'Νέος Χρήστης',
          'Αυτός ο λογαριασμός Google δεν είναι καταχωρημένος. Θα μεταφερθείτε στην εγγραφή.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace({
                  pathname: '/auth/setup-pin',
                  params: {
                    tempSessionId: sessionId,
                    email: result.email,
                    name: result.name,
                    picture: result.picture || '',
                  },
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Σφάλμα', 'Αυτός ο λογαριασμός Google δεν αντιστοιχεί στον καταχωρημένο γονέα.');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία επαλήθευσης. Παρακαλώ δοκιμάστε ξανά.');
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
      const redirectUrl = Platform.OS === 'web'
        ? `${BACKEND_URL}/auth/parent-reauth`
        : `${BACKEND_URL}/api/oauth-callback`;

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, Linking.createURL('/auth/parent-reauth'));
        
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          let sessionId = url.hash.includes('session_id=')
            ? url.hash.split('session_id=')[1]?.split('&')[0]
            : url.searchParams.get('session_id');
          
          if (sessionId) {
            await processSessionId(sessionId);
          } else {
            Alert.alert('Σφάλμα', 'Δεν ολοκληρώθηκε η σύνδεση. Παρακαλώ δοκιμάστε ξανά.');
          }
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
        // Store the poll token to check for verification
        if (data.poll_token) {
          setPollToken(data.poll_token);
        }
        setStep('magic-link-sent');
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

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setPinError('Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    
    setLoading(true);
    setPinError('');
    
    try {
      const result = await authAPI.parentPinLogin(familyInfo!.parentId, pin);
      
      setParentAuth({
        userId: result.user_id,
        name: result.name,
        email: result.email,
        picture: result.picture,
        sessionToken: result.session_token,
      });
      
      router.replace('/parent/(tabs)');
    } catch (error: any) {
      setPinError('Λάθος PIN. Δοκιμάστε ξανά.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Email lookup handler
  const handleEmailLookup = async () => {
    const emailToLookup = loginEmail.trim().toLowerCase();
    if (!emailToLookup || !emailToLookup.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε έγκυρο email');
      return;
    }
    
    setEmailPinLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/lookup-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToLookup }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.found) {
        setFoundParent(data);
        setStep('email-pin-enter');
      } else {
        Alert.alert('Δεν βρέθηκε', 'Δεν βρέθηκε λογαριασμός με αυτό το email. Δοκιμάστε το "Συνέχεια με Email" για να δημιουργήσετε λογαριασμό.');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αναζήτησης λογαριασμού');
    } finally {
      setEmailPinLoading(false);
    }
  };
  
  // Email + PIN login handler
  const handleEmailPinLogin = async () => {
    if (loginPin.length !== 4) {
      Alert.alert('Σφάλμα', 'Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    
    setEmailPinLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/parent-pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: foundParent.user_id, pin: loginPin }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Set auth state
        setParentAuth({
          userId: data.user_id,
          name: data.name,
          email: data.email,
          picture: data.picture,
          sessionToken: data.session_token,
        });
        
        // Update family info with new data
        setFamilyInfo({
          parentId: data.user_id,
          parentName: data.name,
          parentEmail: data.email,
          parentPicture: data.picture,
          children: foundParent.children || [],
        });
        
        // Navigate to parent dashboard
        router.replace('/parent/(tabs)');
      } else {
        Alert.alert('Λάθος PIN', data.detail || 'Το PIN δεν είναι σωστό');
        setLoginPin('');
      }
    } catch (error) {
      console.error('PIN login error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης');
    } finally {
      setEmailPinLoading(false);
    }
  };

  const handleBackToRoleSelect = () => {
    router.replace('/auth/role-select');
  };

  if (processingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
          <Text style={styles.loadingText}>Επαλήθευση λογαριασμού...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Magic Link Sent Screen
  if (step === 'magic-link-sent') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.logo}>📧</Text>
          <Text style={styles.title}>Ελέγξτε το email σας!</Text>
          <Text style={styles.subtitle}>
            Στείλαμε ένα σύνδεσμο σύνδεσης στο{'\n'}
            <Text style={{ fontWeight: '600', color: COLORS.softBlue }}>{email}</Text>
          </Text>
          <Text style={styles.hintText}>
            Πατήστε τον σύνδεσμο στο email για να συνδεθείτε.
          </Text>
          
          {polling && (
            <View style={styles.pollingContainer}>
              <ActivityIndicator size="small" color={COLORS.softBlue} />
              <Text style={styles.pollingText}>Αναμονή επιβεβαίωσης...</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setPollToken(null);
              setPolling(false);
              setStep('choose');
            }}
          >
            <Text style={styles.backButtonText}>← Επιστροφή</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Magic Link Input Screen
  if (step === 'magic-link') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.logo}>✉️</Text>
              <Text style={styles.title}>Σύνδεση με Email</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardDescription}>
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
                style={styles.switchButton}
                onPress={() => setStep('choose')}
              >
                <Text style={styles.switchButtonText}>← Άλλες μέθοδοι σύνδεσης</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Choose Login Method Screen
  if (step === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏆</Text>
          <Text style={styles.title}>Επαλήθευση</Text>
          <Text style={styles.subtitle}>
            Καλωσήρθατε πίσω, {familyInfo?.parentName?.split(' ')[0]}!
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.softBlue} />
          </View>
          
          <Text style={styles.cardTitle}>Επιβεβαίωση Ταυτότητας</Text>
          <Text style={styles.cardDescription}>
            Για την ασφάλειά σας, παρακαλώ επιλέξτε έναν τρόπο σύνδεσης.
          </Text>

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
            style={styles.emailButton}
            onPress={() => setStep('magic-link')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={24} color={COLORS.softBlue} />
            <Text style={styles.emailButtonText}>Συνέχεια με Email</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ή</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={styles.pinLoginButton}
            onPress={() => setStep('email-pin-login')}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={24} color={COLORS.softGreen} />
            <Text style={styles.pinLoginButtonText}>Έχω ήδη PIN (Email + PIN)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToRoleSelect}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.mediumGray} />
          <Text style={styles.backButtonText}>Πίσω στην επιλογή ρόλου</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Email + PIN Login - Step 1: Enter Email
  if (step === 'email-pin-login') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.logo}>📧</Text>
              <Text style={styles.title}>Σύνδεση με Email</Text>
              <Text style={styles.subtitle}>
                Εισάγετε το email που χρησιμοποιήσατε κατά την εγγραφή
              </Text>
            </View>

            <View style={styles.card}>
              <TextInput
                style={styles.emailInput}
                placeholder="email@example.com"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.submitButton, emailPinLoading && styles.buttonDisabled]}
                onPress={handleEmailLookup}
                disabled={emailPinLoading}
              >
                {emailPinLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Συνέχεια</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setLoginEmail('');
                  setStep('choose');
                }}
              >
                <Text style={styles.switchButtonText}>← Άλλες μέθοδοι σύνδεσης</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Email + PIN Login - Step 2: Enter PIN
  if (step === 'email-pin-enter') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.logo}>🔐</Text>
              <Text style={styles.title}>Καλώς ήρθατε!</Text>
              <Text style={styles.subtitle}>{foundParent?.name}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardDescription}>
                Εισάγετε το 4-ψήφιο PIN σας
              </Text>

              <PinInput
                value={loginPin}
                onChange={setLoginPin}
              />

              <TouchableOpacity
                style={[styles.submitButton, (emailPinLoading || loginPin.length !== 4) && styles.buttonDisabled]}
                onPress={handleEmailPinLogin}
                disabled={emailPinLoading || loginPin.length !== 4}
              >
                {emailPinLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Σύνδεση</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setLoginPin('');
                  setStep('email-pin-login');
                }}
              >
                <Text style={styles.switchButtonText}>← Αλλαγή email</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 2: PIN Entry (after Google verification)
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.softGreen} />
              <Text style={styles.verifiedText}>Google επαληθεύτηκε</Text>
            </View>
            <Text style={styles.logo}>🔐</Text>
            <Text style={styles.title}>Εισαγωγή PIN</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              Εισάγετε το 4ψήφιο PIN σας για να συνδεθείτε.
            </Text>

            <View style={styles.pinContainer}>
              <PinInput
                value={pin}
                onChange={setPin}
                error={pinError}
              />
            </View>

            <Button
              title="Σύνδεση"
              onPress={handlePinSubmit}
              loading={loading}
              disabled={pin.length !== 4}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFE8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.softGreen,
    fontWeight: '500',
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 16,
  },
  pollingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
  },
  pollingText: {
    fontSize: 14,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    marginBottom: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
    width: '100%',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  emailInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.darkGray,
    width: '100%',
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
    width: '100%',
  },
  magicLinkButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 15,
    color: COLORS.softBlue,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  pinContainer: {
    marginBottom: 24,
    width: '100%',
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
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
  pinLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.softGreen,
    width: '100%',
  },
  pinLoginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.softGreen,
  },
  pinInputLarge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 16,
    width: '60%',
    alignSelf: 'center',
  },
});
