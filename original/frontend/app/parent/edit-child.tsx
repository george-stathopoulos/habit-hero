import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { AvatarSelector } from '../../src/components/AvatarSelector';
import { childrenAPI, childHabitsAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { AVATARS } from '../../src/constants/avatars';

export default function EditChild() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateFamilyChildren, familyInfo } = useAuthStore();
  
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [age, setAge] = useState(8);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignedHabitsCount, setAssignedHabitsCount] = useState(0);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const [children, habitsData] = await Promise.all([
        childrenAPI.getAll(),
        childHabitsAPI.getAssignedHabits(params.childId as string).catch(() => ({ habit_ids: [] }))
      ]);
      
      const child = children.find((c: any) => c.child_id === params.childId);
      if (child) {
        setName(child.name);
        setAvatarId(child.avatar_id);
        setAge(child.age || 8);
      }
      
      setAssignedHabitsCount(habitsData.habit_ids?.length || 0);
    } catch (error) {
      console.error('Error loading child:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      Alert.alert('Σφάλμα', 'Το PIN πρέπει να είναι 4 ψηφία');
      return;
    }

    setChangingPin(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/children/${params.childId}/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ new_pin: newPin }),
      });

      if (response.ok) {
        Alert.alert('Επιτυχία!', `Το PIN του ${params.childName} άλλαξε.`);
        setShowPinChange(false);
        setNewPin('');
      } else {
        throw new Error('Failed to change PIN');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία αλλαγής PIN');
    } finally {
      setChangingPin(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα');
      return;
    }

    setSaving(true);
    try {
      await childrenAPI.update(params.childId as string, {
        name: name.trim(),
        avatar_id: avatarId,
      });
      
      // Update local family info
      if (familyInfo) {
        const updatedChildren = familyInfo.children.map(c => 
          c.child_id === params.childId 
            ? { ...c, name: name.trim(), avatar_id: avatarId }
            : c
        );
        updateFamilyChildren(updatedChildren);
      }
      
      Alert.alert('Επιτυχία', 'Οι αλλαγές αποθηκεύτηκαν!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Διαγραφή Παιδιού',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε τον λογαριασμό του "${params.childName}";\n\nΑυτή η ενέργεια θα διαγράψει όλα τα δεδομένα του παιδιού (πόντους, εμβλήματα, ιστορικό) και δεν μπορεί να αναιρεθεί.`,
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await childrenAPI.delete(params.childId as string);
      
      // Update local family info
      if (familyInfo) {
        const updatedChildren = familyInfo.children.filter(
          c => c.child_id !== params.childId
        );
        updateFamilyChildren(updatedChildren);
      }
      
      Alert.alert('Διαγράφηκε', 'Ο λογαριασμός διαγράφηκε επιτυχώς.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleManageHabits = () => {
    router.push({
      pathname: '/parent/manage-habits',
      params: { childId: params.childId, childName: params.childName },
    });
  };

  const handleRestartOnboarding = () => {
    router.push({
      pathname: '/parent/child-onboarding',
      params: { childId: params.childId, childName: params.childName },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </View>
    );
  }

  const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="close" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Επεξεργασία</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarEmoji}>{currentAvatar.image}</Text>
            <Text style={styles.avatarName}>{currentAvatar.name_el}</Text>
          </View>

          <Text style={styles.label}>Όνομα</Text>
          <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Όνομα παιδιού"
          placeholderTextColor={COLORS.mediumGray}
          autoCorrect={true}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Εικονίδιο</Text>
        <AvatarSelector
          selectedId={avatarId}
          onSelect={setAvatarId}
          size="medium"
        />

        <Button
          title="Αποθήκευση Αλλαγών"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      </View>

      {/* Habits Management Section */}
      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Συνήθειες</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleManageHabits}>
          <View style={styles.menuIcon}>
            <Ionicons name="list" size={24} color={COLORS.softBlue} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Διαχείριση Συνηθειών</Text>
            <Text style={styles.menuSubtitle}>
              {assignedHabitsCount > 0 
                ? `${assignedHabitsCount} συνήθειες ενεργές`
                : 'Δεν έχουν οριστεί συνήθειες'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleRestartOnboarding}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="sparkles" size={24} color={COLORS.softGreen} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Νέες Προτάσεις</Text>
            <Text style={styles.menuSubtitle}>
              Επιλέξτε στόχους για προτεινόμενες συνήθειες
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      {/* PIN Management Section */}
      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Ασφάλεια</Text>
        
        {!showPinChange ? (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowPinChange(true)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="lock-closed" size={24} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Αλλαγή PIN Παιδιού</Text>
              <Text style={styles.menuSubtitle}>
                Ορίστε νέο 4ψήφιο PIN
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        ) : (
          <View style={styles.pinChangeCard}>
            <Text style={styles.pinChangeTitle}>Νέο PIN για {params.childName}</Text>
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="0000"
              placeholderTextColor={COLORS.mediumGray}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <View style={styles.pinButtons}>
              <TouchableOpacity 
                style={styles.pinCancelButton}
                onPress={() => { setShowPinChange(false); setNewPin(''); }}
              >
                <Text style={styles.pinCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pinSaveButton, newPin.length !== 4 && styles.pinSaveButtonDisabled]}
                onPress={handleChangePin}
                disabled={newPin.length !== 4 || changingPin}
              >
                {changingPin ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.pinSaveText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Ζώνη Κινδύνου</Text>
        <Text style={styles.dangerText}>
          Η διαγραφή του λογαριασμού θα αφαιρέσει όλα τα δεδομένα του παιδιού, 
          συμπεριλαμβανομένων των πόντων, εμβλημάτων και ιστορικού εργασιών.
        </Text>
        <Button
          title="Διαγραφή Λογαριασμού"
          onPress={handleDelete}
          loading={deleting}
          variant="danger"
          icon={<Ionicons name="trash-outline" size={18} color={COLORS.white} />}
          style={styles.deleteButton}
        />
      </View>
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarEmoji: {
    fontSize: 80,
  },
  avatarName: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
  saveButton: {
    marginTop: 32,
  },
  habitsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  pinChangeCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  pinChangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  pinInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  pinButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pinCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  pinCancelText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  pinSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
  },
  pinSaveButtonDisabled: {
    backgroundColor: COLORS.mediumGray,
  },
  pinSaveText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  dangerZone: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warmCoral,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
});
