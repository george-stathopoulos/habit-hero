import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { AVATARS } from '../../src/constants/avatars';
import { useAuthStore } from '../../src/store/authStore';
import { authAPI } from '../../src/services/api';

interface ChildItem {
  child_id: string;
  name: string;
  avatar_id: number;
}

export default function ChildSelect() {
  const router = useRouter();
  const { parentId, familyInfo, setFamilyInfo } = useAuthStore();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      if (parentId) {
        const data = await authAPI.getFamilyInfo(parentId);
        setChildren(data.children);
        setFamilyInfo({
          parentId: data.parent.user_id,
          parentName: data.parent.name,
          children: data.children,
        });
      } else if (familyInfo?.children) {
        setChildren(familyInfo.children);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = (child: ChildItem) => {
    router.push({
      pathname: '/auth/child-pin',
      params: {
        childId: child.child_id,
        childName: child.name,
      },
    });
  };

  const getAvatar = (avatarId: number) => {
    return AVATARS.find(a => a.id === avatarId)?.image || '👋';
  };

  const renderChild = ({ item }: { item: ChildItem }) => (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() => handleSelectChild(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.avatar}>{getAvatar(item.avatar_id)}</Text>
      <Text style={styles.childName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={24} color={COLORS.mediumGray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brightYellow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="happy" size={48} color={COLORS.brightYellow} />
        </View>
        <Text style={styles.title}>Ποιος είσαι;</Text>
        <Text style={styles.subtitle}>Επίλεξε το όνομά σου</Text>
      </View>

      {children.length > 0 ? (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={(item) => item.child_id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle" size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>
            Δεν υπάρχουν ακόμα λογαριασμοί παιδιών
          </Text>
          <Text style={styles.emptySubtext}>
            Ζητήστε από τον γονέα σας να δημιουργήσει τον λογαριασμό σας
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={COLORS.mediumGray} />
        <Text style={styles.backButtonText}>Πίσω</Text>
      </TouchableOpacity>
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
    paddingBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  list: {
    paddingHorizontal: 24,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    fontSize: 40,
    marginRight: 16,
  },
  childName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
});
