import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

export default function PrivacyPolicy() {
  const router = useRouter();
  const [language, setLanguage] = useState<'el' | 'en'>('el');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const BulletPoint = ({ emoji, text }: { emoji: string; text: string }) => (
    <View style={styles.bulletPoint}>
      <Text style={styles.bulletEmoji}>{emoji}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

  // Content based on language
  const content = {
    el: {
      title: 'Πολιτική Απορρήτου',
      lastUpdated: 'Τελευταία ενημέρωση: Φεβρουάριος 2026',
      intro: 'Η εφαρμογή Habit Hero σέβεται το απόρρητό σας και δεσμεύεται να προστατεύει τα προσωπικά σας δεδομένα.',
      dataCollected: '📋 Δεδομένα που Συλλέγουμε',
      parentData: 'Δεδομένα Γονέων',
      childData: 'Δεδομένα Παιδιών',
      howWeUse: '✅ Πώς Χρησιμοποιούμε τα Δεδομένα',
      dontDo: '❌ ΔΕΝ Κάνουμε',
      childProtection: '👨‍👩‍👧 Προστασία Παιδιών',
      thirdParty: '🔗 Υπηρεσίες Τρίτων',
      rights: '⚖️ Τα Δικαιώματά σας',
      security: '🔒 Ασφάλεια',
      contact: '📧 Επικοινωνία',
      parentDataItems: [
        { emoji: '📧', text: 'Email: Για σύνδεση και αποστολή magic links' },
        { emoji: '👤', text: 'Όνομα: Για εξατομίκευση' },
        { emoji: '🔐', text: 'PIN: Αποθηκεύεται κρυπτογραφημένο' },
        { emoji: '📷', text: 'Φωτογραφία/Avatar: Αποθηκεύεται ΜΟΝΟ τοπικά στη συσκευή' },
      ],
      childDataItems: [
        { emoji: '👶', text: 'Όνομα, ηλικία, φύλο' },
        { emoji: '🎭', text: 'Avatar/Φωτογραφία (αποθηκεύεται τοπικά)' },
        { emoji: '⭐', text: 'Πόντοι και επιτεύγματα' },
      ],
      useItems: [
        { emoji: '✓', text: 'Λειτουργία της εφαρμογής' },
        { emoji: '✓', text: 'Αποστολή συνδέσμων σύνδεσης' },
        { emoji: '✓', text: 'Push ειδοποιήσεις (προαιρετικά)' },
        { emoji: '✓', text: 'Απάντηση στα σχόλιά σας' },
      ],
      dontItems: [
        { emoji: '🚫', text: 'Διαφημίσεις' },
        { emoji: '🚫', text: 'Πώληση δεδομένων' },
        { emoji: '🚫', text: 'Marketing χωρίς συγκατάθεση' },
      ],
      childProtectionItems: [
        { emoji: '👨‍👩‍👧', text: 'Λογαριασμοί παιδιών μόνο από γονείς' },
        { emoji: '🔒', text: 'Δεν υπάρχει κοινοποίηση εκτός οικογένειας' },
        { emoji: '📵', text: 'Καμία επικοινωνία με τρίτους' },
        { emoji: '📷', text: 'Φωτογραφίες ΜΟΝΟ στη συσκευή' },
      ],
      rightsItems: [
        { emoji: '👁️', text: 'Δείτε τα δεδομένα σας στην εφαρμογή' },
        { emoji: '✏️', text: 'Διορθώστε όνομα, PIN, avatar κλπ.' },
        { emoji: '🗑️', text: 'Διαγράψτε λογαριασμό (Ρυθμίσεις → Ζώνη Κινδύνου)' },
      ],
      securityItems: [
        { emoji: '🔐', text: 'Κρυπτογράφηση SSL/TLS' },
        { emoji: '🔑', text: 'Hashing για PIN' },
        { emoji: '📱', text: 'Τοπική αποθήκευση φωτογραφιών' },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: February 2026',
      intro: 'Habit Hero respects your privacy and is committed to protecting your personal data.',
      dataCollected: '📋 Data We Collect',
      parentData: 'Parent Data',
      childData: 'Children Data',
      howWeUse: '✅ How We Use Data',
      dontDo: '❌ What We DON\'T Do',
      childProtection: '👨‍👩‍👧 Children\'s Privacy',
      thirdParty: '🔗 Third-Party Services',
      rights: '⚖️ Your Rights',
      security: '🔒 Security',
      contact: '📧 Contact',
      parentDataItems: [
        { emoji: '📧', text: 'Email: For login and magic links' },
        { emoji: '👤', text: 'Name: To personalize experience' },
        { emoji: '🔐', text: 'PIN: Stored encrypted' },
        { emoji: '📷', text: 'Photo/Avatar: Stored ONLY locally on device' },
      ],
      childDataItems: [
        { emoji: '👶', text: 'Name, age, gender' },
        { emoji: '🎭', text: 'Avatar/Photo (stored locally)' },
        { emoji: '⭐', text: 'Points and achievements' },
      ],
      useItems: [
        { emoji: '✓', text: 'Operate the app' },
        { emoji: '✓', text: 'Send login links' },
        { emoji: '✓', text: 'Push notifications (optional)' },
        { emoji: '✓', text: 'Respond to your feedback' },
      ],
      dontItems: [
        { emoji: '🚫', text: 'Advertisements' },
        { emoji: '🚫', text: 'Selling data' },
        { emoji: '🚫', text: 'Marketing without consent' },
      ],
      childProtectionItems: [
        { emoji: '👨‍👩‍👧', text: 'Child accounts only by parents' },
        { emoji: '🔒', text: 'No sharing outside family' },
        { emoji: '📵', text: 'No communication with others' },
        { emoji: '📷', text: 'Photos ONLY on device' },
      ],
      rightsItems: [
        { emoji: '👁️', text: 'View your data in the app' },
        { emoji: '✏️', text: 'Edit name, PIN, avatar, etc.' },
        { emoji: '🗑️', text: 'Delete account (Settings → Danger Zone)' },
      ],
      securityItems: [
        { emoji: '🔐', text: 'SSL/TLS encryption' },
        { emoji: '🔑', text: 'PIN hashing' },
        { emoji: '📱', text: 'Local photo storage' },
      ],
    },
  };

  const c = content[language];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{c.title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Language Toggle */}
      <View style={styles.languageToggle}>
        <TouchableOpacity
          style={[styles.langButton, language === 'el' && styles.langButtonActive]}
          onPress={() => setLanguage('el')}
        >
          <Text style={[styles.langText, language === 'el' && styles.langTextActive]}>🇬🇷 Ελληνικά</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, language === 'en' && styles.langButtonActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>🇬🇧 English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <Text style={styles.lastUpdated}>{c.lastUpdated}</Text>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.softGreen} />
          <Text style={styles.introText}>{c.intro}</Text>
        </View>

        {/* Data Collection */}
        <Section title={c.dataCollected}>
          <Text style={styles.subTitle}>{c.parentData}</Text>
          {c.parentDataItems.map((item, i) => (
            <BulletPoint key={`parent-${i}`} emoji={item.emoji} text={item.text} />
          ))}
          
          <Text style={[styles.subTitle, { marginTop: 16 }]}>{c.childData}</Text>
          {c.childDataItems.map((item, i) => (
            <BulletPoint key={`child-${i}`} emoji={item.emoji} text={item.text} />
          ))}
        </Section>

        {/* How We Use Data */}
        <Section title={c.howWeUse}>
          {c.useItems.map((item, i) => (
            <BulletPoint key={`use-${i}`} emoji={item.emoji} text={item.text} />
          ))}
        </Section>

        {/* What We Don't Do */}
        <Section title={c.dontDo}>
          <View style={styles.dontDoCard}>
            {c.dontItems.map((item, i) => (
              <BulletPoint key={`dont-${i}`} emoji={item.emoji} text={item.text} />
            ))}
          </View>
        </Section>

        {/* Children's Privacy */}
        <Section title={c.childProtection}>
          <View style={styles.childrenCard}>
            {c.childProtectionItems.map((item, i) => (
              <BulletPoint key={`child-prot-${i}`} emoji={item.emoji} text={item.text} />
            ))}
          </View>
        </Section>

        {/* Third Party Services */}
        <Section title={c.thirdParty}>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Brevo</Text>
            <Text style={styles.serviceDesc}>{language === 'el' ? 'Αποστολή emails' : 'Sending emails'}</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Google OAuth</Text>
            <Text style={styles.serviceDesc}>{language === 'el' ? 'Σύνδεση με Google (προαιρετικό)' : 'Google sign-in (optional)'}</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Expo Push</Text>
            <Text style={styles.serviceDesc}>{language === 'el' ? 'Ειδοποιήσεις' : 'Notifications'}</Text>
          </View>
        </Section>

        {/* Your Rights */}
        <Section title={c.rights}>
          {c.rightsItems.map((item, i) => (
            <BulletPoint key={`rights-${i}`} emoji={item.emoji} text={item.text} />
          ))}
        </Section>

        {/* Security */}
        <Section title={c.security}>
          {c.securityItems.map((item, i) => (
            <BulletPoint key={`sec-${i}`} emoji={item.emoji} text={item.text} />
          ))}
        </Section>

        {/* Contact */}
        <Section title={c.contact}>
          <View style={styles.contactCard}>
            <Ionicons name="mail" size={24} color={COLORS.softBlue} />
            <Text style={styles.contactEmail}>habit.hero.kids@gmail.com</Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Habit Hero. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  placeholder: {
    width: 40,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  langButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: COLORS.softBlue,
  },
  langText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  langTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bulletEmoji: {
    fontSize: 14,
    width: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  dontDoCard: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  childrenCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  serviceDesc: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 8,
    gap: 10,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
});
