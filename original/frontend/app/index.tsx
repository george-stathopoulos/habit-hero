import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../src/services/api';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated, role, hasFamily, userId, childId, sessionToken, clearFamily } = useAuthStore();
  const [splashComplete, setSplashComplete] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Show splash for at least 2 seconds
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Wait 2 seconds before allowing navigation
    const timer = setTimeout(() => {
      setSplashComplete(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkNavigation = async () => {
      // Wait for both splash and auth loading to complete
      if (!isLoading && splashComplete) {
        console.log('index.tsx: Navigation check - isAuthenticated:', isAuthenticated, 'hasFamily:', hasFamily, 'sessionToken:', !!sessionToken);
        
        if (isAuthenticated && sessionToken) {
          // Verify session is still valid before navigating
          try {
            if (role === 'parent') {
              await authAPI.getMe();
              console.log('index.tsx: Valid parent session, going to /parent/(tabs)');
              router.replace('/parent/(tabs)');
            } else if (role === 'child') {
              await authAPI.getChildMe();
              console.log('index.tsx: Valid child session, going to /child/(tabs)');
              router.replace('/child/(tabs)');
            }
          } catch (error) {
            // Session is invalid - clear everything and go to welcome
            console.log('index.tsx: Invalid session detected, clearing data...');
            await clearFamily();
            router.replace('/welcome');
          }
        } else if (hasFamily) {
          // Device has family registered, show role selection for PIN login
          console.log('index.tsx: hasFamily=true, going to /auth/role-select');
          router.replace('/auth/role-select');
        } else {
          // No family registered - show welcome/onboarding (this is the homepage for new users)
          console.log('index.tsx: No family, going to /welcome');
          router.replace('/welcome');
        }
      }
    };
    
    checkNavigation();
  }, [isLoading, isAuthenticated, role, hasFamily, userId, childId, splashComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.logo}>🏆</Text>
      <Text style={styles.title}>Habit Hero</Text>
      <Text style={styles.subtitle}>Ήρωας Συνηθειών</Text>
      <ActivityIndicator size="large" color={COLORS.white} style={styles.loader} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.9,
  },
  loader: {
    marginTop: 32,
  },
});
