import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORY_COLORS } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { habitsAPI, childrenAPI, categoriesAPI } from '../../src/services/api';
import { AVATARS } from '../../src/constants/avatars';
import { EmojiPicker } from '../../src/components/EmojiPicker';
import { FrequencySelector, FrequencyType, WeeklyMode } from '../../src/components/FrequencySelector';

interface Category {
  id: string;
  name_el: string;
  color: string;
  emoji?: string;
  is_preset?: boolean;
}

interface Child {
  child_id: string;
  name: string;
  avatar_id: number;
  is_assigned?: boolean;
}

const VERIFICATION_TYPES = [
  { id: 'self_reported', label: 'Αυτοαναφορά', desc: 'Το παιδί σημειώνει ότι ολοκλήρωσε' },
  { id: 'parent_verified', label: 'Γονική επαλήθευση', desc: 'Απαιτεί έγκριση από γονέα' },
];

const CATEGORY_EMOJIS = ['📁', '🎯', '🏠', '🎮', '🎵', '🎨', '⚽', '📱', '🍎', '💡', '🎪', '🌈'];
const CATEGORY_COLOR_OPTIONS = [
  '#4A90E2', '#9B59B6', '#3498DB', '#E91E63', '#7ED321', 
  '#F5A623', '#27AE60', '#E67E22', '#1ABC9C', '#95A5A6',
  '#FF6B6B', '#8E44AD'
];

export default function EditHabit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [habit, setHabit] = useState<any>(null);
  
  // Form state
  const [nameEl, setNameEl] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [points, setPoints] = useState('10');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['general']);
  const [verificationType, setVerificationType] = useState('self_reported');
  const [emoji, setEmoji] = useState('⭐');
  const [descriptionEl, setDescriptionEl] = useState('');
  const [whyImportantEl, setWhyImportantEl] = useState('');
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4A90E2');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
  const [savingCategory, setSavingCategory] = useState(false);
  
  // Children for assignment
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
  const [originalAssignments, setOriginalAssignments] = useState<Set<string>>(new Set());
  
  // Frequency settings
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [weeklyMode, setWeeklyMode] = useState<WeeklyMode>('count');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([]);
  
  // Retry delay settings
  const [retryDelayValue, setRetryDelayValue] = useState<number | null>(null);
  const [retryDelayUnit, setRetryDelayUnit] = useState<'minutes' | 'hours' | 'days' | null>(null);

  // Tips section (collapsible)
  const [showTipsSection, setShowTipsSection] = useState(false);
  const [parentTipEl, setParentTipEl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Parse habit from params
      const habitParam = params.habit;
      if (!habitParam || typeof habitParam !== 'string') {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε η συνήθεια');
        router.back();
        return;
      }

      const habitData = JSON.parse(habitParam);
      setHabit(habitData);
      
      // Populate form
      setNameEl(habitData.name_el || '');
      setNameEn(habitData.name_en || '');
      setPoints(String(habitData.points || 10));
      setDescriptionEl(habitData.description_el || '');
      setWhyImportantEl(habitData.why_important_el || '');
      setParentTipEl(habitData.parent_tip_el || '');
      
      // Handle categories - support both single and multiple
      const cats = habitData.categories || [habitData.category || 'general'];
      setSelectedCategories(cats);
      
      setVerificationType(habitData.verification_type || 'self_reported');
      setEmoji(habitData.emoji || '⭐');
      setFrequencyType((habitData.frequency_type || 'daily') as FrequencyType);
      setFrequencyCount(habitData.frequency_count || 1);
      setWeeklyMode((habitData.weekly_mode || 'count') as WeeklyMode);
      setFrequencyDays(habitData.frequency_days || []);
      setRetryDelayValue(habitData.retry_delay_value || null);
      setRetryDelayUnit(habitData.retry_delay_unit || null);

      // Load categories and children
      const [categoriesData, childrenData] = await Promise.all([
        categoriesAPI.getAll(),
        childrenAPI.getAll(),
      ]);
      
      setCategories(categoriesData);
      setChildren(childrenData);

      // Check if we came from manage-habits with context about which child
      const fromChildId = params.fromChildId as string | undefined;
      const isAssignedToChild = params.isAssignedToChild === 'true';

      // Load current child assignments for this habit
      try {
        const assignments = await habitsAPI.getChildAssignments(habitData.habit_id);
        const assignedIds = new Set(
          assignments.filter((c: any) => c.is_assigned).map((c: any) => c.child_id)
        );
        
        // If coming from manage-habits and checkbox was selected, include that child
        if (fromChildId && isAssignedToChild) {
          assignedIds.add(fromChildId);
        }
        // If coming from manage-habits and checkbox was NOT selected, remove that child
        if (fromChildId && !isAssignedToChild) {
          assignedIds.delete(fromChildId);
        }
        
        setSelectedChildren(assignedIds);
        setOriginalAssignments(new Set(assignedIds));
      } catch (e) {
        // Habit might be new or preset without assignments
        console.log('No existing assignments found');
        
        // Still respect the context from manage-habits
        if (fromChildId && isAssignedToChild) {
          const newSet = new Set([fromChildId]);
          setSelectedChildren(newSet);
          setOriginalAssignments(new Set([fromChildId]));
        }
      }
      
    } catch (error) {
      console.error('Error loading habit:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση της συνήθειας');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const toggleChild = (childId: string) => {
    setSelectedChildren(prev => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const selectAllChildren = () => {
    setSelectedChildren(new Set(children.map(c => c.child_id)));
  };

  const deselectAllChildren = () => {
    setSelectedChildren(new Set());
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα κατηγορίας');
      return;
    }

    try {
      setSavingCategory(true);
      const newCategory = await categoriesAPI.create({
        name_el: newCategoryName.trim(),
        color: newCategoryColor,
        emoji: newCategoryEmoji,
      });
      
      setCategories(prev => [...prev, newCategory]);
      setSelectedCategories(prev => [...prev, newCategory.id]);
      setShowAddCategory(false);
      setNewCategoryName('');
      setNewCategoryColor('#4A90E2');
      setNewCategoryEmoji('📁');
    } catch (error: any) {
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία δημιουργίας κατηγορίας');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!habit) {
      Alert.alert('Σφάλμα', 'Δεν βρέθηκε η συνήθεια');
      return;
    }

    if (!nameEl.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το όνομα στα Ελληνικά');
      return;
    }

    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum < 1 || pointsNum > 100) {
      Alert.alert('Σφάλμα', 'Οι πόντοι πρέπει να είναι μεταξύ 1-100');
      return;
    }

    if (frequencyType === 'weekly' && weeklyMode === 'specific' && frequencyDays.length === 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε τουλάχιστον μία ημέρα');
      return;
    }

    setSaving(true);
    
    try {
      // Update habit
      const updateData: any = {
        name_el: nameEl.trim(),
        name_en: nameEn.trim() || nameEl.trim(),
        points: pointsNum,
        category: selectedCategories[0],
        categories: selectedCategories,
        verification_type: verificationType,
        emoji: emoji,
        frequency_type: frequencyType,
        frequency_count: frequencyCount,
        weekly_mode: weeklyMode,
        frequency_days: frequencyDays.length > 0 ? frequencyDays : undefined,
        description_el: descriptionEl.trim() || undefined,
        why_important_el: whyImportantEl.trim() || undefined,
        parent_tip_el: parentTipEl.trim() || undefined,
      };
      
      if (retryDelayValue && retryDelayUnit) {
        updateData.retry_delay_value = retryDelayValue;
        updateData.retry_delay_unit = retryDelayUnit;
      }
      
      const result = await habitsAPI.update(habit.habit_id, updateData);
      
      // Update child assignments if changed
      const currentAssignments = Array.from(selectedChildren);
      const originalArr = Array.from(originalAssignments);
      const assignmentsChanged = 
        currentAssignments.length !== originalArr.length ||
        !currentAssignments.every(id => originalAssignments.has(id));
      
      if (assignmentsChanged) {
        const habitIdToUse = result.habit_id || habit.habit_id;
        await habitsAPI.updateChildAssignments(habitIdToUse, currentAssignments);
      }
      
      Alert.alert('Επιτυχία', 'Η συνήθεια ενημερώθηκε!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Σφάλμα', error.message || 'Αποτυχία ενημέρωσης');
    } finally {
      setSaving(false);
    }
  };

  const getAvatarEmoji = (avatarId: number) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar?.image || '👤';
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || CATEGORY_COLORS[categoryId] || '#95A5A6';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.softBlue} />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Δεν βρέθηκε η συνήθεια</Text>
      </View>
    );
  }

  const isPreset = !habit.is_custom && !habit.parent_id;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {isPreset && (
          <View style={styles.presetNotice}>
            <Ionicons name="information-circle" size={20} color={COLORS.softBlue} />
            <Text style={styles.presetNoticeText}>
              Αυτή είναι μια προκαθορισμένη συνήθεια. Οι αλλαγές θα αποθηκευτούν ως προσαρμοσμένη έκδοση.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          {/* Emoji Selector - Expandable Categories */}
          <EmojiPicker
            type="habit"
            selectedEmoji={emoji}
            onSelect={setEmoji}
          />

          <Text style={styles.label}>Όνομα (Ελληνικά) *</Text>
          <TextInput
            style={styles.input}
            value={nameEl}
            onChangeText={setNameEl}
            placeholder="Π.χ. Διάβασμα βιβλίου"
            placeholderTextColor={COLORS.mediumGray}
          />

          <Text style={styles.label}>Πόντοι (1-100)</Text>
          <TextInput
            style={styles.input}
            value={points}
            onChangeText={setPoints}
            keyboardType="number-pad"
            maxLength={3}
          />

          {/* Categories Section - Multi-select */}
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Κατηγορίες (επιλέξτε 1 ή περισσότερες)</Text>
            <TouchableOpacity 
              style={styles.addCategoryButton}
              onPress={() => setShowAddCategory(true)}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.softBlue} />
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const catColor = cat.color || getCategoryColor(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    isSelected && { backgroundColor: catColor + '20', borderColor: catColor },
                    !isSelected && { borderColor: catColor + '60' },
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji || '📁'}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                      isSelected && { color: catColor },
                    ]}
                  >
                    {cat.name_el}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={catColor} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Children Assignment Section */}
          {children.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Ανάθεση σε παιδιά</Text>
                <View style={styles.childActions}>
                  <TouchableOpacity onPress={selectAllChildren} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Όλα</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deselectAllChildren} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Κανένα</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.childrenList}>
                {children.map((child) => {
                  const isSelected = selectedChildren.has(child.child_id);
                  const wasOriginallyAssigned = originalAssignments.has(child.child_id);
                  return (
                    <TouchableOpacity
                      key={child.child_id}
                      style={[
                        styles.childRow,
                        isSelected && styles.childRowSelected,
                      ]}
                      onPress={() => toggleChild(child.child_id)}
                    >
                      <Text style={styles.childAvatar}>{getAvatarEmoji(child.avatar_id)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.childName,
                          isSelected && styles.childNameSelected,
                        ]}>
                          {child.name}
                        </Text>
                        {wasOriginallyAssigned && !isSelected && (
                          <Text style={styles.willRemoveHint}>Θα αφαιρεθεί</Text>
                        )}
                        {!wasOriginallyAssigned && isSelected && (
                          <Text style={styles.willAddHint}>Θα προστεθεί</Text>
                        )}
                      </View>
                      <View style={[
                        styles.childCheckbox,
                        isSelected && styles.childCheckboxSelected,
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Τύπος Επαλήθευσης</Text>
          {VERIFICATION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.verificationOption,
                verificationType === type.id && styles.verificationOptionSelected,
              ]}
              onPress={() => setVerificationType(type.id)}
            >
              <View style={styles.radio}>
                {verificationType === type.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.verificationContent}>
                <Text style={styles.verificationLabel}>{type.label}</Text>
                <Text style={styles.verificationDesc}>{type.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Frequency Selector */}
          <FrequencySelector
            frequencyType={frequencyType}
            frequencyCount={frequencyCount}
            weeklyMode={weeklyMode}
            frequencyDays={frequencyDays}
            retryDelayValue={retryDelayValue}
            retryDelayUnit={retryDelayUnit}
            showRetryDelay={true}
            onFrequencyTypeChange={setFrequencyType}
            onFrequencyCountChange={setFrequencyCount}
            onWeeklyModeChange={setWeeklyMode}
            onFrequencyDaysChange={setFrequencyDays}
            onRetryDelayValueChange={setRetryDelayValue}
            onRetryDelayUnitChange={setRetryDelayUnit}
          />

          {/* Tips Section (collapsible) - Same as add-habit */}
          <TouchableOpacity 
            style={styles.tipsSectionHeader}
            onPress={() => setShowTipsSection(!showTipsSection)}
          >
            <View style={styles.tipsSectionTitle}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.softBlue} />
              <Text style={styles.tipsSectionTitleText}>Συμβουλές & Περιγραφή (προαιρετικά)</Text>
            </View>
            <Ionicons 
              name={showTipsSection ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>
          
          {showTipsSection && (
            <View style={styles.tipsContent}>
              <Text style={styles.tipsHint}>
                💡 Προσθέστε οδηγίες για το παιδί!
              </Text>
              
              <Text style={styles.tipsLabel}>Πώς να το κάνει (για το παιδί)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descriptionEl}
                onChangeText={setDescriptionEl}
                placeholder="π.χ. Βάλε το παιχνίδι σου στη θέση του μετά το παιχνίδι!"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
              />
              
              <Text style={styles.tipsLabel}>Γιατί είναι σημαντικό (για το παιδί)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={whyImportantEl}
                onChangeText={setWhyImportantEl}
                placeholder="π.χ. Έτσι το δωμάτιό σου μένει τακτοποιημένο και βρίσκεις εύκολα ό,τι θέλεις!"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
              />
              
              <Text style={styles.tipsLabel}>Συμβουλή για γονείς (μόνο για εσάς)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={parentTipEl}
                onChangeText={setParentTipEl}
                placeholder="π.χ. Μπορείτε να κάνετε τακτοποίηση μαζί σαν παιχνίδι!"
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          <Button
            title="Αποθήκευση Αλλαγών"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Νέα Κατηγορία</Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Όνομα κατηγορίας</Text>
            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Π.χ. Χόμπι"
              placeholderTextColor={COLORS.mediumGray}
            />

            <Text style={styles.modalLabel}>Εικονίδιο</Text>
            <View style={styles.emojiPickerRow}>
              {CATEGORY_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.emojiPickerItem,
                    newCategoryEmoji === e && styles.emojiPickerItemSelected,
                  ]}
                  onPress={() => setNewCategoryEmoji(e)}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Χρώμα</Text>
            <View style={styles.colorPickerRow}>
              {CATEGORY_COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorPickerItem,
                    { backgroundColor: color },
                    newCategoryColor === color && styles.colorPickerItemSelected,
                  ]}
                  onPress={() => setNewCategoryColor(color)}
                >
                  {newCategoryColor === color && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.modalLabel}>Προεπισκόπηση:</Text>
              <View style={[styles.categoryChip, { borderColor: newCategoryColor, backgroundColor: newCategoryColor + '20' }]}>
                <Text style={styles.categoryEmoji}>{newCategoryEmoji}</Text>
                <Text style={[styles.categoryLabel, styles.categoryLabelSelected, { color: newCategoryColor }]}>
                  {newCategoryName || 'Νέα κατηγορία'}
                </Text>
              </View>
            </View>

            <Button
              title="Προσθήκη Κατηγορίας"
              onPress={handleAddCategory}
              loading={savingCategory}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  presetNotice: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  presetNoticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.softBlue,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addCategoryButton: {
    padding: 4,
  },
  // Tips section styles (same as add-habit)
  tipsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  tipsSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsSectionTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  tipsContent: {
    backgroundColor: '#F8FBFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0EEFF',
  },
  tipsHint: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tipsLabel: {
    fontSize: 13,
    fontWeight: '600',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  emojiPreviewText: {
    fontSize: 48,
  },
  emojiScroll: {
    marginBottom: 8,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  emojiOptionText: {
    fontSize: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  categoryChipSelected: {
    borderWidth: 2,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  categoryLabelSelected: {
    fontWeight: '700',
  },
  // Children assignment styles
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  smallButtonText: {
    fontSize: 12,
    color: COLORS.softBlue,
    fontWeight: '500',
  },
  childrenList: {
    gap: 8,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childRowSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: COLORS.softBlue,
  },
  childAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  childName: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  childNameSelected: {
    fontWeight: '600',
    color: COLORS.softBlue,
  },
  willRemoveHint: {
    fontSize: 11,
    color: COLORS.warmCoral,
    fontStyle: 'italic',
  },
  willAddHint: {
    fontSize: 11,
    color: COLORS.softGreen,
    fontStyle: 'italic',
  },
  childCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childCheckboxSelected: {
    backgroundColor: COLORS.softGreen,
    borderColor: COLORS.softGreen,
  },
  verificationOption: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  verificationOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: COLORS.softBlue,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.softBlue,
  },
  verificationContent: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  verificationDesc: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  saveButton: {
    marginTop: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emojiPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPickerItemSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  colorPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorPickerItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerItemSelected: {
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
});
