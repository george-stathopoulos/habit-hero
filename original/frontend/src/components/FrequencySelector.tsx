import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'once';
export type WeeklyMode = 'count' | 'specific';
export type RetryDelayUnit = 'minutes' | 'hours' | 'days' | null;

interface FrequencySelectorProps {
  frequencyType: FrequencyType;
  frequencyCount: number;
  weeklyMode: WeeklyMode;
  frequencyDays: number[];
  retryDelayValue: number | null;
  retryDelayUnit: RetryDelayUnit;
  showRetryDelay?: boolean;
  onFrequencyTypeChange: (type: FrequencyType) => void;
  onFrequencyCountChange: (count: number) => void;
  onWeeklyModeChange: (mode: WeeklyMode) => void;
  onFrequencyDaysChange: (days: number[]) => void;
  onRetryDelayValueChange?: (value: number | null) => void;
  onRetryDelayUnitChange?: (unit: RetryDelayUnit) => void;
}

const FREQUENCY_TYPES: { id: FrequencyType; label: string; icon: string }[] = [
  { id: 'daily', label: 'Καθημερινά', icon: 'today' },
  { id: 'weekly', label: 'Εβδομαδιαία', icon: 'calendar' },
  { id: 'monthly', label: 'Μηνιαία', icon: 'calendar-outline' },
  { id: 'once', label: 'Μία φορά', icon: 'checkmark-done' },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Κ', fullLabel: 'Κυριακή' },
  { id: 1, label: 'Δ', fullLabel: 'Δευτέρα' },
  { id: 2, label: 'Τ', fullLabel: 'Τρίτη' },
  { id: 3, label: 'Τ', fullLabel: 'Τετάρτη' },
  { id: 4, label: 'Π', fullLabel: 'Πέμπτη' },
  { id: 5, label: 'Π', fullLabel: 'Παρασκευή' },
  { id: 6, label: 'Σ', fullLabel: 'Σάββατο' },
];

const RETRY_DELAY_OPTIONS: { value: number; unit: RetryDelayUnit; label: string }[] = [
  { value: 0, unit: null, label: 'Χωρίς καθυστέρηση' },
  { value: 15, unit: 'minutes', label: '15 λεπτά' },
  { value: 30, unit: 'minutes', label: '30 λεπτά' },
  { value: 1, unit: 'hours', label: '1 ώρα' },
  { value: 2, unit: 'hours', label: '2 ώρες' },
  { value: 1, unit: 'days', label: '1 ημέρα' },
];

export function FrequencySelector({
  frequencyType,
  frequencyCount,
  weeklyMode,
  frequencyDays,
  retryDelayValue,
  retryDelayUnit,
  showRetryDelay = false,
  onFrequencyTypeChange,
  onFrequencyCountChange,
  onWeeklyModeChange,
  onFrequencyDaysChange,
  onRetryDelayValueChange,
  onRetryDelayUnitChange,
}: FrequencySelectorProps) {
  
  const toggleDay = (dayId: number) => {
    if (frequencyDays.includes(dayId)) {
      onFrequencyDaysChange(frequencyDays.filter(d => d !== dayId));
    } else {
      onFrequencyDaysChange([...frequencyDays, dayId].sort());
    }
  };
  
  const handleRetryDelayChange = (option: typeof RETRY_DELAY_OPTIONS[0]) => {
    if (onRetryDelayValueChange && onRetryDelayUnitChange) {
      if (option.unit === null) {
        onRetryDelayValueChange(null);
        onRetryDelayUnitChange(null);
      } else {
        onRetryDelayValueChange(option.value);
        onRetryDelayUnitChange(option.unit);
      }
    }
  };
  
  const getSelectedRetryDelayLabel = () => {
    if (!retryDelayValue || !retryDelayUnit) return 'Χωρίς καθυστέρηση';
    const option = RETRY_DELAY_OPTIONS.find(
      o => o.value === retryDelayValue && o.unit === retryDelayUnit
    );
    return option?.label || 'Χωρίς καθυστέρηση';
  };

  const getPeriodLabel = () => {
    switch (frequencyType) {
      case 'daily': return 'ημέρα';
      case 'weekly': return 'εβδομάδα';
      case 'monthly': return 'μήνα';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Συχνότητα</Text>
      
      {/* Frequency Type Selector */}
      <View style={styles.typeSelector}>
        {FREQUENCY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeOption,
              frequencyType === type.id && styles.typeOptionSelected,
            ]}
            onPress={() => onFrequencyTypeChange(type.id)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={18} 
              color={frequencyType === type.id ? COLORS.white : COLORS.darkGray} 
            />
            <Text style={[
              styles.typeLabel,
              frequencyType === type.id && styles.typeLabelSelected,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Frequency Count (for daily, weekly, monthly) */}
      {frequencyType !== 'once' && (
        <View style={styles.countSection}>
          <Text style={styles.countLabel}>Πόσες φορές;</Text>
          <View style={styles.countRow}>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => onFrequencyCountChange(Math.max(1, frequencyCount - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
            
            <View style={styles.countDisplay}>
              <Text style={styles.countValue}>{frequencyCount}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => onFrequencyCountChange(Math.min(10, frequencyCount + 1))}
            >
              <Ionicons name="add" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
            
            <Text style={styles.countPeriod}>
              φορ{frequencyCount === 1 ? 'ά' : 'ές'} / {getPeriodLabel()}
            </Text>
          </View>
        </View>
      )}

      {/* Weekly Mode Selector */}
      {frequencyType === 'weekly' && (
        <View style={styles.weeklySection}>
          <Text style={styles.weeklyLabel}>Τρόπος εβδομαδιαίας επανάληψης:</Text>
          
          <View style={styles.weeklyModeSelector}>
            <TouchableOpacity
              style={[
                styles.weeklyModeOption,
                weeklyMode === 'count' && styles.weeklyModeSelected,
              ]}
              onPress={() => onWeeklyModeChange('count')}
            >
              <Ionicons 
                name="shuffle" 
                size={16} 
                color={weeklyMode === 'count' ? COLORS.softBlue : COLORS.mediumGray} 
              />
              <Text style={[
                styles.weeklyModeText,
                weeklyMode === 'count' && styles.weeklyModeTextSelected,
              ]}>
                Οποιαδήποτε μέρα
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.weeklyModeOption,
                weeklyMode === 'specific' && styles.weeklyModeSelected,
              ]}
              onPress={() => onWeeklyModeChange('specific')}
            >
              <Ionicons 
                name="calendar-number" 
                size={16} 
                color={weeklyMode === 'specific' ? COLORS.softBlue : COLORS.mediumGray} 
              />
              <Text style={[
                styles.weeklyModeText,
                weeklyMode === 'specific' && styles.weeklyModeTextSelected,
              ]}>
                Συγκεκριμένες μέρες
              </Text>
            </TouchableOpacity>
          </View>

          {/* Day Selector (only for specific mode) */}
          {weeklyMode === 'specific' && (
            <View style={styles.daySelector}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayOption,
                    frequencyDays.includes(day.id) && styles.dayOptionSelected,
                  ]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text style={[
                    styles.dayLabel,
                    frequencyDays.includes(day.id) && styles.dayLabelSelected,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Retry Delay Section (available for ALL habits) */}
      {showRetryDelay && (
        <View style={styles.retryDelaySection}>
          <Text style={styles.retryDelayLabel}>
            <Ionicons name="time-outline" size={16} color={COLORS.darkGray} /> Χρονικό διάστημα ανάμεσα στις προσπάθειες:
          </Text>
          <Text style={styles.retryDelayHint}>
            Πόση ώρα πρέπει να περάσει πριν το παιδί μπορέσει να ξαναολοκληρώσει αυτή τη συνήθεια
          </Text>
          <View style={styles.retryDelayOptions}>
            {RETRY_DELAY_OPTIONS.map((option, index) => {
              const isSelected = 
                (option.unit === null && !retryDelayUnit) ||
                (option.value === retryDelayValue && option.unit === retryDelayUnit);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.retryDelayOption,
                    isSelected && styles.retryDelayOptionSelected,
                  ]}
                  onPress={() => handleRetryDelayChange(option)}
                >
                  <Text style={[
                    styles.retryDelayOptionText,
                    isSelected && styles.retryDelayOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.softBlue} />
        <Text style={styles.summaryText}>
          {getSummaryText(frequencyType, frequencyCount, weeklyMode, frequencyDays)}
        </Text>
      </View>
    </View>
  );
}

function getSummaryText(
  frequencyType: FrequencyType,
  frequencyCount: number,
  weeklyMode: WeeklyMode,
  frequencyDays: number[]
): string {
  switch (frequencyType) {
    case 'daily':
      return frequencyCount === 1 
        ? 'Μία φορά την ημέρα' 
        : `${frequencyCount} φορές την ημέρα`;
    case 'weekly':
      if (weeklyMode === 'count') {
        return frequencyCount === 1 
          ? 'Μία φορά την εβδομάδα (οποιαδήποτε μέρα)'
          : `${frequencyCount} φορές την εβδομάδα (οποιαδήποτε μέρα)`;
      } else {
        const dayNames = frequencyDays
          .map(d => DAYS_OF_WEEK.find(day => day.id === d)?.fullLabel)
          .filter(Boolean)
          .join(', ');
        return dayNames ? `Κάθε ${dayNames}` : 'Επιλέξτε ημέρες';
      }
    case 'monthly':
      return frequencyCount === 1 
        ? 'Μία φορά τον μήνα'
        : `${frequencyCount} φορές τον μήνα`;
    case 'once':
      return 'Μόνο μία φορά (δεν επαναλαμβάνεται)';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  typeOptionSelected: {
    backgroundColor: COLORS.softBlue,
  },
  typeLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: COLORS.white,
  },
  countSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  countLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countDisplay: {
    width: 50,
    alignItems: 'center',
  },
  countValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.softBlue,
  },
  countPeriod: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 12,
  },
  weeklySection: {
    marginTop: 16,
  },
  weeklyLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  weeklyModeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  weeklyModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  weeklyModeSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  weeklyModeText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  weeklyModeTextSelected: {
    color: COLORS.softBlue,
    fontWeight: '600',
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOptionSelected: {
    backgroundColor: COLORS.softBlue,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  dayLabelSelected: {
    color: COLORS.white,
  },
  retryDelaySection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  retryDelayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  retryDelayHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
  retryDelayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  retryDelayOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  retryDelayOptionSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  retryDelayOptionText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  retryDelayOptionTextSelected: {
    color: '#FF9800',
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F4FD',
    borderRadius: 10,
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.softBlue,
  },
});
