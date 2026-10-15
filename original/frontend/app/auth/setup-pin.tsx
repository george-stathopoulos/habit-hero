import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { PinInput } from '../../src/components/PinInput';
import { Button } from '../../src/components/Button';
import { authAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

export default function SetupPin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setParentAuth = useAuthStore((state) => state.setParentAuth);

  const handleCreatePin = () => {
    if (pin.length !== 4) {
      setError('Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirmPin = async () => {
    if (confirmPin !== pin) {
      setError('Τα PIN δεν ταιριάζουν');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.setupPin(
        params.tempSessionId as string,
        pin
      );

      setParentAuth({
        userId: result.user_id,
        name: result.name,
        email: result.email,
        picture: result.picture,
        sessionToken: result.session_token,
      });

      // Go to add child step
      router.replace('/auth/setup-child');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία δημιουργίας λογαριασμού');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Καλωσήρθες, {params.name}!
          </Text>
          <Text style={styles.emailText}>{params.email}</Text>
        </View>

        <View style={styles.pinSection}>
          {step === 'create' ? (
            <>
              <Text style={styles.instruction}>
                Δημιουργήστε ένα 4ψήφιο PIN
              </Text>
              <Text style={styles.subInstruction}>
                Θα το χρησιμοποιείτε για να συνδεθείτε ως γονέας
              </Text>
              <PinInput
                value={pin}
                onChange={setPin}
                error={error}
              />
              <Button
                title="Συνέχεια"
                onPress={handleCreatePin}
                disabled={pin.length !== 4}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Text style={styles.instruction}>
                Επιβεβαιώστε το PIN
              </Text>
              <Text style={styles.subInstruction}>
                Εισάγετε το PIN ξανά
              </Text>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                error={error}
              />
              <Button
                title="Ολοκλήρωση"
                onPress={handleConfirmPin}
                loading={loading}
                disabled={confirmPin.length !== 4}
                style={styles.button}
              />
              <Button
                title="Πίσω"
                onPress={() => {
                  setStep('create');
                  setConfirmPin('');
                  setError('');
                }}
                variant="outline"
                style={styles.backButton}
              />
            </>
          )}
        </View>
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
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  pinSection: {
    flex: 1,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  subInstruction: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
    width: '100%',
  },
  backButton: {
    marginTop: 16,
    width: '100%',
  },
});
