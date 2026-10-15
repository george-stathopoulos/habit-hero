import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/store/authStore';
import { useChildTheme } from '../../../src/store/themeStore';
import { CHILD_THEMES, ThemeType } from '../../../src/constants/themes';
import { authAPI, tasksAPI, customAvatarAPI } from '../../../src/services/api';
import { AVATARS } from '../../../src/constants/avatars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gender } from '../../../src/utils/greekGender';
import * as ImagePicker from 'expo-image-picker';

// Badge data with icons
const BADGE_ICONS: Record<string, string> = {
  first_task: '🌟',
  streak_3: '🔥',
  streak_7: '⚡',
  streak_30: '🏆',
  points_100: '💎',
  points_500: '👑',
  points_1000: '🥇',
  helper: '🤝',
  creative: '🎨',
  active: '🏃',
  independent_1day: '💪',
  independent_7days: '🦸',
  independent_30days: '🎖️',
  focused_1day: '🎯',
  focused_7days: '🧠',
  focused_30days: '🏅',
  big_spender: '💸',
  photo_star: '📸',
};

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Animated Badge Component - Drop & Bounce effect
const AnimatedBadge = ({ icon, delay, index }: { icon: string; delay: number; index: number }) => {
  const dropAnim = useRef(new Animated.Value(-100)).current; // Start above
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Sequence: delay -> drop -> bounce -> settle
    const animationSequence = Animated.sequence([
      Animated.delay(delay),
      // Drop down with gravity-like effect
      Animated.parallel([
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Slight rotation while falling
        Animated.timing(rotateAnim, {
          toValue: (index % 2 === 0 ? 1 : -1) * 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Bounce effect
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      // Settle rotation back to 0
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();
  }, []);

  const bounceInterpolate = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -15, 0],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  return (
    <Animated.View
      style={[
        styles.badgeItem,
        {
          transform: [
            { translateY: Animated.add(dropAnim, bounceInterpolate) },
            { rotate: rotateInterpolate },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Text style={styles.badgeEmoji}>{icon}</Text>
    </Animated.View>
  );
};

export default function ChildProfile() {
  const router = useRouter();
  const { name, childId, logout, gender: storeGender } = useAuthStore();
  const gender: Gender = (storeGender === 'girl' ? 'girl' : 'boy');
  const { theme, themeId, setTheme } = useChildTheme(childId);
  const colors = theme.colors;
  const [profile, setProfile] = useState<any>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAvatarStatus, setCustomAvatarStatus] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
    loadBadges();
    loadCustomAvatarStatus();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/child/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomAvatarStatus = async () => {
    try {
      const status = await customAvatarAPI.getStatus();
      setCustomAvatarStatus(status);
    } catch (error) {
      console.error('Error loading custom avatar status:', error);
    }
  };

  const loadBadges = async () => {
    try {
      // First, check and award any missing point-based badges
      try {
        await fetch(`${BACKEND_URL}/api/child/check-badges`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.log('Badge check skipped');
      }
      
      const progress = await tasksAPI.getProgress();
      console.log('Loaded progress:', progress);
      console.log('Badges from progress:', progress.badges);
      setEarnedBadges(progress.badges || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const handleTakePhoto = async () => {
    if (!customAvatarStatus?.can_use) {
      if (customAvatarStatus?.mode === 'points' && customAvatarStatus?.points_needed > 0) {
        Alert.alert(
          '⭐ Χρειάζεσαι πόντους!',
          `Μάζεψε ακόμα ${customAvatarStatus.points_needed} πόντους για να ξεκλειδώσεις τη φωτογραφία avatar!`
        );
      } else {
        Alert.alert(
          '🔒 Κλειδωμένο',
          'Ζήτα από τους γονείς σου να ενεργοποιήσουν αυτή τη λειτουργία!'
        );
      }
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Άδεια Κάμερας', 'Χρειαζόμαστε πρόσβαση στην κάμερα για να βγάλεις φωτογραφία!');
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
      setUploadingAvatar(true);
      try {
        await customAvatarAPI.upload(result.assets[0].base64);
        await loadCustomAvatarStatus();
        Alert.alert('🎉 Τέλεια!', 'Η φωτογραφία σου αποθηκεύτηκε!');
      } catch (error: any) {
        Alert.alert('Ουπς!', error.message || 'Κάτι πήγε στραβά');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Αφαίρεση Φωτογραφίας',
      'Θέλεις να αφαιρέσεις τη φωτογραφία σου;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Αφαίρεση',
          style: 'destructive',
          onPress: async () => {
            try {
              await customAvatarAPI.remove();
              await loadCustomAvatarStatus();
            } catch (error) {
              console.error('Error removing avatar:', error);
            }
          }
        }
      ]
    );
  };

  const handleViewIntroduction = async () => {
    // Reset the intro seen flag and navigate to introduction
    if (childId) {
      await AsyncStorage.removeItem(`child_intro_seen_${childId}`);
    }
    router.push('/child/introduction');
  };

  const handleLogout = () => {
    Alert.alert(
      'Αποσύνδεση',
      'Θέλεις να βγεις από τον λογαριασμό σου;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Έξοδος',
          onPress: async () => {
            try {
              await authAPI.logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
            logout();
            router.replace('/auth/role-select');
          },
        },
      ]
    );
  };

  const avatar = AVATARS.find(a => a.id === profile?.avatar_id) || AVATARS[0];

  // Get badge icons for earned badges
  const displayBadges = earnedBadges
    .filter(badgeId => BADGE_ICONS[badgeId])
    .slice(0, 8); // Show max 8 badges in profile

  console.log('earnedBadges:', earnedBadges);
  console.log('displayBadges:', displayBadges);

  const hasCustomAvatar = customAvatarStatus?.has_custom_avatar && customAvatarStatus?.custom_avatar;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, { backgroundColor: colors.progressBar }]}>
        {/* Avatar with optional camera button */}
        <View style={styles.avatarContainer}>
          {hasCustomAvatar ? (
            <TouchableOpacity onPress={handleRemovePhoto} style={styles.customAvatarWrapper}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${customAvatarStatus.custom_avatar}` }}
                style={styles.customAvatarImage}
              />
              <View style={styles.removeAvatarBadge}>
                <Ionicons name="close" size={14} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.avatarEmoji}>{avatar.image}</Text>
          )}
          
          {/* Camera button - show if feature is available */}
          {customAvatarStatus?.enabled && (
            <TouchableOpacity
              style={[
                styles.cameraButton,
                !customAvatarStatus?.can_use && styles.cameraButtonLocked
              ]}
              onPress={handleTakePhoto}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons 
                    name={customAvatarStatus?.can_use ? "camera" : "lock-closed"} 
                    size={16} 
                    color={COLORS.white} 
                  />
                  {customAvatarStatus?.mode === 'points' && !customAvatarStatus?.can_use && (
                    <Text style={styles.cameraButtonPoints}>
                      {customAvatarStatus?.points_needed}⭐
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.name}>{name}</Text>
        {profile?.age && (
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>{profile.age} ετών</Text>
          </View>
        )}
        
        {/* Animated Badges Display */}
        {displayBadges.length > 0 ? (
          <View style={styles.badgesContainer}>
            <Text style={styles.badgesTitle}>✨ Τα Badges μου ✨</Text>
            <View style={styles.badgesRow}>
              {displayBadges.map((badgeId, index) => (
                <AnimatedBadge
                  key={badgeId}
                  icon={BADGE_ICONS[badgeId]}
                  delay={index * 150}
                  index={index}
                />
              ))}
            </View>
            {earnedBadges.length > 8 && (
              <Text style={styles.moreBadges}>+{earnedBadges.length - 8} ακόμα!</Text>
            )}
          </View>
        ) : (
          <View style={styles.badgesContainer}>
            <Text style={styles.badgesTitle}>🏅 Badges</Text>
            <Text style={styles.noBadgesText}>Ολοκλήρωσε tasks για να κερδίσεις badges!</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {profile && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.pointsColor }]}>
              {profile.total_points || 0}
            </Text>
            <Text style={styles.statLabel}>Πόντοι</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {profile.current_streak || 0}
            </Text>
            <Text style={styles.statLabel}>Σερί</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {profile.badges?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      )}

      {/* Theme Selection - Badge Style Grid */}
      <View style={[styles.themeSection, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.themeSectionHeader}>
          <Text style={[styles.themeSectionTitle, { color: colors.textPrimary }]}>🎨 Διάλεξε Θέμα</Text>
          <View style={[styles.themeCounter, { backgroundColor: colors.primary }]}>
            <Text style={styles.themeCounterText}>{CHILD_THEMES.length}</Text>
          </View>
        </View>
        
        <View style={styles.themesGrid}>
          {CHILD_THEMES.map((t) => {
            const isSelected = themeId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeCard,
                  { backgroundColor: t.colors.screenBackground },
                  isSelected && { borderColor: t.colors.primary, borderWidth: 3 },
                ]}
                onPress={() => setTheme(t.id)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.themeSelectedBadge, { backgroundColor: t.colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
                <Text style={styles.themeEmoji}>{t.emoji}</Text>
                <Text style={[styles.themeCardName, { color: t.colors.textPrimary }]}>{t.nameEl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleViewIntroduction}>
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Δες ξανά την Εισαγωγή</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="happy-outline" size={24} color={COLORS.darkGray} />
          <Text style={styles.menuText}>Αλλαγή Avatar</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Σύντομα</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={colors.highlight} />
        <Text style={[styles.logoutText, { color: colors.highlight }]}>Έξοδος</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerEmoji}>{theme.emoji}</Text>
        <Text style={styles.footerText}>Habit Hero - {theme.nameEl}</Text>
      </View>
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
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 80,
  },
  customAvatarWrapper: {
    position: 'relative',
  },
  customAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  removeAvatarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warmCoral,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    flexDirection: 'row',
    gap: 2,
  },
  cameraButtonLocked: {
    backgroundColor: COLORS.mediumGray,
  },
  cameraButtonPoints: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ageBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  ageText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  // Animated Badges styles
  badgesContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  badgesTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badgeItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  moreBadges: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noBadgesText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  themeSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeCounter: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeCounterText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  themeCardName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
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
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 12,
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
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerEmoji: {
    fontSize: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
});
