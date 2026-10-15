import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { PinInput } from '../../src/components/PinInput';
import { Button } from '../../src/components/Button';
import { authAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

export default function ParentPin() {
  const router = useRouter();
  const { parentId, familyInfo, setParentAuth } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isLoggingIn = useRef(false);

  // Auto-login when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4 && !isLoggingIn.current && !loading) {
      handleLogin();
    }
  }, [pin]);

  const handleLogin = async () => {
    if (pin.length !== 4 || isLoggingIn.current) {
      return;
    }

    if (!parentId) {
      Alert.alert('Σφάλμα', 'Δεν βρέθηκε οικογένεια');
      return;
    }

    isLoggingIn.current = true;
    setLoading(true);
    setError('');
    
    try {
      const result = await authAPI.parentPinLogin(parentId, pin);

      setParentAuth({
        userId: result.user_id,
        name: result.name,
        email: result.email,
        picture: result.picture,
        sessionToken: result.session_token,
      });

      router.replace('/parent/(tabs)');
    } catch (error: any) {
      setError('Λάθος PIN. Δοκιμάστε ξανά.');
      setPin('');
      isLoggingIn.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={48} color={COLORS.softBlue} />
            </View>
            <Text style={styles.greeting}>Γεια σου!</Text>
            <Text style={styles.name}>{familyInfo?.parentName || 'Γονιός'}</Text>
          </View>

          <View style={styles.pinSection}>
            <Text style={styles.instruction}>
              Εισάγετε το PIN σας
            </Text>
            <PinInput
              value={pin}
              onChange={setPin}
              error={error}
            />
            {loading && (
              <Text style={styles.loadingText}>Σύνδεση...</Text>
            )}
          </View>

          <Button
            title="Πίσω"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 18,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  pinSection: {
    flex: 1,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    color: COLORS.darkGray,
    marginBottom: 32,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  button: {
    marginTop: 32,
    width: '100%',
  },
  backButton: {
    marginBottom: 32,
  },
});
