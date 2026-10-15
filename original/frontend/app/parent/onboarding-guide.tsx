import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  mockupContent: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  iconColor,
  bgColor,
  title,
  description,
  mockupContent,
}) => (
  <View style={styles.featureCard}>
    <View style={[styles.mockupContainer, { backgroundColor: bgColor }]}>
      {mockupContent}
    </View>
    <View style={styles.featureContent}>
      <View style={[styles.featureIconBadge, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// Mockup Components
const SwitchUserMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupHeader}>
      <View style={styles.mockupHeaderLeft}>
        <Text style={styles.mockupHeaderText}>Γεια σου, Μαρία!</Text>
      </View>
      <View style={styles.mockupSwitchButton}>
        <Ionicons name="swap-horizontal" size={20} color={COLORS.white} />
      </View>
    </View>
    <View style={styles.mockupArrow}>
      <Ionicons name="arrow-up" size={32} color={COLORS.warmCoral} />
      <Text style={styles.mockupArrowText}>Εδώ!</Text>
    </View>
  </View>
);

const AddHabitMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupHabitList}>
      <View style={styles.mockupHabitItem}>
        <Text style={styles.mockupEmoji}>🦷</Text>
        <Text style={styles.mockupHabitText}>Βούρτσισμα δοντιών</Text>
        <Text style={styles.mockupPoints}>+10</Text>
      </View>
      <View style={styles.mockupHabitItem}>
        <Text style={styles.mockupEmoji}>📚</Text>
        <Text style={styles.mockupHabitText}>Διάβασμα</Text>
        <Text style={styles.mockupPoints}>+20</Text>
      </View>
      <View style={[styles.mockupHabitItem, styles.mockupAddItem]}>
        <Ionicons name="add-circle" size={24} color={COLORS.softBlue} />
        <Text style={[styles.mockupHabitText, { color: COLORS.softBlue }]}>Νέα Συνήθεια</Text>
      </View>
    </View>
  </View>
);

const ApprovalMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupApprovalCard}>
      <View style={styles.mockupApprovalHeader}>
        <Text style={styles.mockupEmoji}>✨</Text>
        <View>
          <Text style={styles.mockupApprovalTitle}>Νίκος ολοκλήρωσε</Text>
          <Text style={styles.mockupApprovalHabit}>Βούρτσισμα δοντιών</Text>
        </View>
      </View>
      <View style={styles.mockupApprovalButtons}>
        <View style={[styles.mockupApprovalBtn, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark" size={20} color="#4CAF50" />
        </View>
        <View style={[styles.mockupApprovalBtn, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="close" size={20} color="#F44336" />
        </View>
        <View style={[styles.mockupApprovalBtn, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="refresh" size={20} color="#FF9800" />
        </View>
      </View>
    </View>
  </View>
);

const RewardsMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupRewardsList}>
      <View style={styles.mockupRewardItem}>
        <Text style={styles.mockupEmoji}>🍦</Text>
        <View style={styles.mockupRewardInfo}>
          <Text style={styles.mockupRewardName}>Παγωτό</Text>
          <Text style={styles.mockupRewardCost}>30 πόντοι</Text>
        </View>
      </View>
      <View style={styles.mockupRewardItem}>
        <Text style={styles.mockupEmoji}>🎬</Text>
        <View style={styles.mockupRewardInfo}>
          <Text style={styles.mockupRewardName}>Βραδιά ταινίας</Text>
          <Text style={styles.mockupRewardCost}>50 πόντοι</Text>
        </View>
      </View>
      <View style={styles.mockupRewardItem}>
        <Text style={styles.mockupEmoji}>🎡</Text>
        <View style={styles.mockupRewardInfo}>
          <Text style={styles.mockupRewardName}>Λούνα Παρκ</Text>
          <Text style={styles.mockupRewardCost}>150 πόντοι</Text>
        </View>
      </View>
    </View>
  </View>
);

const AvatarSettingsMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupSettingsCard}>
      <View style={styles.mockupSettingRow}>
        <Ionicons name="camera" size={24} color="#9C27B0" />
        <View style={styles.mockupSettingInfo}>
          <Text style={styles.mockupSettingTitle}>Φωτογραφία Avatar</Text>
          <Text style={styles.mockupSettingDesc}>Δωρεάν ή με 500 πόντους</Text>
        </View>
        <View style={styles.mockupSwitch}>
          <View style={styles.mockupSwitchThumb} />
        </View>
      </View>
      <Text style={styles.mockupSettingNote}>
        📸 Το παιδί θα ενημερωθεί αυτόματα!
      </Text>
    </View>
  </View>
);

const PenaltyMockup = () => (
  <View style={styles.mockupPhone}>
    <View style={styles.mockupSettingsCard}>
      <View style={styles.mockupSettingRow}>
        <Ionicons name="time" size={24} color={COLORS.warmCoral} />
        <View style={styles.mockupSettingInfo}>
          <Text style={styles.mockupSettingTitle}>Ποινή Αδράνειας</Text>
          <Text style={styles.mockupSettingDesc}>-10 πόντοι / 24 ώρες</Text>
        </View>
        <View style={[styles.mockupSwitch, styles.mockupSwitchOn]}>
          <View style={[styles.mockupSwitchThumb, styles.mockupSwitchThumbOn]} />
        </View>
      </View>
      <Text style={styles.mockupSettingNote}>
        ⚠️ Το παιδί θα λάβει ειδοποίηση!
      </Text>
    </View>
  </View>
);

const GUIDE_PAGES = [
  {
    id: 1,
    icon: 'swap-horizontal',
    iconColor: COLORS.softBlue,
    bgColor: '#E3F2FD',
    title: 'Αλλαγή Χρήστη',
    description: 'Στην κορυφή της οθόνης υπάρχει το κουμπί αλλαγής χρήστη. Πατήστε το για να συνδεθεί το παιδί σας με το δικό του PIN!',
    MockupComponent: SwitchUserMockup,
  },
  {
    id: 2,
    icon: 'add-circle',
    iconColor: COLORS.softGreen,
    bgColor: '#E8F5E9',
    title: 'Προσθήκη Συνηθειών',
    description: 'Δημιουργήστε συνήθειες για τα παιδιά σας. Επιλέξτε από έτοιμες ή φτιάξτε δικές σας με πόντους και κατηγορίες!',
    MockupComponent: AddHabitMockup,
  },
  {
    id: 3,
    icon: 'checkmark-circle',
    iconColor: '#4CAF50',
    bgColor: '#E8F5E9',
    title: 'Έγκριση Δραστηριοτήτων',
    description: 'Όταν το παιδί ολοκληρώσει μια δραστηριότητα, μπορείτε να την εγκρίνετε ✅, να την απορρίψετε ❌ ή να ζητήσετε επανάληψη 🔄',
    MockupComponent: ApprovalMockup,
  },
  {
    id: 4,
    icon: 'gift',
    iconColor: '#E91E63',
    bgColor: '#FCE4EC',
    title: 'Σύστημα Επάθλων',
    description: 'Δημιουργήστε έπαθλα που τα παιδιά μπορούν να εξαργυρώσουν με τους πόντους τους. Μοναδικά ή επαναλαμβανόμενα!',
    MockupComponent: RewardsMockup,
  },
  {
    id: 5,
    icon: 'camera',
    iconColor: '#9C27B0',
    bgColor: '#F3E5F5',
    title: 'Ρυθμίσεις Avatar',
    description: 'Επιτρέψτε στα παιδιά να χρησιμοποιήσουν τη κάμερα για το avatar τους. Δωρεάν ή ως έπαθλο για 500 πόντους!',
    MockupComponent: AvatarSettingsMockup,
  },
  {
    id: 6,
    icon: 'time',
    iconColor: COLORS.warmCoral,
    bgColor: '#FFEBEE',
    title: 'Ποινή Αδράνειας',
    description: 'Ενεργοποιήστε την αφαίρεση πόντων αν το παιδί δεν κάνει δραστηριότητες για κάποιο διάστημα. Το παιδί ειδοποιείται αυτόματα!',
    MockupComponent: PenaltyMockup,
  },
];

export default function OnboardingGuide() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentPage < GUIDE_PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleFinish = async () => {
    // Mark onboarding as seen
    if (userId) {
      await AsyncStorage.setItem(`parent_onboarding_guide_seen_${userId}`, 'true');
    }
    router.replace('/parent/(tabs)');
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (pageIndex !== currentPage) {
          setCurrentPage(pageIndex);
        }
      },
    }
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📱 Οδηγός Εφαρμογής</Text>
        {currentPage < GUIDE_PAGES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Παράλειψη</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: scrollX.interpolate({
                  inputRange: [0, (GUIDE_PAGES.length - 1) * width],
                  outputRange: ['16.66%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentPage + 1} / {GUIDE_PAGES.length}
        </Text>
      </View>

      {/* Pages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {GUIDE_PAGES.map((page, index) => (
          <View key={page.id} style={styles.page}>
            <FeatureCard
              icon={page.icon}
              iconColor={page.iconColor}
              bgColor={page.bgColor}
              title={page.title}
              description={page.description}
              mockupContent={<page.MockupComponent />}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {GUIDE_PAGES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.3, 1],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [{ scale }],
                  opacity,
                  backgroundColor: GUIDE_PAGES[currentPage].iconColor,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: GUIDE_PAGES[currentPage].iconColor }]}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {currentPage === GUIDE_PAGES.length - 1 ? 'Ας Ξεκινήσουμε!' : 'Επόμενο'}
        </Text>
        <Ionicons
          name={currentPage === GUIDE_PAGES.length - 1 ? 'rocket' : 'arrow-forward'}
          size={20}
          color={COLORS.white}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.softBlue,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: width,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mockupContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  featureContent: {
    padding: 24,
    alignItems: 'center',
  },
  featureIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Mockup Styles
  mockupPhone: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockupHeaderLeft: {},
  mockupHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  mockupSwitchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupArrow: {
    alignItems: 'center',
    marginTop: 8,
  },
  mockupArrowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warmCoral,
    marginTop: 4,
  },
  mockupHabitList: {
    gap: 10,
  },
  mockupHabitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 12,
  },
  mockupAddItem: {
    backgroundColor: '#E3F2FD',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  mockupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  mockupHabitText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  mockupPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.softGreen,
  },
  mockupApprovalCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  mockupApprovalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mockupApprovalTitle: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  mockupApprovalHabit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  mockupApprovalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  mockupApprovalBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupRewardsList: {
    gap: 10,
  },
  mockupRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 12,
  },
  mockupRewardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mockupRewardName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  mockupRewardCost: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  mockupSettingsCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  mockupSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mockupSettingInfo: {
    flex: 1,
  },
  mockupSettingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  mockupSettingDesc: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  mockupSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  mockupSwitchOn: {
    backgroundColor: '#A5D6A7',
  },
  mockupSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  mockupSwitchThumbOn: {
    alignSelf: 'flex-end',
  },
  mockupSettingNote: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
