import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChildTheme } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { defaultTheme } from '../../../src/constants/themes';
import { useResponsiveScale } from '../../../src/components/ScaledComponents';

export default function ChildTabsLayout() {
  const router = useRouter();
  const { childId } = useAuthStore();
  const { theme } = useChildTheme(childId);
  const colors = theme?.colors || defaultTheme.colors;
  const { fs, sp, icon, isTablet } = useResponsiveScale();

  const handleLogout = () => {
    Alert.alert(
      '🚪 Αλλαγή Χρήστη',
      'Θέλεις να αλλάξεις χρήστη;',
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
      style={{ marginRight: sp(16), padding: sp(4) }}
    >
      <Ionicons name="log-out-outline" size={icon(24)} color={colors.headerTint} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground || colors.white,
          borderTopColor: colors.lightGray,
          height: sp(60),
          paddingBottom: sp(8),
          paddingTop: sp(8),
        },
        tabBarLabelStyle: {
          fontSize: fs(11),
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerTint,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: fs(17),
        },
        headerRight: () => <LogoutButton />,
        // Apply screen background color from theme
        contentStyle: {
          backgroundColor: colors.screenBackground || colors.lightGray,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Εργασίες',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Έπαθλα',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Πρόοδος',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: 'Επιτεύγματα',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Προφίλ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
