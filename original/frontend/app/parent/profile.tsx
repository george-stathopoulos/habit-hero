import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { PARENT_AVATARS } from '../../src/constants/avatars';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ParentProfile() {
  const router = useRouter();
  const { name, email, userId, setName, setAvatar } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Name editing
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(name || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    loadParentAvatar();
  }, []);

  const loadParentAvatar = async () => {
    try {
      // Load from AsyncStorage (local storage for avatar)
      const savedAvatar = await AsyncStorage.getItem(`parent_avatar_${userId}`);
      const savedPhoto = await AsyncStorage.getItem(`parent_photo_${userId}`);
      
      if (savedPhoto) {
        setCustomPhoto(savedPhoto);
        setAvatar('photo', 'photo');
      } else if (savedAvatar) {
        setSelectedAvatar(savedAvatar);
        setAvatar(savedAvatar, 'emoji');
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = async (emoji: string) => {
    setSelectedAvatar(emoji);
    setCustomPhoto(null); // Clear custom photo when selecting emoji
    
    try {
      await AsyncStorage.setItem(`parent_avatar_${userId}`, emoji);
      await AsyncStorage.removeItem(`parent_photo_${userId}`);
      
      // Update auth store
      setAvatar(emoji, 'emoji');
      
      // Also update on server
      await fetch(`${BACKEND_URL}/api/parent/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: emoji, avatar_type: 'emoji' }),
      });
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const showPermissionDeniedAlert = (type: 'camera' | 'photos') => {
    const title = type === 'camera' ? 'Άδεια Κάμερας' : 'Άδεια Φωτογραφιών';
    const message = type === 'camera' 
      ? 'Για να βγάλετε φωτογραφία, πρέπει να δώσετε άδεια στην κάμερα από τις Ρυθμίσεις.'
      : 'Για να επιλέξετε φωτογραφία, πρέπει να δώσετε άδεια στις φωτογραφίες από τις Ρυθμίσεις.';
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Άκυρο', style: 'cancel' },
        { text: 'Άνοιγμα Ρυθμίσεων', onPress: openAppSettings },
      ]
    );
  };

  const handleTakePhoto = async () => {
    // First check current permission status
    const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
    
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      showPermissionDeniedAlert('camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const photoUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setCustomPhoto(photoUri);
      setSelectedAvatar(null);
      
      try {
        await AsyncStorage.setItem(`parent_photo_${userId}`, photoUri);
        await AsyncStorage.removeItem(`parent_avatar_${userId}`);
        
        // Update auth store
        setAvatar('photo', 'photo');
        
        // Update on server
        await fetch(`${BACKEND_URL}/api/parent/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ avatar: 'photo', avatar_type: 'photo' }),
        });
        
        Alert.alert('Επιτυχία!', 'Η φωτογραφία σας αποθηκεύτηκε!');
      } catch (error) {
        console.error('Error saving photo:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης φωτογραφίας');
      }
    }
  };

  const handleChooseFromGallery = async () => {
    // First check current permission status
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      showPermissionDeniedAlert('photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const photoUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setCustomPhoto(photoUri);
      setSelectedAvatar(null);
      
      try {
        await AsyncStorage.setItem(`parent_photo_${userId}`, photoUri);
        await AsyncStorage.removeItem(`parent_avatar_${userId}`);
        
        // Update auth store
        setAvatar('photo', 'photo');
        
        // Update on server
        await fetch(`${BACKEND_URL}/api/parent/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ avatar: 'photo', avatar_type: 'photo' }),
        });
        
        Alert.alert('Επιτυχία!', 'Η φωτογραφία σας αποθηκεύτηκε!');
      } catch (error) {
        console.error('Error saving photo:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης φωτογραφίας');
      }
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε ένα όνομα');
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/parent/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        setName(newName.trim());
        setShowNameModal(false);
        Alert.alert('Επιτυχία!', 'Το όνομά σας ενημερώθηκε!');
      } else {
        throw new Error('Failed to update name');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης ονόματος');
    } finally {
      setSavingName(false);
    }
  };

  const getCurrentAvatar = () => {
    if (customPhoto) {
      return { type: 'photo', value: customPhoto };
    }
    if (selectedAvatar) {
      return { type: 'emoji', value: selectedAvatar };
    }
    return { type: 'default', value: null };
  };

  const avatar = getCurrentAvatar();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Το Προφίλ μου</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer}>
            {avatar.type === 'photo' ? (
              <Image source={{ uri: avatar.value! }} style={styles.avatarImage} />
            ) : avatar.type === 'emoji' ? (
              <Text style={styles.avatarEmoji}>{avatar.value}</Text>
            ) : (
              <Ionicons name="person" size={50} color={COLORS.softBlue} />
            )}
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editNameButton}
            onPress={() => {
              setNewName(name || '');
              setShowNameModal(true);
            }}
          >
            <Ionicons name="pencil" size={18} color={COLORS.softBlue} />
          </TouchableOpacity>
        </View>

        {/* Photo Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Φωτογραφία Προφίλ</Text>
          
          <View style={styles.photoOptions}>
            <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
              <View style={styles.photoOptionIcon}>
                <Ionicons name="camera" size={28} color={COLORS.softBlue} />
              </View>
              <Text style={styles.photoOptionText}>Βγάλε Φωτογραφία</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.photoOption} onPress={handleChooseFromGallery}>
              <View style={styles.photoOptionIcon}>
                <Ionicons name="images" size={28} color={COLORS.softGreen} />
              </View>
              <Text style={styles.photoOptionText}>Επιλογή από Άλμπουμ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emoji Avatars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ή επιλέξτε ένα εικονίδιο</Text>
          
          <View style={styles.avatarGrid}>
            {PARENT_AVATARS.map((av) => (
              <TouchableOpacity
                key={av.id}
                style={[
                  styles.avatarOption,
                  selectedAvatar === av.image && !customPhoto && styles.avatarOptionSelected,
                ]}
                onPress={() => handleSelectAvatar(av.image)}
              >
                <Text style={styles.avatarOptionEmoji}>{av.image}</Text>
                <Text style={styles.avatarOptionName}>{av.name_el}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Remove Photo Option */}
        {customPhoto && (
          <TouchableOpacity 
            style={styles.removePhotoButton}
            onPress={async () => {
              setCustomPhoto(null);
              await AsyncStorage.removeItem(`parent_photo_${userId}`);
              Alert.alert('Επιτυχία', 'Η φωτογραφία αφαιρέθηκε');
            }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.warmCoral} />
            <Text style={styles.removePhotoText}>Αφαίρεση Φωτογραφίας</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Αλλαγή Ονόματος</Text>
            
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Το όνομά σας"
              placeholderTextColor={COLORS.mediumGray}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.modalCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, savingName && styles.modalSaveButtonDisabled]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  editNameButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
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
  photoOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  photoOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoOptionText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  avatarOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  avatarOptionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarOptionName: {
    fontSize: 10,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  removePhotoText: {
    fontSize: 14,
    color: COLORS.warmCoral,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
