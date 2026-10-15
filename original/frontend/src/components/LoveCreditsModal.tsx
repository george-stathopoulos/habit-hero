import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { AVATARS } from '../constants/avatars';
import { loveCreditsAPI, childrenAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Child {
  child_id: string;
  name: string;
  avatar_id: number;
}

interface LoveCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ICONS = [
  { id: 'heart', emoji: '💝', label: 'Καρδιά' },
  { id: 'gift', emoji: '🎁', label: 'Δώρο' },
  { id: 'kiss', emoji: '💋', label: 'Φιλί' },
];

const PRESET_AMOUNTS = [5, 10, 15, 20, 25, 50];

export function LoveCreditsModal({ visible, onClose, onSuccess }: LoveCreditsModalProps) {
  const { userId, avatar, avatarType } = useAuthStore();
  const [parentPhoto, setParentPhoto] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(10);
  const [selectedIcon, setSelectedIcon] = useState('heart');
  const [message, setMessage] = useState('γιατί... σε αγαπώ! ❤️');
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(true);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && userId) {
      loadParentAvatar();
    }
  }, [visible, userId]);

  const loadParentAvatar = async () => {
    try {
      if (!userId) return;
      const savedPhoto = await AsyncStorage.getItem(`parent_photo_${userId}`);
      if (savedPhoto) {
        setParentPhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading parent avatar:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadChildren();
      // Scale in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      // Heart pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      const data = await childrenAPI.getAll();
      setChildren(data);
      // Select all children by default
      setSelectedChildren(new Set(data.map((c: Child) => c.child_id)));
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  const toggleChild = (childId: string) => {
    setSelectedChildren(prev => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const getAvatarEmoji = (avatarId: number) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar?.image || '👤';
  };

  const handleSend = async () => {
    if (selectedChildren.size === 0) {
      Alert.alert('Προσοχή', 'Παρακαλώ επιλέξτε τουλάχιστον ένα παιδί');
      return;
    }

    if (amount < 1 || amount > 100) {
      Alert.alert('Προσοχή', 'Οι πόντοι πρέπει να είναι μεταξύ 1-100');
      return;
    }

    setLoading(true);
    try {
      const result = await loveCreditsAPI.send({
        child_ids: Array.from(selectedChildren),
        amount,
        icon: selectedIcon,
        message,
      });

      const childNames = result.sent_to.map((c: any) => c.child_name).join(', ');
      
      Alert.alert(
        '💝 Απεστάλη!',
        `Στείλατε ${amount} πόντους αγάπης σε: ${childNames}`,
        [{ text: 'Τέλεια!', onPress: () => {
          onSuccess();
          onClose();
        }}]
      );
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία αποστολής');
    } finally {
      setLoading(false);
    }
  };

  const selectedIconData = ICONS.find(i => i.id === selectedIcon);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Parent Avatar */}
            <View style={styles.parentAvatarContainer}>
              {parentPhoto ? (
                <Image source={{ uri: parentPhoto }} style={styles.parentAvatarImage} />
              ) : avatar && avatarType === 'emoji' ? (
                <Text style={styles.parentAvatarEmoji}>{avatar}</Text>
              ) : (
                <Animated.Text 
                  style={[
                    styles.headerEmoji,
                    { transform: [{ scale: heartAnim }] }
                  ]}
                >
                  💝
                </Animated.Text>
              )}
            </View>
            <Text style={styles.headerTitle}>Στείλε Αγάπη</Text>
            <Text style={styles.headerSubtitle}>Δωρίστε πόντους στα παιδιά σας!</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Children Selection */}
            <Text style={styles.sectionTitle}>Επιλέξτε παιδιά</Text>
            {loadingChildren ? (
              <ActivityIndicator size="small" color={COLORS.softBlue} />
            ) : (
              <View style={styles.childrenGrid}>
                {children.map((child) => {
                  const isSelected = selectedChildren.has(child.child_id);
                  return (
                    <TouchableOpacity
                      key={child.child_id}
                      style={[
                        styles.childCard,
                        isSelected && styles.childCardSelected,
                      ]}
                      onPress={() => toggleChild(child.child_id)}
                    >
                      <Text style={styles.childAvatar}>{getAvatarEmoji(child.avatar_id)}</Text>
                      <Text style={[
                        styles.childName,
                        isSelected && styles.childNameSelected,
                      ]}>
                        {child.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Ionicons name="checkmark" size={14} color={COLORS.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Amount Selection */}
            <Text style={styles.sectionTitle}>Πόσοι πόντοι;</Text>
            <View style={styles.amountGrid}>
              {PRESET_AMOUNTS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.amountButton,
                    amount === preset && styles.amountButtonSelected,
                  ]}
                  onPress={() => setAmount(preset)}
                >
                  <Text style={[
                    styles.amountText,
                    amount === preset && styles.amountTextSelected,
                  ]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customAmountInput}
              value={String(amount)}
              onChangeText={(text) => setAmount(parseInt(text) || 0)}
              keyboardType="number-pad"
              placeholder="Ή πληκτρολογήστε ποσό"
              placeholderTextColor={COLORS.mediumGray}
            />

            {/* Icon Selection */}
            <Text style={styles.sectionTitle}>Επιλέξτε εικονίδιο</Text>
            <View style={styles.iconsRow}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.id}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon.id && styles.iconButtonSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon.id)}
                >
                  <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                  <Text style={[
                    styles.iconLabel,
                    selectedIcon === icon.id && styles.iconLabelSelected,
                  ]}>
                    {icon.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message */}
            <Text style={styles.sectionTitle}>Μήνυμα</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Γράψτε ένα μήνυμα..."
              placeholderTextColor={COLORS.mediumGray}
              multiline
              numberOfLines={2}
            />

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Προεπισκόπηση:</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewEmoji}>{selectedIconData?.emoji}</Text>
                <Text style={styles.previewText}>
                  +{amount} πόντοι αγάπης!
                </Text>
                <Text style={styles.previewMessage}>"{message}"</Text>
              </View>
            </View>
          </ScrollView>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="heart" size={24} color={COLORS.white} />
                <Text style={styles.sendButtonText}>Αποστολή Αγάπης</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFF0F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  parentAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#E91E63',
  },
  parentAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  parentAvatarEmoji: {
    fontSize: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E91E63',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
    marginTop: 16,
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  childCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childCardSelected: {
    backgroundColor: '#FFE4EC',
    borderColor: '#E91E63',
  },
  childAvatar: {
    fontSize: 32,
    marginBottom: 4,
  },
  childName: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  childNameSelected: {
    color: '#E91E63',
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E91E63',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountButtonSelected: {
    backgroundColor: '#FFE4EC',
    borderColor: '#E91E63',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  amountTextSelected: {
    color: '#E91E63',
  },
  customAmountInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 12,
    textAlign: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    backgroundColor: '#FFE4EC',
    borderColor: '#E91E63',
  },
  iconEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  iconLabelSelected: {
    color: '#E91E63',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.darkGray,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFE4EC',
  },
  previewTitle: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  previewContent: {
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E91E63',
  },
  previewMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#E91E63',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
