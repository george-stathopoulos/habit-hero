import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/colors';
import { authAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

export default function GoogleCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setParentAuth, setFamilyInfo } = useAuthStore();
  const [status, setStatus] = useState('Επεξεργασία...');

  useEffect(() => {
    const handleCallback = async () => {
      let sessionId: string | null = null;
      
      // First try to get from expo router params
      if (params.session_id) {
        sessionId = params.session_id as string;
        console.log('Session ID from params:', sessionId);
      }
      
      // For web, also check URL directly
      if (!sessionId && Platform.OS === 'web') {
        const fullUrl = window.location.href;
        console.log('Full URL:', fullUrl);
        
        // Check hash fragment (e.g., #session_id=xxx)
        const hash = window.location.hash;
        if (hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0];
          console.log('Session ID from hash:', sessionId);
        }
        
        // Check query string (e.g., ?session_id=xxx)
        const query = window.location.search;
        if (query.includes('session_id=')) {
          sessionId = new URLSearchParams(query).get('session_id');
          console.log('Session ID from query:', sessionId);
        }
      }

      if (!sessionId) {
        console.error('No session_id found');
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε session. Παρακαλώ δοκιμάστε ξανά.');
        router.replace('/welcome');
        return;
      }
      
      console.log('Using session ID:', sessionId);

      setStatus('Σύνδεση...');
      
      try {
        const result = await authAPI.exchangeSession(sessionId);
        
        if (result.needs_pin_setup) {
          // New user - go to PIN setup
          setStatus('Νέος λογαριασμός! Ρύθμιση PIN...');
          router.replace({
            pathname: '/auth/setup-pin',
            params: {
              tempSessionId: sessionId,
              name: result.name,
              email: result.email,
            }
          });
        } else if (result.needs_pin_verification) {
          // Existing user - go to PIN verification
          setStatus('Υπάρχων λογαριασμός! Επαλήθευση...');
          
          // Always store/update family info with correct parent_id
          setFamilyInfo({
            parentId: result.user_id,
            parentName: result.name,
            children: result.children || [],
          });
          
          router.replace('/auth/role-select');
        } else {
          // Already authenticated
          router.replace('/parent/(tabs)');
        }
      } catch (error: any) {
        console.error('Auth error:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης. Παρακαλώ δοκιμάστε ξανά.');
        router.replace('/welcome');
      } finally {
        // Clear URL params
        if (Platform.OS === 'web') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleCallback();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>HabitHero</Text>
        <Text style={styles.status}>{status}</Text>
        <ActivityIndicator size="large" color={COLORS.softBlue} style={styles.loader} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.softBlue,
    marginBottom: 24,
  },
  status: {
    fontSize: 18,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  loader: {
    marginTop: 16,
  },
});
