import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { TouchableOpacity, Alert, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParentTheme } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { defaultTheme } from '../../../src/constants/themes';
import { rewardsAPI } from '../../../src/services/api';

export default function ParentTabsLayout() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { theme } = useParentTheme(userId);
  const colors = theme?.colors || defaultTheme.colors;
  const [pendingRedemptions, setPendingRedemptions] = useState(0);

  const checkPendingRedemptions = async () => {
    try {
      const result = await rewardsAPI.getPendingRedemptionsCount();
      setPendingRedemptions(result.count || 0);
    } catch (error) {
      // Silently fail
    }
  };

  // Check on mount and periodically
  useEffect(() => {
    checkPendingRedemptions();
    const interval = setInterval(checkPendingRedemptions, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Also refresh when tabs gain focus
  useFocusEffect(
    useCallback(() => {
      checkPendingRedemptions();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      '🚪 Αλλαγή Χρήστη',
      'Θέλετε να αλλάξετε χρήστη;',
      [
        { text: 'Όχι', style: 'cancel' },
        {
          text: 'Ναι',
          onPress: () => router.replace('/auth/role-select'),
        },
      ]
    );
  };

  const LogoutButton = () => (
    <TouchableOpacity 
      onPress={handleLogout}
      style={{ marginRight: 16, padding: 4 }}
    >
      <Ionicons name="log-out-outline" size={24} color={colors.headerTint} />
    </TouchableOpacity>
  );

  // Rewards icon with badge
  const RewardsIcon = ({ color, size }: { color: string; size: number }) => (
    <View>
      <Ionicons name="gift" size={size} color={color} />
      {pendingRedemptions > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      )}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.lightGray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerTint,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Αρχική',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Εγκρίσεις',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Συνήθειες',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Έπαθλα',
          tabBarIcon: ({ color, size }) => (
            <RewardsIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ρυθμίσεις',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90D9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
