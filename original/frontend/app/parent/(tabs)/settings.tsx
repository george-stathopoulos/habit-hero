import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/store/authStore';
import { useParentTheme } from '../../../src/store/themeStore';
import { authAPI, customAvatarAPI, inactivityPenaltyAPI } from '../../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeSelector } from '../../../src/components/ThemeSelector';
import { LoveCreditsModal } from '../../../src/components/LoveCreditsModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ParentSettings() {
  const router = useRouter();
  const { name, email, userId, avatar, avatarType, clearFamily, setName, children: storeChildren } = useAuthStore();
  const { theme } = useParentTheme(userId);
  const colors = theme.colors;
  const [deleting, setDeleting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(name || '');
  const [savingName, setSavingName] = useState(false);
  const [showLoveCreditsModal, setShowLoveCreditsModal] = useState(false);
  const [showAvatarSettingsModal, setShowAvatarSettingsModal] = useState(false);
  const [selectedChildForAvatar, setSelectedChildForAvatar] = useState<any>(null);
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'free' | 'points'>('free');
  const [savingAvatarSettings, setSavingAvatarSettings] = useState(false);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  
  // Parent avatar state (loaded from AsyncStorage)
  const [parentPhoto, setParentPhoto] = useState<string | null>(null);
  
  // Inactivity penalty state - now with full settings
  const [inactivityPenaltySettings, setInactivityPenaltySettings] = useState<Record<string, {
    enabled: boolean;
    points_deduction: number;
    time_period_hours: number;
  }>>({});
  const [savingInactivityPenalty, setSavingInactivityPenalty] = useState<string | null>(null);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [selectedChildForInactivity, setSelectedChildForInactivity] = useState<any>(null);
  const [tempInactivityEnabled, setTempInactivityEnabled] = useState(false);
  const [tempPointsDeduction, setTempPointsDeduction] = useState(10);
  const [tempTimePeriodHours, setTempTimePeriodHours] = useState(24);

  // Options for inactivity penalty
  const POINTS_OPTIONS = [
    { value: 5, label: '5 πόντοι' },
    { value: 10, label: '10 πόντοι' },
    { value: 15, label: '15 πόντοι' },
  ];
  
  const TIME_OPTIONS = [
    { value: 12, label: 'Μισή μέρα (12 ώρες)' },
    { value: 24, label: '1 μέρα (24 ώρες)' },
    { value: 72, label: '3 μέρες' },
    { value: 168, label: '1 εβδομάδα' },
  ];

  useEffect(() => {
    loadChildren();
  }, []);

  // Load parent photo when userId is available
  useEffect(() => {
    if (userId) {
      loadParentPhoto();
    }
  }, [userId]);

  const loadParentPhoto = async () => {
    try {
      if (!userId) return;
      const savedPhoto = await AsyncStorage.getItem(`parent_photo_${userId}`);
      console.log('Settings: Loading parent photo for userId:', userId, 'Found:', !!savedPhoto);
      if (savedPhoto) {
        setParentPhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading parent photo:', error);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/children`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const children = data.children || data || [];
        setChildrenList(children);
        
        // Load inactivity penalty settings for each child (now with full settings)
        const settings: Record<string, { enabled: boolean; points_deduction: number; time_period_hours: number }> = {};
        for (const child of children) {
          try {
            const penaltySettings = await inactivityPenaltyAPI.getSettings(child.child_id);
            settings[child.child_id] = {
              enabled: penaltySettings.enabled,
              points_deduction: penaltySettings.points_deduction || 10,
              time_period_hours: penaltySettings.time_period_hours || 24,
            };
          } catch (e) {
            settings[child.child_id] = { enabled: false, points_deduction: 10, time_period_hours: 24 };
          }
        }
        setInactivityPenaltySettings(settings);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      // Fallback to store children
      setChildrenList(storeChildren || []);
    }
  };
  
  const openInactivitySettings = (child: any) => {
    setSelectedChildForInactivity(child);
    const settings = inactivityPenaltySettings[child.child_id] || { enabled: false, points_deduction: 10, time_period_hours: 24 };
    setTempInactivityEnabled(settings.enabled);
    setTempPointsDeduction(settings.points_deduction);
    setTempTimePeriodHours(settings.time_period_hours);
    setShowInactivityModal(true);
  };
  
  const saveInactivitySettings = async () => {
    if (!selectedChildForInactivity) return;
    
    setSavingInactivityPenalty(selectedChildForInactivity.child_id);
    try {
      await inactivityPenaltyAPI.updateSettings(
        selectedChildForInactivity.child_id,
        tempInactivityEnabled,
        tempPointsDeduction,
        tempTimePeriodHours
      );
      
      setInactivityPenaltySettings(prev => ({
        ...prev,
        [selectedChildForInactivity.child_id]: {
          enabled: tempInactivityEnabled,
          points_deduction: tempPointsDeduction,
          time_period_hours: tempTimePeriodHours,
        }
      }));
      
      setShowInactivityModal(false);
      
      // Format time for alert
      const timeLabel = TIME_OPTIONS.find(t => t.value === tempTimePeriodHours)?.label || `${tempTimePeriodHours} ώρες`;
      
      Alert.alert(
        tempInactivityEnabled ? '✅ Ενεργοποιήθηκε' : '❌ Απενεργοποιήθηκε',
        tempInactivityEnabled 
          ? `Θα αφαιρούνται ${tempPointsDeduction} πόντοι κάθε ${timeLabel} χωρίς δραστηριότητα (ελάχιστο 10 πόντοι).`
          : 'Δεν θα αφαιρούνται πόντοι λόγω αδράνειας.'
      );
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία αλλαγής ρύθμισης');
    } finally {
      setSavingInactivityPenalty(null);
    }
  };
  
  // Helper function to get summary text for a child's inactivity settings
  const getInactivitySummary = (childId: string): string => {
    const settings = inactivityPenaltySettings[childId];
    if (!settings || !settings.enabled) return 'Ανενεργό';
    
    const timeLabel = TIME_OPTIONS.find(t => t.value === settings.time_period_hours)?.label || `${settings.time_period_hours} ώρες`;
    return `${settings.points_deduction} πόντοι / ${timeLabel}`;
  };

  const handleChangeName = async () => {
    if (!newName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε ένα όνομα');
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/parent/update-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        setName(newName.trim());
        setShowNameModal(false);
        Alert.alert('Επιτυχία', 'Το όνομα ενημερώθηκε!');
      } else {
        throw new Error('Failed to update name');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης ονόματος');
    } finally {
      setSavingName(false);
    }
  };

  const handleViewIntroduction = async () => {
    // Reset the intro seen flag and navigate to introduction
    if (userId) {
      await AsyncStorage.removeItem(`parent_intro_seen_${userId}`);
    }
    router.push('/parent/introduction');
  };

  const handleSwitchUser = () => {
    router.push('/auth/role-select');
  };

  const handleLogout = () => {
    Alert.alert(
      'Αποσύνδεση',
      'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Αποσύνδεση',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
            // Parent logout - keep family info for children to still be able to login
            const { parentLogout } = useAuthStore.getState();
            await parentLogout();
            router.replace('/auth/role-select');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Διαγραφή Λογαριασμού',
      'ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα διαγράψει ΟΡΙΣΤΙΚΑ:\n\n• Τον λογαριασμό σας\n• Όλα τα παιδιά\n• Όλα τα δεδομένα προόδου\n• Όλες τις συνήθειες\n\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί!',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Τελική Επιβεβαίωση',
      'Είστε ΑΠΟΛΥΤΩΣ σίγουροι; Όλα τα δεδομένα θα χαθούν για πάντα.',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Ναι, Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await authAPI.deleteAccount();
              // Clear all local data
              await clearFamily();
              // Navigate to welcome
              router.replace('/welcome');
            } catch (error: any) {
              console.error('Delete account error:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής λογαριασμού. Παρακαλώ δοκιμάστε ξανά.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openAvatarSettings = async (child: any) => {
    setSelectedChildForAvatar(child);
    try {
      const settings = await customAvatarAPI.getSettings(child.child_id);
      setAvatarEnabled(settings.enabled);
      setAvatarMode(settings.mode as 'free' | 'points');
    } catch (error) {
      console.error('Error loading avatar settings:', error);
      setAvatarEnabled(false);
      setAvatarMode('free');
    }
    setShowAvatarSettingsModal(true);
  };

  const saveAvatarSettings = async () => {
    if (!selectedChildForAvatar) return;
    
    setSavingAvatarSettings(true);
    try {
      await customAvatarAPI.updateSettings(
        selectedChildForAvatar.child_id,
        avatarEnabled,
        avatarMode
      );
      Alert.alert('Επιτυχία!', 'Οι ρυθμίσεις αποθηκεύτηκαν.');
      setShowAvatarSettingsModal(false);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης ρυθμίσεων');
    } finally {
      setSavingAvatarSettings(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card - Clickable to edit profile */}
      <TouchableOpacity 
        style={styles.profileCard}
        onPress={() => router.push('/parent/profile')}
      >
        <View style={styles.avatarCircle}>
          {parentPhoto ? (
            <Image source={{ uri: parentPhoto }} style={styles.avatarImage} />
          ) : avatar && avatarType === 'emoji' ? (
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          ) : (
            <Ionicons name="person" size={40} color={COLORS.softBlue} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <Text style={styles.profileHint}>Πατήστε για επεξεργασία προφίλ</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Λογαριασμός</Text>

        {/* Send Love Credits */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setShowLoveCreditsModal(true)}
        >
          <Ionicons name="heart" size={24} color="#E91E63" />
          <Text style={styles.menuText}>Στείλε Πόντους Αγάπης</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Ειδοποιήσεις</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Σύντομα</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/parent/change-pin')}
        >
          <Ionicons name="lock-closed-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Αλλαγή PIN</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      {/* Children Settings - Single Link to dedicated page */}
      {childrenList && childrenList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Παιδιά</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/parent/child-settings')}
          >
            <View style={[styles.avatarSettingIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="people" size={20} color={COLORS.white} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Ρυθμίσεις Παιδιών</Text>
              <Text style={styles.menuSubtext}>Φωτογραφία Avatar, Ποινή Αδράνειας</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Εφαρμογή</Text>

        {/* Theme Selector - Now a link to dedicated page */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/parent/theme-selector')}
        >
          <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>🎨 Θέμα Εφαρμογής</Text>
            <Text style={styles.menuSubtext}>{theme.emoji} {theme.nameEl}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleViewIntroduction}>
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Δες ξανά την Εισαγωγή</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language-outline" size={24} color={COLORS.darkGray} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Γλώσσα</Text>
            <Text style={styles.menuSubtext}>Ελληνικά</Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Σύντομα</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/parent/help-feedback')}
        >
          <Ionicons name="help-circle-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Βοήθεια & Σχόλια</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/parent/privacy-policy')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Πολιτική Απορρήτου</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/parent/about')}
        >
          <Ionicons name="information-circle-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Σχετικά</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.warmCoral} />
        <Text style={styles.logoutText}>Αποσύνδεση</Text>
      </TouchableOpacity>

      {/* Danger Zone Link */}
      <TouchableOpacity 
        style={styles.dangerZoneLink}
        onPress={() => router.push('/parent/danger-zone')}
      >
        <View style={styles.dangerZoneLinkContent}>
          <Ionicons name="warning" size={24} color="#D32F2F" />
          <View style={styles.dangerZoneLinkText}>
            <Text style={styles.dangerZoneLinkTitle}>⚠️ Ζώνη Κινδύνου</Text>
            <Text style={styles.dangerZoneLinkSubtitle}>Επαναφορά εφαρμογής, Διαγραφή λογαριασμού</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
      </TouchableOpacity>

      <Text style={styles.version}>Habit Hero v1.0.0</Text>

      {/* Name Change Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNameModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Αλλαγή Ονόματος</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Νέο Όνομα</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Εισάγετε το όνομά σας"
                placeholderTextColor={COLORS.mediumGray}
                autoFocus
              />
              <Text style={styles.inputHint}>
                Αυτό το όνομα θα εμφανίζεται στα παιδιά σας
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangeName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Love Credits Modal */}
      <LoveCreditsModal
        visible={showLoveCreditsModal}
        onClose={() => setShowLoveCreditsModal(false)}
        onSuccess={() => {}}
      />

      {/* Custom Avatar Settings Modal */}
      <Modal
        visible={showAvatarSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📸 Φωτογραφία Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarSettingsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.childNameHeader}>
                Ρυθμίσεις για: {selectedChildForAvatar?.name}
              </Text>
              
              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.softGreen} />
                <Text style={styles.privacyText}>
                  Οι φωτογραφίες αποθηκεύονται τοπικά στη συσκευή. Δεν επεξεργαζόμαστε ούτε αποθηκεύουμε εικόνες στους servers μας.
                </Text>
              </View>

              {/* Enable/Disable Switch */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Ενεργοποίηση</Text>
                  <Text style={styles.settingHint}>
                    Επίτρεψε στο παιδί να χρησιμοποιήσει την κάμερα
                  </Text>
                </View>
                <Switch
                  value={avatarEnabled}
                  onValueChange={setAvatarEnabled}
                  trackColor={{ false: '#FFCDD2', true: '#A5D6A7' }}
                  thumbColor={avatarEnabled ? COLORS.softGreen : '#EF5350'}
                  ios_backgroundColor="#FFCDD2"
                />
              </View>

              {avatarEnabled && (
                <>
                  <Text style={styles.modeTitle}>Τρόπος ξεκλειδώματος:</Text>
                  
                  {/* Free Mode */}
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      avatarMode === 'free' && styles.modeOptionSelected
                    ]}
                    onPress={() => setAvatarMode('free')}
                  >
                    <View style={styles.modeRadio}>
                      {avatarMode === 'free' && <View style={styles.modeRadioInner} />}
                    </View>
                    <View style={styles.modeContent}>
                      <Text style={styles.modeLabel}>🎁 Δωρεάν</Text>
                      <Text style={styles.modeHint}>
                        Το παιδί μπορεί να χρησιμοποιήσει αμέσως τη λειτουργία
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Points Mode */}
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      avatarMode === 'points' && styles.modeOptionSelected
                    ]}
                    onPress={() => setAvatarMode('points')}
                  >
                    <View style={styles.modeRadio}>
                      {avatarMode === 'points' && <View style={styles.modeRadioInner} />}
                    </View>
                    <View style={styles.modeContent}>
                      <Text style={styles.modeLabel}>⭐ Με 500 Πόντους</Text>
                      <Text style={styles.modeHint}>
                        Το παιδί πρέπει να μαζέψει 500 πόντους. Κερδίζει το badge "📸 Αστέρι Φωτογραφίας"!
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAvatarSettingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAvatarSettings}
                disabled={savingAvatarSettings}
              >
                {savingAvatarSettings ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Inactivity Penalty Settings Modal */}
      <Modal
        visible={showInactivityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInactivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>😴 Ποινή Αδράνειας</Text>
              <TouchableOpacity onPress={() => setShowInactivityModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.childNameHeader}>
                Ρυθμίσεις για: {selectedChildForInactivity?.name}
              </Text>
              
              {/* Info Notice */}
              <View style={[styles.privacyNotice, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="information-circle" size={20} color="#E65100" />
                <Text style={[styles.privacyText, { color: '#E65100' }]}>
                  Αφαιρούνται πόντοι αν το παιδί δεν ολοκληρώσει καμία συνήθεια για το επιλεγμένο διάστημα. Οι πόντοι δεν πέφτουν κάτω από 10.
                </Text>
              </View>

              {/* Enable/Disable Switch */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Ενεργοποίηση</Text>
                  <Text style={styles.settingHint}>
                    Αφαίρεση πόντων για αδράνεια
                  </Text>
                </View>
                <Switch
                  value={tempInactivityEnabled}
                  onValueChange={setTempInactivityEnabled}
                  trackColor={{ false: '#FFCDD2', true: '#A5D6A7' }}
                  thumbColor={tempInactivityEnabled ? COLORS.softGreen : '#EF5350'}
                  ios_backgroundColor="#FFCDD2"
                />
              </View>

              {tempInactivityEnabled && (
                <>
                  {/* Points Selection */}
                  <Text style={styles.modeTitle}>💎 Πόντοι αφαίρεσης:</Text>
                  {POINTS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modeOption,
                        tempPointsDeduction === option.value && styles.modeOptionSelectedCoral
                      ]}
                      onPress={() => setTempPointsDeduction(option.value)}
                    >
                      <View style={[styles.modeRadio, { borderColor: COLORS.warmCoral }]}>
                        {tempPointsDeduction === option.value && (
                          <View style={[styles.modeRadioInner, { backgroundColor: COLORS.warmCoral }]} />
                        )}
                      </View>
                      <View style={styles.modeContent}>
                        <Text style={styles.modeLabel}>{option.label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Time Period Selection */}
                  <Text style={[styles.modeTitle, { marginTop: 16 }]}>⏰ Χρονικό διάστημα:</Text>
                  {TIME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modeOption,
                        tempTimePeriodHours === option.value && styles.modeOptionSelectedCoral
                      ]}
                      onPress={() => setTempTimePeriodHours(option.value)}
                    >
                      <View style={[styles.modeRadio, { borderColor: COLORS.warmCoral }]}>
                        {tempTimePeriodHours === option.value && (
                          <View style={[styles.modeRadioInner, { backgroundColor: COLORS.warmCoral }]} />
                        )}
                      </View>
                      <View style={styles.modeContent}>
                        <Text style={styles.modeLabel}>{option.label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInactivityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: COLORS.warmCoral }]}
                onPress={saveInactivitySettings}
                disabled={savingInactivityPenalty !== null}
              >
                {savingInactivityPenalty !== null ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  profileHint: {
    fontSize: 11,
    color: COLORS.softBlue,
    marginTop: 6,
    fontStyle: 'italic',
  },
  editNameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  themeSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 12,
    paddingLeft: 4,
  },
  avatarSettingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 12,
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: COLORS.mediumGray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEB',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warmCoral,
  },
  dangerZoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerZoneLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dangerZoneLinkText: {
    flex: 1,
  },
  dangerZoneLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  dangerZoneLinkSubtitle: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Avatar Settings Modal Styles
  childNameHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  settingHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 20,
    marginBottom: 12,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    marginBottom: 10,
  },
  modeOptionSelected: {
    borderColor: COLORS.softBlue,
    backgroundColor: '#E8F4FD',
  },
  modeOptionSelectedCoral: {
    borderColor: COLORS.warmCoral,
    backgroundColor: '#FFEBEE',
  },
  modeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  modeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.softBlue,
  },
  modeContent: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  modeHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
    lineHeight: 18,
  },
});
