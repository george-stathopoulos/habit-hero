import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { approvalAPI, helpRequestsAPI } from '../../../src/services/api';

type TabType = 'pending' | 'history';

export default function ParentApprovals() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedHelp, setSelectedHelp] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const [pendingData, helpData, historyData] = await Promise.all([
        approvalAPI.getPending(),
        helpRequestsAPI.getAll(),
        approvalAPI.getHistory().catch(() => []),
      ]);
      setPending(pendingData);
      setHelpRequests(helpData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // Auto-refresh every 3 seconds when screen is focused
      const refreshInterval = setInterval(() => {
        loadData();
      }, 3000);
      
      return () => clearInterval(refreshInterval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (completionId: string) => {
    setProcessing(completionId);
    try {
      await approvalAPI.approve(completionId);
      setPending(pending.filter((p) => p.completion_id !== completionId));
      Alert.alert('✅ Επιτυχία', 'Η εργασία εγκρίθηκε! Το παιδί θα λάβει ειδοποίηση.');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (completionId: string) => {
    setProcessing(completionId);
    try {
      await approvalAPI.reject(completionId);
      setPending(pending.filter((p) => p.completion_id !== completionId));
      Alert.alert('❌ Απορρίφθηκε', 'Το παιδί θα λάβει ειδοποίηση να προσπαθήσει ξανά.');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleEncourageRetry = async (completionId: string) => {
    setProcessing(completionId);
    try {
      await approvalAPI.encourageRetry(completionId);
      setPending(pending.filter((p) => p.completion_id !== completionId));
      Alert.alert('💪 Ενθάρρυνση!', 'Το παιδί θα λάβει ένα ενθαρρυντικό μήνυμα να δοκιμάσει ξανά!');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openHelpDetail = (help: any) => {
    setSelectedHelp(help);
    setModalVisible(true);
  };

  const handleDismissHelp = async () => {
    if (!selectedHelp) return;
    
    setProcessing(selectedHelp.help_id);
    try {
      await helpRequestsAPI.resolve(selectedHelp.help_id);
      setHelpRequests(helpRequests.filter((h) => h.help_id !== selectedHelp.help_id));
      setModalVisible(false);
      setSelectedHelp(null);
      Alert.alert('Επιτυχία', 'Το αίτημα βοήθειας απορρίφθηκε.');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteOnBehalf = async () => {
    if (!selectedHelp) return;
    
    setProcessing(selectedHelp.help_id);
    try {
      const result = await helpRequestsAPI.completeOnBehalf(selectedHelp.help_id);
      setHelpRequests(helpRequests.filter((h) => h.help_id !== selectedHelp.help_id));
      setModalVisible(false);
      setSelectedHelp(null);
      Alert.alert('Επιτυχία', result.message || 'Η εργασία ολοκληρώθηκε!');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleHelpEncourageRetry = async () => {
    if (!selectedHelp) return;
    
    setProcessing(selectedHelp.help_id);
    try {
      const result = await helpRequestsAPI.encourageRetry(selectedHelp.help_id);
      setHelpRequests(helpRequests.filter((h) => h.help_id !== selectedHelp.help_id));
      setModalVisible(false);
      setSelectedHelp(null);
      Alert.alert('💪 Μήνυμα Στάλθηκε!', 'Το παιδί θα λάβει ένα ενθαρρυντικό μήνυμα να δοκιμάσει ξανά μόνο του!');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons 
            name="time" 
            size={18} 
            color={activeTab === 'pending' ? COLORS.white : COLORS.mediumGray} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Εκκρεμείς ({pending.length + helpRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={activeTab === 'history' ? COLORS.white : COLORS.mediumGray} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Ιστορικό
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pending' ? (
        <>
          {/* Help Requests Section */}
          {helpRequests.length > 0 && (
            <>
              <Text style={styles.headerTitle}>🆘 Αιτήματα Βοήθειας</Text>
              {helpRequests.map((item) => (
                <TouchableOpacity
                  key={item.help_id}
                  style={styles.helpCard}
                  onPress={() => openHelpDetail(item)}
                >
                  <View style={styles.helpCardHeader}>
                    <View style={styles.helpIconContainer}>
                      <Ionicons name="hand-left" size={24} color={COLORS.warmCoral} />
                    </View>
                    <View style={styles.helpCardInfo}>
                      <Text style={styles.childName}>{item.child_name}</Text>
                      <Text style={styles.helpHabitName}>{item.habit_name}</Text>
                      <Text style={styles.helpTime}>
                        {new Date(item.created_at).toLocaleString('el-GR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={styles.headerTitle}>Εκκρεμείς Εγκρίσεις</Text>

      {pending.length > 0 ? (
        pending.map((item) => (
          <View key={item.completion_id} style={styles.approvalCard}>
            <View style={styles.cardHeader}>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{item.child_name}</Text>
                <Text style={styles.date}>
                  {new Date(item.completed_at).toLocaleDateString('el-GR')}
                </Text>
              </View>
            </View>

            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{item.habit_name_el}</Text>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={14} color={COLORS.brightYellow} />
                <Text style={styles.pointsText}>{item.points} πόντοι</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.completion_id)}
                disabled={processing === item.completion_id}
              >
                <Ionicons name="close" size={18} color={COLORS.warmCoral} />
                <Text style={styles.rejectText}>Όχι</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={() => handleEncourageRetry(item.completion_id)}
                disabled={processing === item.completion_id}
              >
                <Ionicons name="refresh" size={18} color={COLORS.white} />
                <Text style={styles.retryText}>Ξανά!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item.completion_id)}
                disabled={processing === item.completion_id}
              >
                {processing === item.completion_id ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    <Text style={styles.approveText}>Ναι!</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle" size={64} color={COLORS.softGreen} />
          <Text style={styles.emptyTitle}>Όλα εντάξει!</Text>
          <Text style={styles.emptyText}>
            Δεν υπάρχουν εκκρεμείς εγκρίσεις
          </Text>
        </View>
      )}
        </>
      ) : (
        /* History Tab */
        <>
          <Text style={styles.headerTitle}>📋 Ιστορικό Εγκρίσεων</Text>
          {history.length > 0 ? (
            history.map((item) => {
              // Determine status style
              const getStatusStyle = () => {
                switch (item.status) {
                  case 'approved':
                    return { 
                      cardStyle: styles.historyApproved, 
                      badgeStyle: styles.statusApproved,
                      textStyle: styles.statusTextApproved,
                      icon: 'checkmark-circle',
                      color: COLORS.softGreen,
                      label: 'Εγκρίθηκε ✅'
                    };
                  case 'rejected':
                    return { 
                      cardStyle: styles.historyRejected, 
                      badgeStyle: styles.statusRejected,
                      textStyle: styles.statusTextRejected,
                      icon: 'close-circle',
                      color: COLORS.warmCoral,
                      label: 'Απορρίφθηκε ❌'
                    };
                  case 'retry_encouraged':
                    return { 
                      cardStyle: styles.historyRetry, 
                      badgeStyle: styles.statusRetry,
                      textStyle: styles.statusTextRetry,
                      icon: 'refresh-circle',
                      color: COLORS.softBlue,
                      label: 'Ξαναπροσπάθησε 💪'
                    };
                  default:
                    return { 
                      cardStyle: styles.historyApproved, 
                      badgeStyle: styles.statusApproved,
                      textStyle: styles.statusTextApproved,
                      icon: 'help-circle',
                      color: COLORS.mediumGray,
                      label: item.status
                    };
                }
              };
              
              const statusInfo = getStatusStyle();
              
              return (
                <View key={item.completion_id} style={[styles.historyCard, statusInfo.cardStyle]}>
                  <View style={styles.historyIconContainer}>
                    <Text style={styles.historyEmoji}>{item.habit_emoji}</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyChildName}>{item.child_name}</Text>
                    <Text style={styles.historyHabitName}>{item.habit_name_el}</Text>
                    <View style={styles.historyMeta}>
                      <View style={[styles.historyStatusBadge, statusInfo.badgeStyle]}>
                        <Ionicons 
                          name={statusInfo.icon as any} 
                          size={14} 
                          color={statusInfo.color} 
                        />
                        <Text style={[styles.historyStatusText, statusInfo.textStyle]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                      {item.status === 'approved' && (
                        <View style={styles.historyPointsBadge}>
                          <Ionicons name="star" size={12} color={COLORS.brightYellow} />
                          <Text style={styles.historyPointsText}>+{item.points_earned}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(item.completed_at).toLocaleString('el-GR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.mediumGray} />
              <Text style={styles.emptyTitle}>Κανένα ιστορικό</Text>
              <Text style={styles.emptyText}>
                Οι εγκρίσεις και απορρίψεις θα εμφανίζονται εδώ
              </Text>
            </View>
          )}
        </>
      )}

      {/* Help Request Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedHelp && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="hand-left" size={32} color={COLORS.warmCoral} />
                  </View>
                  <Text style={styles.modalTitle}>Αίτημα Βοήθειας</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Παιδί:</Text>
                    <Text style={styles.infoValue}>{selectedHelp.child_name}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Συνήθεια:</Text>
                    <Text style={styles.infoValue}>{selectedHelp.habit_name}</Text>
                  </View>

                  {selectedHelp.habit_description && (
                    <View style={styles.descriptionSection}>
                      <Text style={styles.descriptionLabel}>Περιγραφή:</Text>
                      <Text style={styles.descriptionText}>
                        {selectedHelp.habit_description}
                      </Text>
                    </View>
                  )}

                  {selectedHelp.parent_tip && (
                    <View style={styles.tipSection}>
                      <View style={styles.tipHeader}>
                        <Ionicons name="bulb" size={20} color={COLORS.brightYellow} />
                        <Text style={styles.tipLabel}>Συμβουλή για Γονείς</Text>
                      </View>
                      <Text style={styles.tipText}>{selectedHelp.parent_tip}</Text>
                    </View>
                  )}

                  <View style={styles.timeSection}>
                    <Ionicons name="time" size={16} color={COLORS.mediumGray} />
                    <Text style={styles.timeText}>
                      Ζητήθηκε: {new Date(selectedHelp.created_at).toLocaleString('el-GR')}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.dismissButton]}
                    onPress={handleDismissHelp}
                    disabled={processing === selectedHelp.help_id}
                  >
                    {processing === selectedHelp.help_id ? (
                      <ActivityIndicator size="small" color={COLORS.mediumGray} />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
                        <Text style={styles.dismissText}>Απόρριψη</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.retryButton]}
                    onPress={handleHelpEncourageRetry}
                    disabled={processing === selectedHelp.help_id}
                  >
                    {processing === selectedHelp.help_id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={20} color={COLORS.white} />
                        <Text style={styles.retryText}>Δοκίμασε!</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.completeButton]}
                    onPress={handleCompleteOnBehalf}
                    disabled={processing === selectedHelp.help_id}
                  >
                    {processing === selectedHelp.help_id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                        <Text style={styles.completeText}>Ολοκλήρωση</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    marginTop: 8,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.softBlue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  // Help Request Card Styles
  helpCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warmCoral,
  },
  helpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpCardInfo: {
    flex: 1,
  },
  helpHabitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 2,
  },
  helpTime: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  // Approval Card Styles
  approvalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  childInfo: {},
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  date: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  habitInfo: {
    marginBottom: 16,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  habitNameEn: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FFEBEB',
  },
  approveButton: {
    backgroundColor: COLORS.softGreen,
  },
  rejectText: {
    color: COLORS.warmCoral,
    fontWeight: '600',
  },
  approveText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  descriptionSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  tipSection: {
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 0,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  dismissButton: {
    backgroundColor: COLORS.lightGray,
  },
  retryButton: {
    backgroundColor: COLORS.softBlue,
  },
  completeButton: {
    backgroundColor: COLORS.softGreen,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  // History Card Styles
  historyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  historyApproved: {
    borderLeftColor: COLORS.softGreen,
  },
  historyRejected: {
    borderLeftColor: COLORS.warmCoral,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyEmoji: {
    fontSize: 24,
  },
  historyContent: {
    flex: 1,
  },
  historyChildName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.softBlue,
    marginBottom: 2,
  },
  historyHabitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusApproved: {
    backgroundColor: '#E8F8E8',
  },
  statusRejected: {
    backgroundColor: '#FFEBEB',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextApproved: {
    color: COLORS.softGreen,
  },
  statusTextRejected: {
    color: COLORS.warmCoral,
  },
  historyPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyPointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
});
