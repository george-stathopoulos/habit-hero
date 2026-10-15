import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function DangerZonePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleResetApp = async () => {
    if (confirmText !== 'RESET') {
      Alert.alert('Σφάλμα', 'Πληκτρολογήστε "RESET" για επιβεβαίωση');
      return;
    }

    setResetting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/parent/reset-app`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear any cached data in AsyncStorage
        try {
          const keys = await AsyncStorage.getAllKeys();
          const keysToRemove = keys.filter(key => 
            key.includes('child_') || 
            key.includes('habit_') || 
            key.includes('intro_seen')
          );
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }
        } catch (e) {
          console.log('Error clearing cache:', e);
        }

        Alert.alert(
          '✅ Επαναφορά Ολοκληρώθηκε',
          'Η εφαρμογή επαναφέρθηκε στην αρχική της κατάσταση. Παρακαλώ κλείστε και ανοίξτε ξανά την εφαρμογή για να φορτωθούν τα νέα δεδομένα.',
          [{ text: 'OK', onPress: () => {
            // Force reload by going to index which will re-check everything
            router.replace('/');
          }}]
        );
      } else {
        const error = await response.json();
        Alert.alert('Σφάλμα', error.detail || 'Αποτυχία επαναφοράς');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με τον server');
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
      setConfirmText('');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Σφάλμα', 'Πληκτρολογήστε "DELETE" για επιβεβαίωση');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear local storage
        await SecureStore.deleteItemAsync('session_token');
        await SecureStore.deleteItemAsync('user_role');
        await SecureStore.deleteItemAsync('family_id');
        
        Alert.alert(
          '👋 Αντίο',
          'Ο λογαριασμός σας διαγράφηκε επιτυχώς.',
          [{ text: 'OK', onPress: () => {
            logout();
            router.replace('/');
          }}]
        );
      } else {
        const error = await response.json();
        Alert.alert('Σφάλμα', error.detail || 'Αποτυχία διαγραφής');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με τον server');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setConfirmText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚠️ Ζώνη Κινδύνου</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={32} color="#D32F2F" />
          <Text style={styles.warningTitle}>Προσοχή!</Text>
          <Text style={styles.warningText}>
            Οι ενέργειες σε αυτή τη σελίδα είναι μη αναστρέψιμες. 
            Παρακαλώ διαβάστε προσεκτικά πριν προχωρήσετε.
          </Text>
        </View>

        {/* Reset App Section */}
        <View style={styles.dangerSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="refresh-circle" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Επαναφορά Εφαρμογής</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Αυτή η ενέργεια θα διαγράψει:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Όλες τις συνήθειες (θα επιστρέψουν οι προεπιλεγμένες)</Text>
            <Text style={styles.bulletItem}>• Όλα τα στατιστικά και το ιστορικό</Text>
            <Text style={styles.bulletItem}>• Όλα τα badges και τα επιτεύγματα</Text>
            <Text style={styles.bulletItem}>• Όλους τους πόντους και τα Love Credits</Text>
            <Text style={styles.bulletItem}>• Όλα τα έπαθλα και τις εξαργυρώσεις</Text>
          </View>
          <Text style={styles.keepText}>
            ✓ Θα διατηρηθούν: Λογαριασμοί γονέα και παιδιών, PIN κωδικοί
          </Text>

          {!showResetConfirm ? (
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => setShowResetConfirm(true)}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.dangerButtonText}>Επαναφορά Εφαρμογής</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmLabel}>
                Πληκτρολογήστε "RESET" για επιβεβαίωση:
              </Text>
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="RESET"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <View style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowResetConfirm(false);
                    setConfirmText('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Άκυρο</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, confirmText !== 'RESET' && styles.confirmButtonDisabled]}
                  onPress={handleResetApp}
                  disabled={resetting || confirmText !== 'RESET'}
                >
                  {resetting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Επιβεβαίωση</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Delete Account Section */}
        <View style={[styles.dangerSection, styles.deleteSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash" size={24} color="#D32F2F" />
            <Text style={[styles.sectionTitle, { color: '#D32F2F' }]}>Διαγραφή Λογαριασμού</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Αυτή η ενέργεια θα διαγράψει οριστικά:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Τον λογαριασμό σας</Text>
            <Text style={styles.bulletItem}>• Όλα τα προφίλ παιδιών</Text>
            <Text style={styles.bulletItem}>• Όλα τα δεδομένα της οικογένειας</Text>
            <Text style={styles.bulletItem}>• Δεν μπορεί να ανακτηθεί!</Text>
          </View>

          {!showDeleteConfirm ? (
            <TouchableOpacity 
              style={[styles.dangerButton, styles.deleteButton]}
              onPress={() => {
                setShowResetConfirm(false);
                setShowDeleteConfirm(true);
                setConfirmText('');
              }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              <Text style={styles.dangerButtonText}>Διαγραφή Λογαριασμού</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmLabel}>
                Πληκτρολογήστε "DELETE" για επιβεβαίωση:
              </Text>
              <TextInput
                style={[styles.confirmInput, { borderColor: '#D32F2F' }]}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="DELETE"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <View style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Άκυρο</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.deleteConfirmButton, confirmText !== 'DELETE' && styles.confirmButtonDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Διαγραφή</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    borderBottomColor: '#FFCDD2',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D32F2F',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 8,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 20,
  },
  dangerSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteSection: {
    borderColor: '#D32F2F',
    borderWidth: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  bulletList: {
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  keepText: {
    fontSize: 14,
    color: COLORS.softGreen,
    fontWeight: '500',
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  dangerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  confirmLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  confirmInput: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  deleteConfirmButton: {
    backgroundColor: '#D32F2F',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
