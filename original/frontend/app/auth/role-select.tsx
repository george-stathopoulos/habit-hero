import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { authAPI } from '../../src/services/api';

export default function RoleSelect() {
  const router = useRouter();
  const { familyInfo, parentId, parentLoggedOut, setFamilyInfo } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    loadFamilyInfo();
  }, []);

  const loadFamilyInfo = async () => {
    // If no parentId, redirect to welcome immediately
    if (!parentId) {
      const { clearFamily } = useAuthStore.getState();
      await clearFamily();
      router.replace('/welcome');
      return;
    }
    
    try {
      const data = await authAPI.getFamilyInfo(parentId);
      setFamilyInfo({
        parentId: data.parent.user_id,
        parentName: data.parent.name,
        children: data.children,
      });
      setChildren(data.children);
    } catch (error) {
      // Family no longer exists - clear local data and go to welcome (silent handling)
      const { clearFamily } = useAuthStore.getState();
      await clearFamily();
      router.replace('/welcome');
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleParentSelect = () => {
    // If parent explicitly logged out, require Google re-auth
    if (parentLoggedOut) {
      router.push('/auth/parent-reauth');
    } else {
      router.push('/auth/parent-pin');
    }
  };

  const handleChildSelect = () => {
    if (children.length === 0) {
      // No children yet, show message
      router.push('/auth/no-children');
    } else if (children.length === 1) {
      // Single child, go directly to PIN
      router.push({
        pathname: '/auth/child-pin',
        params: {
          childId: children[0].child_id,
          childName: children[0].name,
        },
      });
    } else {
      // Multiple children, show selection
      router.push('/auth/child-select');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏆</Text>
        <Text style={styles.title}>Habit Hero</Text>
        <Text style={styles.welcomeText}>
          Καλωσήρθατε πίσω, {familyInfo?.parentName?.split(' ')[0] || 'οικογένεια'}!
        </Text>
        <Text style={styles.subtitle}>Ποιος είστε;</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.roleButton, styles.parentButton]}
          onPress={handleParentSelect}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={40} color={COLORS.softBlue} />
          </View>
          <Text style={styles.roleTitle}>Είμαι Γονιός</Text>
          <Text style={styles.roleSubtitle}>I am a Parent</Text>
        </TouchableOpacity>

        {children.length > 0 && (
          <TouchableOpacity
            style={[styles.roleButton, styles.childButton]}
            onPress={handleChildSelect}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.childIconCircle]}>
              <Ionicons name="happy" size={40} color={COLORS.brightYellow} />
            </View>
            <Text style={styles.roleTitle}>Είμαι Παιδί</Text>
            <Text style={styles.roleSubtitle}>I am a Child</Text>
            <Text style={styles.childCount}>
              {children.length} {children.length === 1 ? 'παιδί' : 'παιδιά'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Για παιδιά και γονείς στην Ελλάδα 🇬🇷
        </Text>
      </View>
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
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.softBlue,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  buttonContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 20,
  },
  roleButton: {
    flex: 1,
    maxHeight: 200,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  parentButton: {
    borderWidth: 3,
    borderColor: COLORS.softBlue,
  },
  childButton: {
    borderWidth: 3,
    borderColor: COLORS.brightYellow,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  childIconCircle: {
    backgroundColor: '#FFF8E7',
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  childCount: {
    fontSize: 12,
    color: COLORS.brightYellow,
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});
