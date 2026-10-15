import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function VerifyPin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, email, name, picture, tempSessionToken, childrenJson } = params;
  
  const setParentAuth = useAuthStore((state) => state.setParentAuth);
  const setFamilyInfo = useAuthStore((state) => state.setFamilyInfo);
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const children = childrenJson ? JSON.parse(childrenJson as string) : [];

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value].join('');
      if (fullPin.length === 4) {
        handleVerifyPin(fullPin);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPin = async (pinCode?: string) => {
    const fullPin = pinCode || pin.join('');
    if (fullPin.length !== 4) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το 4-ψήφιο PIN σας');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-pin-new-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          pin: fullPin,
          temp_session_token: tempSessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Λάθος PIN');
      }

      // Success - set auth and navigate to dashboard
      setFamilyInfo({
        parentId: userId as string,
        parentName: name as string,
        children: children,
      });
      
      setParentAuth({
        userId: userId as string,
        name: name as string,
        email: email as string,
        picture: picture as string,
        sessionToken: data.session_token,
      });

      router.replace('/parent/(tabs)');
    } catch (error: any) {
      // Clear PIN on error
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Σφάλμα', error.message || 'Λάθος PIN. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={COLORS.softBlue} />
          </View>
          <Text style={styles.title}>Καλώς ήρθατε πίσω!</Text>
          <Text style={styles.subtitle}>
            {name}, εισάγετε το PIN σας για να συνδεθείτε
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          {pin.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.pinInput,
                digit ? styles.pinInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handlePinChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              secureTextEntry
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyPin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>Σύνδεση</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Children info */}
        {children.length > 0 && (
          <View style={styles.childrenInfo}>
            <Text style={styles.childrenLabel}>
              {children.length === 1 ? 'Το παιδί σας' : 'Τα παιδιά σας'}:
            </Text>
            <Text style={styles.childrenNames}>
              {children.map((c: any) => c.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/auth/welcome')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.mediumGray} />
          <Text style={styles.backButtonText}>Χρήση διαφορετικού λογαριασμού</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  pinInput: {
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.darkGray,
  },
  pinInputFilled: {
    borderColor: COLORS.softBlue,
    backgroundColor: '#E3F2FD',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  childrenInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  childrenLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  childrenNames: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});
