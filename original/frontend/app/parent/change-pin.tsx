import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { PinInput } from '../../src/components/PinInput';
import { Button } from '../../src/components/Button';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ChangePin() {
  const router = useRouter();
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCurrentPinNext = () => {
    if (currentPin.length !== 4) {
      setError('Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    setError('');
    setStep('new');
  };

  const handleNewPinNext = () => {
    if (newPin.length !== 4) {
      setError('Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    if (newPin === currentPin) {
      setError('Το νέο PIN πρέπει να είναι διαφορετικό');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirmPin = async () => {
    if (confirmPin !== newPin) {
      setError('Τα PIN δεν ταιριάζουν');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_pin: currentPin,
          new_pin: newPin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Επιτυχία!',
          'Το PIN σας άλλαξε επιτυχώς.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        if (response.status === 401) {
          setError('Λάθος τρέχον PIN');
          setStep('current');
          setCurrentPin('');
        } else {
          setError(data.detail || 'Αποτυχία αλλαγής PIN');
        }
      }
    } catch (error) {
      setError('Σφάλμα σύνδεσης');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'current': return 'Τρέχον PIN';
      case 'new': return 'Νέο PIN';
      case 'confirm': return 'Επιβεβαίωση PIN';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'current': return 'Εισάγετε το τρέχον 4ψήφιο PIN σας.';
      case 'new': return 'Εισάγετε ένα νέο 4ψήφιο PIN.';
      case 'confirm': return 'Επιβεβαιώστε το νέο PIN σας.';
    }
  };

  const getValue = () => {
    switch (step) {
      case 'current': return currentPin;
      case 'new': return newPin;
      case 'confirm': return confirmPin;
    }
  };

  const setValue = (value: string) => {
    switch (step) {
      case 'current': setCurrentPin(value); break;
      case 'new': setNewPin(value); break;
      case 'confirm': setConfirmPin(value); break;
    }
  };

  const handleNext = () => {
    switch (step) {
      case 'current': handleCurrentPinNext(); break;
      case 'new': handleNewPinNext(); break;
      case 'confirm': handleConfirmPin(); break;
    }
  };

  const handleBack = () => {
    setError('');
    switch (step) {
      case 'new': setStep('current'); break;
      case 'confirm': setStep('new'); setConfirmPin(''); break;
      default: router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="close" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 Αλλαγή PIN</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Progress */}
          <View style={styles.progress}>
            {['current', 'new', 'confirm'].map((s, i) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  (step === s || ['current', 'new', 'confirm'].indexOf(step) > i) && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={32} color={COLORS.softBlue} />
            </View>
            
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.description}>{getDescription()}</Text>

            <View style={styles.pinContainer}>
              <PinInput
                value={getValue()}
                onChange={setValue}
                error={error}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="Πίσω"
                onPress={handleBack}
                variant="outline"
                style={styles.halfButton}
              />
              <Button
                title={step === 'confirm' ? 'Αποθήκευση' : 'Συνέχεια'}
                onPress={handleNext}
                loading={loading}
                disabled={getValue().length !== 4}
                style={styles.halfButton}
              />
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  content: {
    padding: 16,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: COLORS.softBlue,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinContainer: {
    marginBottom: 24,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  halfButton: {
    flex: 1,
  },
});
