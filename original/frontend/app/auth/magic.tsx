import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { PinInput } from '../../src/components/PinInput';

// Get backend URL - handle web development mode where env vars may not be injected
const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export default function MagicLinkCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // For new user setup
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  
  // For existing user PIN verification
  const [verifyPin, setVerifyPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  const setParentAuth = useAuthStore((state) => state.setParentAuth);
  const setFamilyInfo = useAuthStore((state) => state.setFamilyInfo);

  // Extract and verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      // Get token from params or URL
      let token = params.token as string;
      
      if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('token') || '';
      }
      
      if (!token) {
        setError('Δεν βρέθηκε token στον σύνδεσμο');
        setLoading(false);
        return;
      }
      
      // Get backend URL
      const backendUrl = getBackendUrl();
      const apiUrl = `${backendUrl}/api/auth/magic-link/verify`;
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setUserData(data);
          if (data.name) {
            setName(data.name);
          }
        } else {
          setError(data.detail || 'Μη έγκυρος ή ληγμένος σύνδεσμος');
        }
      } catch (err) {
        console.error('Magic link verification error:', err);
        setError('Αποτυχία επαλήθευσης συνδέσμου');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const handleNewUserSetup = async () => {
    if (!name.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το όνομά σας');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Σφάλμα', 'Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Σφάλμα', 'Τα PIN δεν ταιριάζουν');
      return;
    }

    setSetupLoading(true);
    const backendUrl = getBackendUrl();
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/magic-link/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          name: name.trim(),
          pin,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setParentAuth({
          userId: data.user_id,
          name: data.name,
          email: data.email,
          picture: null,
          sessionToken: '',
        });
        setFamilyInfo({
          parentId: data.user_id,
          parentName: data.name,
          children: [],
        });
        
        router.replace('/auth/setup-child');
      } else {
        Alert.alert('Σφάλμα', data.detail || 'Αποτυχία ολοκλήρωσης εγγραφής');
      }
    } catch (err) {
      console.error('Setup error:', err);
      Alert.alert('Σφάλμα', 'Αποτυχία ολοκλήρωσης εγγραφής');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleExistingUserLogin = async () => {
    if (verifyPin.length !== 4) {
      setPinError('Εισάγετε το 4ψήφιο PIN σας');
      return;
    }

    setSetupLoading(true);
    setPinError('');
    const backendUrl = getBackendUrl();
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/parent-pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: userData.user_id,
          pin: verifyPin,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setParentAuth({
          userId: data.user_id,
          name: data.name,
          email: userData.email,
          picture: userData.picture,
          sessionToken: data.session_token || '',
        });
        setFamilyInfo({
          parentId: data.user_id,
          parentName: data.name,
          children: userData.children || [],
        });
        
        router.replace('/parent/(tabs)');
      } else {
        setPinError(data.detail || 'Λάθος PIN');
        setVerifyPin('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setPinError('Αποτυχία σύνδεσης');
    } finally {
      setSetupLoading(false);
    }
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (verifyPin.length === 4 && userData?.needs_pin_verification) {
      handleExistingUserLogin();
    }
  }, [verifyPin]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
          <Text style={styles.loadingText}>Επαλήθευση συνδέσμου...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorTitle}>Σφάλμα</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace('/auth/welcome')}
          >
            <Text style={styles.retryButtonText}>Επιστροφή στην αρχή</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // New user - needs to set up account
  if (userData?.needs_pin_setup) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>🎉</Text>
              <Text style={styles.headerTitle}>Καλωσήρθατε!</Text>
              <Text style={styles.headerSubtitle}>
                Ολοκληρώστε την εγγραφή σας
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Το όνομά σας</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Εισάγετε το όνομά σας"
                placeholderTextColor={COLORS.mediumGray}
              />

              <Text style={styles.label}>Δημιουργήστε PIN (4 ψηφία)</Text>
              <PinInput
                value={pin}
                onChange={setPin}
                length={4}
              />

              <Text style={[styles.label, { marginTop: 20 }]}>Επιβεβαιώστε το PIN</Text>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                length={4}
              />

              <TouchableOpacity
                style={[styles.submitButton, setupLoading && styles.buttonDisabled]}
                onPress={handleNewUserSetup}
                disabled={setupLoading}
              >
                {setupLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Συνέχεια</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Existing user - needs PIN verification
  if (userData?.needs_pin_verification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.headerEmoji}>👋</Text>
          <Text style={styles.headerTitle}>Καλώς ήρθατε πίσω!</Text>
          <Text style={styles.headerSubtitle}>{userData.name}</Text>
          
          <Text style={styles.pinLabel}>Εισάγετε το PIN σας</Text>
          <PinInput
            value={verifyPin}
            onChange={setVerifyPin}
            length={4}
          />
          
          {pinError ? (
            <Text style={styles.pinError}>{pinError}</Text>
          ) : null}

          {setupLoading && (
            <ActivityIndicator 
              size="small" 
              color={COLORS.softBlue} 
              style={{ marginTop: 20 }} 
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.softBlue,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  pinLabel: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 32,
    marginBottom: 16,
  },
  pinError: {
    color: COLORS.warmCoral,
    fontSize: 14,
    marginTop: 12,
  },
});
