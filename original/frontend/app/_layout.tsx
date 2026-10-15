import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/colors';

export default function RootLayout() {
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.softBlue },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: COLORS.lightGray },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth/google-callback" options={{ headerShown: false }} />
        <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth/role-select" options={{ headerShown: false }} />
        <Stack.Screen name="auth/parent-pin" options={{ title: 'PIN Γονέα' }} />
        <Stack.Screen name="auth/parent-reauth" options={{ headerShown: false }} />
        <Stack.Screen name="auth/child-select" options={{ title: 'Επιλογή Παιδιού' }} />
        <Stack.Screen name="auth/child-pin" options={{ title: 'Εισαγωγή PIN' }} />
        <Stack.Screen name="auth/setup-pin" options={{ headerShown: false }} />
        <Stack.Screen name="auth/setup-child" options={{ headerShown: false }} />
        <Stack.Screen name="auth/setup-habits" options={{ headerShown: false }} />
        <Stack.Screen name="parent/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="child/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="child/introduction" options={{ headerShown: false }} />
        <Stack.Screen name="child/habit-detail" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/add-child" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/edit-child" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/change-pin" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/add-habit" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/edit-habit" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/manage-habits" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/child-onboarding" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="parent/child-analytics" options={{ headerShown: false }} />
        <Stack.Screen name="parent/about" options={{ headerShown: false }} />
        <Stack.Screen name="parent/danger-zone" options={{ headerShown: false }} />
        <Stack.Screen name="parent/analytics" options={{ headerShown: false }} />
        <Stack.Screen name="parent/points-history" options={{ headerShown: false }} />
        <Stack.Screen name="parent/introduction" options={{ headerShown: false }} />
        <Stack.Screen name="parent/theme-selector" options={{ headerShown: false }} />
        <Stack.Screen 
          name="parent/privacy-policy" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="parent/profile" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="parent/help-feedback" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="parent/onboarding-guide" options={{ headerShown: false }} />
        <Stack.Screen name="parent/child-settings" options={{ headerShown: false }} />
        <Stack.Screen name="auth/verify-pin" options={{ headerShown: false }} />
        <Stack.Screen name="auth/parent-onboarding-guide" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
