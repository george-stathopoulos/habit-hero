import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HelpFeedback() {
  const router = useRouter();
  const { name, email } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ γράψτε ένα μήνυμα πριν το στείλετε.');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: message.trim(),
          sender_name: name,
          sender_email: email,
        }),
      });

      if (response.ok) {
        Alert.alert(
          '✅ Ευχαριστούμε!',
          'Το μήνυμά σας εστάλη επιτυχώς. Θα σας απαντήσουμε σύντομα!',
          [{ text: 'OK', onPress: () => setMessage('') }]
        );
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Αποτυχία αποστολής');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Αποτυχία αποστολής μηνύματος. Δοκιμάστε ξανά.';
      Alert.alert('Σφάλμα', errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Βοήθεια & Σχόλια</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Beta Banner */}
        <View style={styles.betaBanner}>
          <View style={styles.betaIconContainer}>
            <Ionicons name="flask" size={32} color="#FF6B00" />
          </View>
          <View style={styles.betaContent}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>BETA</Text>
            </View>
            <Text style={styles.betaTitle}>Δοκιμαστική Έκδοση</Text>
            <Text style={styles.betaDescription}>
              Το Habit Hero βρίσκεται ακόμα σε φάση ανάπτυξης. Εργαζόμαστε καθημερινά για να το κάνουμε καλύτερο!
            </Text>
          </View>
        </View>

        {/* Feedback Request Card */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="heart" size={28} color="#E91E63" />
            <Text style={styles.feedbackTitle}>Η γνώμη σας μετράει!</Text>
          </View>
          <Text style={styles.feedbackDescription}>
            Θα θέλαμε πολύ να ακούσουμε τις σκέψεις σας! Πείτε μας:
          </Text>
          <View style={styles.feedbackList}>
            <View style={styles.feedbackItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.softGreen} />
              <Text style={styles.feedbackItemText}>Τι σας αρέσει στην εφαρμογή</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="bulb" size={20} color="#FFC107" />
              <Text style={styles.feedbackItemText}>Ιδέες για νέες λειτουργίες</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="bug" size={20} color={COLORS.warmCoral} />
              <Text style={styles.feedbackItemText}>Προβλήματα που συναντήσατε</Text>
            </View>
            <View style={styles.feedbackItem}>
              <Ionicons name="star" size={20} color="#9C27B0" />
              <Text style={styles.feedbackItemText}>Οτιδήποτε άλλο θέλετε να μοιραστείτε</Text>
            </View>
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>Το μήνυμά σας</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Γράψτε εδώ τις σκέψεις, προτάσεις ή ερωτήσεις σας..."
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.messageHint}>
            Θα απαντήσουμε στο email: {email}
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendFeedback}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.white} />
              <Text style={styles.sendButtonText}>Αποστολή Μηνύματος</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Ionicons name="mail-outline" size={18} color={COLORS.mediumGray} />
          <Text style={styles.contactText}>
            Εναλλακτικά, μπορείτε να μας στείλετε email στο:{'\n'}
            <Text style={styles.contactEmail}>habit.hero.kids@gmail.com</Text>
          </Text>
        </View>

        {/* Thank You Note */}
        <View style={styles.thankYouNote}>
          <Text style={styles.thankYouEmoji}>🙏</Text>
          <Text style={styles.thankYouText}>
            Ευχαριστούμε που βοηθάτε να κάνουμε το Habit Hero καλύτερο για όλες τις οικογένειες!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  placeholder: {
    width: 40,
  },
  betaBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  betaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  betaContent: {
    flex: 1,
  },
  betaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  betaBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  betaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  betaDescription: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
  },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  feedbackDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  feedbackList: {
    gap: 10,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackItemText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  messageSection: {
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.darkGray,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },
  contactEmail: {
    color: COLORS.softBlue,
    fontWeight: '600',
  },
  thankYouNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  thankYouEmoji: {
    fontSize: 28,
  },
  thankYouText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
});
