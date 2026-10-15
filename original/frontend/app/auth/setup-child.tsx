import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { AvatarSelector } from '../../src/components/AvatarSelector';
import { PinInput } from '../../src/components/PinInput';
import { childrenAPI } from '../../src/services/api';

const GENDERS = [
  { id: 'boy', label: 'Αγόρι', icon: '👦' },
  { id: 'girl', label: 'Κορίτσι', icon: '👧' },
];

const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export default function SetupChild() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState(8);
  const [avatarId, setAvatarId] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα');
        return;
      }
      if (!gender) {
        Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε φύλο');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCreateChild = async () => {
    if (pin.length !== 4) {
      Alert.alert('Σφάλμα', 'Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Σφάλμα', 'Τα PIN δεν ταιριάζουν');
      return;
    }

    setLoading(true);
    try {
      const result = await childrenAPI.create({
        name: name.trim(),
        gender,
        age,
        pin,
        avatar_id: avatarId,
      });
      
      // Go to habits selection
      router.replace({
        pathname: '/auth/setup-habits',
        params: { childId: result.child_id, childName: name.trim() }
      });
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>👶 Προσθήκη Παιδιού</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicators */}
          <View style={styles.steps}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step >= s && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepIndicatorText}>Βήμα {step} από 3</Text>

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Πληροφορίες Παιδιού</Text>
              <Text style={styles.stepSubtitle}>
                Συμπληρώστε τα στοιχεία του παιδιού σας
              </Text>
              
              <Text style={styles.label}>Όνομα</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Π.χ. Μαρία"
                placeholderTextColor={COLORS.mediumGray}
                autoCorrect={true}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Ηλικία</Text>
              <View style={styles.ageSelector}>
                {AGES.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.ageButton,
                      age === a && styles.ageButtonActive,
                    ]}
                    onPress={() => setAge(a)}
                  >
                    <Text style={[
                      styles.ageText,
                      age === a && styles.ageTextActive,
                    ]}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Φύλο</Text>
              <View style={styles.genderOptions}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.genderButton,
                      gender === g.id && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender(g.id)}
                  >
                    <Text style={styles.genderIcon}>{g.icon}</Text>
                    <Text style={[
                      styles.genderLabel,
                      gender === g.id && styles.genderLabelActive,
                    ]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Συνέχεια"
                onPress={handleNext}
                style={styles.nextButton}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Επιλογή Avatar</Text>
              <Text style={styles.stepSubtitle}>
                Διάλεξε τον χαρακτήρα του {name}
              </Text>

              <AvatarSelector
                selectedId={avatarId}
                onSelect={setAvatarId}
                gender={gender as 'boy' | 'girl' | undefined}
                size="large"
              />

              <View style={styles.buttonRow}>
                <Button
                  title="Πίσω"
                  onPress={() => setStep(1)}
                  variant="outline"
                  style={styles.backButton}
                />
                <Button
                  title="Συνέχεια"
                  onPress={handleNext}
                  style={styles.nextButtonHalf}
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ορισμός PIN</Text>
              <Text style={styles.stepSubtitle}>
                Δημιουργήστε ένα 4ψήφιο PIN για τον/την {name}
              </Text>

              <View style={styles.pinSection}>
                <Text style={styles.pinLabel}>PIN</Text>
                <PinInput value={pin} onChange={setPin} autoFocus={true} />

                <Text style={[styles.pinLabel, { marginTop: 24 }]}>Επιβεβαίωση PIN</Text>
                <PinInput value={confirmPin} onChange={setConfirmPin} autoFocus={false} />
              </View>

              <View style={styles.buttonRow}>
                <Button
                  title="Πίσω"
                  onPress={() => setStep(2)}
                  variant="outline"
                  style={styles.backButton}
                />
                <Button
                  title="Δημιουργία"
                  onPress={handleCreateChild}
                  loading={loading}
                  style={styles.nextButtonHalf}
                />
              </View>
            </View>
          )}

          {/* Bottom spacer for better scrolling */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
  },
  stepDotActive: {
    backgroundColor: COLORS.softBlue,
    borderColor: COLORS.softBlue,
  },
  stepIndicatorText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: '#E8F4FD',
    borderColor: COLORS.softBlue,
  },
  genderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  genderLabelActive: {
    color: COLORS.softBlue,
  },
  nextButton: {
    marginTop: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backButton: {
    flex: 1,
  },
  nextButtonHalf: {
    flex: 1,
  },
  pinSection: {
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
  ageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  ageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ageButtonActive: {
    backgroundColor: COLORS.softBlue,
    borderColor: COLORS.softBlue,
  },
  ageText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  ageTextActive: {
    color: COLORS.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
