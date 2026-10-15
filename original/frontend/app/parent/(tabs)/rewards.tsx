import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';
import { rewardsAPI, childrenAPI, redemptionAPI, loveCreditsAPI } from '../../../src/services/api';
import { AVATARS } from '../../../src/constants/avatars';
import { EmojiPicker } from '../../../src/components/EmojiPicker';

type TabType = 'rewards' | 'history';

export default function ParentRewards() {
  const [activeTab, setActiveTab] = useState<TabType>('rewards');
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [loveCreditsHistory, setLoveCreditsHistory] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);

  // New reward form
  const [newReward, setNewReward] = useState({
    name_el: '',
    description_el: '',
    points_cost: '50',
    emoji: '🎁',
    is_recurring: true,
  });

  // Edit reward form
  const [editReward, setEditReward] = useState({
    name_el: '',
    description_el: '',
    points_cost: '',
    emoji: '🎁',
    is_recurring: true,
  });

  const loadData = async () => {
    try {
      const [rewardsData, redemptionsData, historyData, childrenData, loveCreditsData] = await Promise.all([
        rewardsAPI.getAll(),
        rewardsAPI.getPendingRedemptions(),
        redemptionAPI.getHistory().catch(() => []),
        childrenAPI.getAll(),
        loveCreditsAPI.getHistory().catch(() => []),
      ]);
      setRewards(rewardsData || []);
      setRedemptions(redemptionsData || []);
      setRedemptionHistory(historyData || []);
      setChildren(childrenData || []);
      setLoveCreditsHistory(loveCreditsData || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateReward = async () => {
    if (!newReward.name_el.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα επάθλου');
      return;
    }

    const pointsCost = parseInt(newReward.points_cost);
    if (isNaN(pointsCost) || pointsCost < 10) {
      Alert.alert('Σφάλμα', 'Οι πόντοι πρέπει να είναι τουλάχιστον 10');
      return;
    }

    setSaving(true);
    try {
      await rewardsAPI.create({
        name_el: newReward.name_el,
        description_el: newReward.description_el,
        points_cost: pointsCost,
        emoji: newReward.emoji,
        is_recurring: newReward.is_recurring,
      });

      setShowAddModal(false);
      setNewReward({ name_el: '', description_el: '', points_cost: '50', emoji: '🎁', is_recurring: true });
      loadData();
      Alert.alert('Επιτυχία', 'Το έπαθλο δημιουργήθηκε!');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία δημιουργίας');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReward = (rewardId: string, name: string) => {
    Alert.alert(
      'Διαγραφή Επάθλου',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε το "${name}";`,
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await rewardsAPI.delete(rewardId);
              loadData();
            } catch (error) {
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής');
            }
          },
        },
      ]
    );
  };

  const handleEditReward = (reward: any) => {
    setEditingReward(reward);
    setEditReward({
      name_el: reward.name_el || '',
      description_el: reward.description_el || '',
      points_cost: String(reward.points_cost),
      emoji: reward.emoji || '🎁',
      is_recurring: reward.is_recurring !== false,
    });
    setShowEditModal(true);
  };

  const handleUpdateReward = async () => {
    if (!editReward.name_el.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα επάθλου');
      return;
    }

    const pointsCost = parseInt(editReward.points_cost);
    if (isNaN(pointsCost) || pointsCost < 10) {
      Alert.alert('Σφάλμα', 'Οι πόντοι πρέπει να είναι τουλάχιστον 10');
      return;
    }

    setSaving(true);
    try {
      await rewardsAPI.update(editingReward.reward_id, {
        name_el: editReward.name_el,
        description_el: editReward.description_el,
        points_cost: pointsCost,
        emoji: editReward.emoji,
        is_recurring: editReward.is_recurring,
      });

      setShowEditModal(false);
      setEditingReward(null);
      loadData();
      Alert.alert('Επιτυχία', 'Το έπαθλο ενημερώθηκε!');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία ενημέρωσης');
    } finally {
      setSaving(false);
    }
  };

  const handleFulfillRedemption = async (redemption: any) => {
    Alert.alert(
      '✅ Εκπλήρωση',
      `Εκπληρώσατε το "${redemption.reward_name}" για ${redemption.child_name};`,
      [
        { text: 'Όχι ακόμα', style: 'cancel' },
        {
          text: 'Ναι!',
          onPress: async () => {
            try {
              await rewardsAPI.fulfillRedemption(redemption.redemption_id);
              loadData();
              Alert.alert('Τέλεια!', `Το έπαθλο "${redemption.reward_name}" εκπληρώθηκε!`);
            } catch (error) {
              Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης');
            }
          },
        },
      ]
    );
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
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Ionicons 
            name="gift" 
            size={18} 
            color={activeTab === 'rewards' ? COLORS.white : COLORS.mediumGray} 
          />
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
            Έπαθλα
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time" 
            size={18} 
            color={activeTab === 'history' ? COLORS.white : COLORS.mediumGray} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Ιστορικό ({redemptionHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'rewards' ? (
        <>
          {/* Info Card about Recurring vs One-off */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.softBlue} />
              <Text style={styles.infoTitle}>Τύποι Επάθλων</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="repeat" size={16} color={COLORS.softGreen} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Επαναλαμβανόμενα:</Text> Μπορούν να εξαργυρωθούν πολλές φορές
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flash" size={16} color={COLORS.warmCoral} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Μοναδικά:</Text> Μια φορά μόνο (συνήθως πιο ακριβά)
              </Text>
            </View>
          </View>

          {/* Add New Reward Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.white} />
            <Text style={styles.addButtonText}>Δημιουργία Νέου Επάθλου</Text>
          </TouchableOpacity>

          {/* Pending Redemptions */}
          {redemptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎉 Εκκρεμείς Εξαργυρώσεις</Text>
              {redemptions.map((redemption) => (
                <TouchableOpacity
                  key={redemption.redemption_id}
                  style={styles.redemptionCard}
                  onPress={() => handleFulfillRedemption(redemption)}
                >
                  <View style={styles.redemptionInfo}>
                    <Text style={styles.redemptionChild}>{redemption.child_name}</Text>
                    <Text style={styles.redemptionReward}>{redemption.reward_name}</Text>
                    <Text style={styles.redemptionPoints}>
                      {redemption.points_spent} πόντοι
                    </Text>
                  </View>
                  <View style={styles.fulfillButton}>
                    <Ionicons name="checkmark-circle" size={32} color={COLORS.softGreen} />
                    <Text style={styles.fulfillText}>Εκπλήρωση</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Existing Rewards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Τα Έπαθλά σας</Text>
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <View key={reward.reward_id} style={styles.rewardCard}>
                  <Text style={styles.rewardEmoji}>{reward.emoji || '🎁'}</Text>
                  <View style={styles.rewardInfo}>
                    <View style={styles.rewardNameRow}>
                      <Text style={styles.rewardName}>{reward.name_el}</Text>
                      {reward.is_recurring === false && (
                        <View style={styles.oneOffBadge}>
                          <Ionicons name="flash" size={10} color={COLORS.white} />
                          <Text style={styles.oneOffText}>Μοναδικό</Text>
                        </View>
                      )}
                      {reward.is_recurring !== false && (
                        <View style={styles.recurringBadge}>
                          <Ionicons name="repeat" size={10} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                    {reward.description_el && (
                      <Text style={styles.rewardDescription}>{reward.description_el}</Text>
                    )}
                    <View style={styles.rewardCost}>
                      <Ionicons name="star" size={14} color={COLORS.brightYellow} />
                      <Text style={styles.costText}>{reward.points_cost} πόντοι</Text>
                    </View>
                  </View>
                  <View style={styles.rewardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditReward(reward)}
                    >
                      <Ionicons name="pencil" size={18} color={COLORS.softBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteReward(reward.reward_id, reward.name_el)}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.warmCoral} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyText}>
                  Δεν έχετε δημιουργήσει έπαθλα ακόμα
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        /* Redemption History Tab */
        <>
          <Text style={styles.headerTitle}>📜 Ιστορικό Εξαργυρώσεων</Text>
          {redemptionHistory.length > 0 ? (
            redemptionHistory.map((item) => (
              <View key={item.redemption_id} style={[
                styles.historyCard,
                item.fulfilled ? styles.historyFulfilled : styles.historyPending
              ]}>
                <View style={styles.historyIconContainer}>
                  <Text style={styles.historyEmoji}>{item.reward_emoji || '🎁'}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyChildName}>{item.child_name}</Text>
                  <Text style={styles.historyRewardName}>{item.reward_title}</Text>
                  <View style={styles.historyMeta}>
                    <View style={[
                      styles.historyStatusBadge,
                      item.fulfilled ? styles.statusFulfilled : styles.statusWaiting
                    ]}>
                      <Ionicons 
                        name={item.fulfilled ? 'checkmark-circle' : 'time'} 
                        size={14} 
                        color={item.fulfilled ? COLORS.softGreen : COLORS.brightYellow} 
                      />
                      <Text style={[
                        styles.historyStatusText,
                        item.fulfilled ? styles.statusTextFulfilled : styles.statusTextWaiting
                      ]}>
                        {item.fulfilled ? 'Εκπληρώθηκε' : 'Αναμονή'}
                      </Text>
                    </View>
                    <View style={styles.historyPointsBadge}>
                      <Ionicons name="star" size={12} color={COLORS.warmCoral} />
                      <Text style={styles.historyPointsText}>-{item.points_spent}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(item.redeemed_at).toLocaleString('el-GR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : null}
          
          {/* Love Credits History Section */}
          {loveCreditsHistory.length > 0 && (
            <>
              <Text style={[styles.headerTitle, { marginTop: 20 }]}>💝 Πόντοι Αγάπης</Text>
              {loveCreditsHistory.map((item, index) => (
                <View key={item.love_id || index} style={[styles.historyCard, styles.loveCreditsCard]}>
                  <View style={[styles.historyIconContainer, styles.loveCreditsIcon]}>
                    <Text style={styles.historyEmoji}>{item.icon_emoji || '💝'}</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyChildName}>Προς: {item.child_name}</Text>
                    <Text style={styles.historyRewardName}>
                      {item.message || 'Πόντοι αγάπης!'}
                    </Text>
                    <View style={styles.historyMeta}>
                      <View style={[styles.historyStatusBadge, styles.loveCreditsStatusBadge]}>
                        <Ionicons 
                          name={item.claimed ? 'checkmark-circle' : 'gift'} 
                          size={14} 
                          color={item.claimed ? COLORS.softGreen : '#E91E63'} 
                        />
                        <Text style={[styles.historyStatusText, styles.loveCreditsStatusText]}>
                          {item.claimed ? 'Παρελήφθη' : 'Αναμονή'}
                        </Text>
                      </View>
                      <View style={[styles.historyPointsBadge, styles.loveCreditsPointsBadge]}>
                        <Ionicons name="heart" size={12} color="#E91E63" />
                        <Text style={[styles.historyPointsText, styles.loveCreditsPointsText]}>+{item.amount}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(item.created_at).toLocaleString('el-GR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
          
          {redemptionHistory.length === 0 && loveCreditsHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.mediumGray} />
              <Text style={styles.emptyTitle}>Κανένα ιστορικό</Text>
              <Text style={styles.emptyText}>
                Οι εξαργυρώσεις επάθλων και οι πόντοι αγάπης θα εμφανίζονται εδώ
              </Text>
            </View>
          )}
        </>
      )}

      {/* Add Reward Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Νέο Έπαθλο</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Emoji Selector - Expandable Categories */}
              <EmojiPicker
                type="reward"
                selectedEmoji={newReward.emoji}
                onSelect={(emoji) => setNewReward({ ...newReward, emoji })}
              />

              <Text style={styles.inputLabel}>Όνομα Επάθλου *</Text>
              <TextInput
                style={styles.input}
                value={newReward.name_el}
                onChangeText={(text) => setNewReward({ ...newReward, name_el: text })}
                placeholder="π.χ. Βραδιά σινεμά"
                placeholderTextColor={COLORS.mediumGray}
              />

              <Text style={styles.inputLabel}>Περιγραφή</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={newReward.description_el}
                onChangeText={(text) => setNewReward({ ...newReward, description_el: text })}
                placeholder="π.χ. Μια βραδιά στο σινεμά με ποπκορν!"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
              />

              {/* Recurring Toggle */}
              <View style={styles.toggleSection}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={newReward.is_recurring ? "repeat" : "flash"} 
                    size={20} 
                    color={newReward.is_recurring ? COLORS.softGreen : COLORS.warmCoral} 
                  />
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>
                      {newReward.is_recurring ? 'Επαναλαμβανόμενο' : 'Μοναδικό (One-off)'}
                    </Text>
                    <Text style={styles.toggleHint}>
                      {newReward.is_recurring 
                        ? 'Το παιδί μπορεί να το πάρει πολλές φορές' 
                        : 'Μπορεί να εξαργυρωθεί μόνο μία φορά (συνήθως πιο ακριβό)'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={newReward.is_recurring}
                  onValueChange={(value) => setNewReward({ ...newReward, is_recurring: value })}
                  trackColor={{ false: COLORS.warmCoral, true: COLORS.softGreen }}
                  thumbColor={COLORS.white}
                />
              </View>

              <Text style={styles.inputLabel}>Κόστος σε Πόντους *</Text>
              <TextInput
                style={styles.input}
                value={newReward.points_cost}
                onChangeText={(text) => setNewReward({ ...newReward, points_cost: text })}
                placeholder="50"
                placeholderTextColor={COLORS.mediumGray}
                keyboardType="number-pad"
              />
              {!newReward.is_recurring && (
                <Text style={styles.oneOffHint}>
                  💡 Τα μοναδικά έπαθλα συνήθως έχουν υψηλότερο κόστος (π.χ. 100+ πόντοι)
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreateReward}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Δημιουργία</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Reward Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Επεξεργασία Επάθλου</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Emoji Selector - Expandable Categories */}
              <EmojiPicker
                type="reward"
                selectedEmoji={editReward.emoji}
                onSelect={(emoji) => setEditReward({ ...editReward, emoji })}
              />

              <Text style={styles.inputLabel}>Όνομα Επάθλου *</Text>
              <TextInput
                style={styles.input}
                value={editReward.name_el}
                onChangeText={(text) => setEditReward({ ...editReward, name_el: text })}
                placeholder="π.χ. Βραδιά σινεμά"
                placeholderTextColor={COLORS.mediumGray}
              />

              <Text style={styles.inputLabel}>Περιγραφή</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={editReward.description_el}
                onChangeText={(text) => setEditReward({ ...editReward, description_el: text })}
                placeholder="π.χ. Μια βραδιά στο σινεμά με ποπκορν!"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
              />

              {/* Recurring Toggle */}
              <View style={styles.toggleSection}>
                <View style={styles.toggleInfo}>
                  <Ionicons 
                    name={editReward.is_recurring ? "repeat" : "flash"} 
                    size={20} 
                    color={editReward.is_recurring ? COLORS.softGreen : COLORS.warmCoral} 
                  />
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>
                      {editReward.is_recurring ? 'Επαναλαμβανόμενο' : 'Μοναδικό (One-off)'}
                    </Text>
                    <Text style={styles.toggleHint}>
                      {editReward.is_recurring 
                        ? 'Το παιδί μπορεί να το πάρει πολλές φορές' 
                        : 'Μπορεί να εξαργυρωθεί μόνο μία φορά'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={editReward.is_recurring}
                  onValueChange={(value) => setEditReward({ ...editReward, is_recurring: value })}
                  trackColor={{ false: COLORS.warmCoral, true: COLORS.softGreen }}
                  thumbColor={COLORS.white}
                />
              </View>

              <Text style={styles.inputLabel}>Κόστος σε Πόντους *</Text>
              <TextInput
                style={styles.input}
                value={editReward.points_cost}
                onChangeText={(text) => setEditReward({ ...editReward, points_cost: text })}
                placeholder="50"
                placeholderTextColor={COLORS.mediumGray}
                keyboardType="number-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Άκυρο</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateReward}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Αποθήκευση</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
    marginTop: 8,
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
  historyFulfilled: {
    borderLeftColor: COLORS.softGreen,
  },
  historyPending: {
    borderLeftColor: COLORS.brightYellow,
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
  historyRewardName: {
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
  statusFulfilled: {
    backgroundColor: '#E8F8E8',
  },
  statusWaiting: {
    backgroundColor: '#FFF8E7',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextFulfilled: {
    color: COLORS.softGreen,
  },
  statusTextWaiting: {
    color: COLORS.brightYellow,
  },
  historyPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyPointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warmCoral,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  // Love Credits styles
  loveCreditsCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#E91E63',
    backgroundColor: '#FFF0F5',
  },
  loveCreditsIcon: {
    backgroundColor: '#FCE4EC',
  },
  loveCreditsStatusBadge: {
    backgroundColor: '#FCE4EC',
  },
  loveCreditsStatusText: {
    color: '#E91E63',
  },
  loveCreditsPointsBadge: {
    backgroundColor: '#FCE4EC',
  },
  loveCreditsPointsText: {
    color: '#E91E63',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.darkGray,
    flex: 1,
  },
  infoBold: {
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  redemptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.brightYellow,
  },
  redemptionInfo: {
    flex: 1,
  },
  redemptionChild: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  redemptionReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 2,
  },
  redemptionPoints: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  fulfillButton: {
    alignItems: 'center',
  },
  fulfillText: {
    fontSize: 10,
    color: COLORS.softGreen,
    marginTop: 4,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rewardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  oneOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmCoral,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  oneOffText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '600',
  },
  recurringBadge: {
    backgroundColor: COLORS.softGreen,
    padding: 4,
    borderRadius: 8,
  },
  rewardDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  dateAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateAvailabilityText: {
    fontSize: 11,
    color: COLORS.softBlue,
    fontStyle: 'italic',
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brightYellow,
  },
  rewardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  toggleHint: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  oneOffHint: {
    fontSize: 12,
    color: COLORS.warmCoral,
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  dateSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  dateSectionHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  datePickerPlaceholder: {
    color: COLORS.mediumGray,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: '#FFF8E7',
    borderWidth: 2,
    borderColor: COLORS.brightYellow,
  },
  emojiOptionText: {
    fontSize: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
