import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../../src/constants/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const screenWidth = Dimensions.get('window').width;

// Stat explanations
const STAT_EXPLANATIONS = {
  completions: {
    title: '✅ Ολοκληρώσεις',
    message: 'Ο αριθμός των συνηθειών που το παιδί ολοκλήρωσε επιτυχώς στην επιλεγμένη περίοδο.\n\nΚάθε φορά που το παιδί πατάει "Το έκανα!" και εγκρίνεται (αν χρειάζεται), μετράει ως μία ολοκλήρωση.',
  },
  points: {
    title: '⭐ Πόντοι από Συνήθειες',
    message: 'Οι πόντοι που κέρδισε το παιδί από την ολοκλήρωση συνηθειών.\n\nΚάθε συνήθεια έχει συγκεκριμένους πόντους (5-20) ανάλογα με τη δυσκολία της. Οι πόντοι προστίθενται αυτόματα μετά την έγκριση.',
  },
  help: {
    title: '🤝 Αιτήματα Βοήθειας',
    message: 'Πόσες φορές το παιδί ζήτησε βοήθεια από εσάς για μια συνήθεια.\n\nΌταν το παιδί πατήσει "Χρειάζομαι βοήθεια", λαμβάνετε ειδοποίηση. Αυτό δείχνει ποιες συνήθειες χρειάζονται περισσότερη υποστήριξη.',
  },
  postponed: {
    title: '⏰ Αναβολές',
    message: 'Πόσες φορές το παιδί επέλεξε "Αργότερα" αντί να ολοκληρώσει μια συνήθεια.\n\nΗ εφαρμογή υπενθυμίζει μετά από 30 λεπτά. Πολλές αναβολές μπορεί να σημαίνουν ότι η ώρα ή η συνήθεια χρειάζεται αναπροσαρμογή.',
  },
  love: {
    title: '💕 Love Credits',
    message: 'Τα Love Credits είναι έξτρα πόντοι που δίνετε εσείς ως γονέας για να επιβραβεύσετε την προσπάθεια, τη συμπεριφορά ή απλά για να δείξετε την αγάπη σας.\n\nΠροστίθενται στο υπόλοιπο του παιδιού και μπορούν να εξαργυρωθούν σε έπαθλα.',
  },
  pointsFromHabits: {
    title: '⭐ Πόντοι από Συνήθειες',
    message: 'Το σύνολο των πόντων που κέρδισε το παιδί από την ολοκλήρωση συνηθειών από την αρχή.\n\nΥπολογίζεται αυτόματα: κάθε συνήθεια δίνει 5-20 πόντους ανάλογα με τη δυσκολία.',
  },
  loveCreditsAll: {
    title: '💕 Συνολικά Love Credits',
    message: 'Το σύνολο των Love Credits που έχετε δώσει στο παιδί από την αρχή.\n\nΤα Love Credits είναι πόντοι αγάπης που προσθέτετε χειροκίνητα για να επιβραβεύσετε επιπλέον προσπάθειες.',
  },
  totalEarned: {
    title: '📊 Σύνολο Κερδισμένων',
    message: 'Το άθροισμα όλων των πόντων που έχει κερδίσει το παιδί:\n\n• Πόντοι από συνήθειες\n• Love Credits από εσάς\n\nΑυτό είναι το συνολικό "εισόδημα" πόντων.',
  },
  pointsSpent: {
    title: '🎁 Πόντοι που Ξοδεύτηκαν',
    message: 'Οι πόντοι που το παιδί έχει εξαργυρώσει για έπαθλα (rewards).\n\nΌταν το παιδί ζητάει ένα έπαθλο και εσείς το εγκρίνετε, οι αντίστοιχοι πόντοι αφαιρούνται από το υπόλοιπό του.',
  },
  currentBalance: {
    title: '💎 Τρέχον Υπόλοιπο',
    message: 'Οι διαθέσιμοι πόντοι που έχει το παιδί αυτή τη στιγμή.\n\nΥπολογισμός:\nΠόντοι από συνήθειες + Love Credits - Έπαθλα = Υπόλοιπο\n\nΜε αυτούς τους πόντους μπορεί να ζητήσει νέα έπαθλα!',
  },
};

// Helper function to show stat explanation
const showStatExplanation = (statKey: keyof typeof STAT_EXPLANATIONS) => {
  const explanation = STAT_EXPLANATIONS[statKey];
  if (explanation) {
    Alert.alert(explanation.title, explanation.message, [{ text: 'Κατάλαβα!' }]);
  }
};

// Date range options
const DATE_RANGES = [
  { label: '7 ημέρες', days: 7 },
  { label: '15 ημέρες', days: 15 },
  { label: '30 ημέρες', days: 30 },
  { label: '3 μήνες', days: 90 },
  { label: '6 μήνες', days: 180 },
  { label: '12 μήνες', days: 365 },
];

// Category translations
const CATEGORY_NAMES: { [key: string]: string } = {
  hygiene: 'Υγιεινή',
  health: 'Υγεία',
  education: 'Εκπαίδευση',
  responsibility: 'Υπευθυνότητα',
  social: 'Κοινωνικά',
  organization: 'Οργάνωση',
  creativity: 'Δημιουργικότητα',
  physical: 'Σωματική Άσκηση',
  general: 'Γενικά',
};

// Category colors for pie chart
const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialChildIds = params.childIds ? String(params.childIds).split(',') : [];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(initialChildIds);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'suggestions'>('overview');

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildIds.length > 0) {
      loadAnalytics();
    }
  }, [selectedChildIds, selectedDays]);

  const loadChildren = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/children`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const childList = data.children || data || [];
        setChildren(childList);
        
        // If no initial selection, select all children
        if (selectedChildIds.length === 0 && childList.length > 0) {
          setSelectedChildIds(childList.map((c: any) => c.child_id));
        }
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadAnalytics = async () => {
    if (selectedChildIds.length === 0) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/parent/comprehensive-analytics?child_ids=${selectedChildIds.join(',')}&days=${selectedDays}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalytics();
  }, [selectedChildIds, selectedDays]);

  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds(prev => {
      if (prev.includes(childId)) {
        return prev.filter(id => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  const getLineChartData = () => {
    if (!analyticsData || !analyticsData.children || analyticsData.children.length === 0) {
      return null;
    }

    // Aggregate data or show individual lines based on compare mode
    if (compareMode && analyticsData.children.length > 1) {
      // Multiple datasets for comparison
      const datasets = analyticsData.children.map((child: any, index: number) => ({
        data: child.daily_trend?.map((d: any) => d.completions) || [0],
        color: () => CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        strokeWidth: 2,
      }));

      const labels = analyticsData.children[0]?.daily_trend?.map((d: any) => {
        const date = new Date(d.date + 'T00:00:00');
        return date.toLocaleDateString('el-GR', { day: 'numeric' });
      }) || [];

      return {
        labels: labels.filter((_: any, i: number) => i % Math.ceil(labels.length / 7) === 0),
        datasets,
        legend: analyticsData.children.map((c: any) => c.child_name),
      };
    } else {
      // Single aggregated line
      const aggregatedData: { [key: string]: number } = {};
      
      analyticsData.children.forEach((child: any) => {
        child.daily_trend?.forEach((day: any) => {
          if (!aggregatedData[day.date]) {
            aggregatedData[day.date] = 0;
          }
          aggregatedData[day.date] += day.completions;
        });
      });

      const sortedDates = Object.keys(aggregatedData).sort();
      const labels = sortedDates.map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('el-GR', { day: 'numeric' });
      });

      // Show fewer labels for readability
      const filteredLabels = labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0);

      return {
        labels: filteredLabels,
        datasets: [{
          data: sortedDates.map(d => aggregatedData[d]),
          color: () => COLORS.softBlue,
          strokeWidth: 2,
        }],
      };
    }
  };

  const getPieChartData = () => {
    if (!analyticsData || !analyticsData.children) return [];

    const categoryTotals: { [key: string]: number } = {};
    
    analyticsData.children.forEach((child: any) => {
      child.category_breakdown?.forEach((cat: any) => {
        const category = cat.category;
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += cat.completions;
      });
    });

    return Object.entries(categoryTotals).map(([category, count], index) => ({
      name: CATEGORY_NAMES[category] || category,
      count: count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      legendFontColor: COLORS.darkGray,
      legendFontSize: 12,
    }));
  };

  const getBarChartData = () => {
    if (!analyticsData || !analyticsData.comparison) return null;

    return {
      labels: analyticsData.comparison.completion_rates.map((c: any) => c.name.substring(0, 6)),
      datasets: [{
        data: analyticsData.comparison.total_points.map((c: any) => c.value),
      }],
    };
  };

  const getTotalStats = () => {
    if (!analyticsData || !analyticsData.children) {
      return { completions: 0, points: 0, help: 0, postponed: 0, love: 0 };
    }

    let completions = 0, points = 0, help = 0, postponed = 0, love = 0;
    
    analyticsData.children.forEach((child: any) => {
      completions += child.summary?.total_completions || 0;
      points += child.summary?.total_points_earned || 0;
      help += child.summary?.total_help_requests || 0;
      postponed += child.summary?.total_postponed || 0;
      love += child.summary?.love_credits_received || 0;
    });

    return { completions, points, help, postponed, love };
  };

  // Get all-time breakdown for each child
  const getAllTimeBreakdown = () => {
    if (!analyticsData || !analyticsData.children) return [];
    
    return analyticsData.children.map((child: any) => ({
      name: child.child_name,
      pointsFromHabits: child.all_time?.points_from_habits || 0,
      loveCreditsReceived: child.all_time?.love_credits_received || 0,
      totalEarned: child.all_time?.total_earned || 0,
      pointsSpent: child.all_time?.points_spent || 0,
      currentBalance: child.all_time?.current_balance || child.summary?.total_points || 0,
    }));
  };

  // Generate consolidated suggestions report
  const getConsolidatedSuggestionsReport = () => {
    if (!analyticsData || !analyticsData.suggestions || analyticsData.suggestions.length === 0) {
      return null;
    }

    const suggestions = analyticsData.suggestions;
    const childName = analyticsData.children?.[0]?.child_name || 'το παιδί';
    
    // Group suggestions by category
    const attentionItems = suggestions.filter((s: any) => s.category === 'attention');
    const encouragementItems = suggestions.filter((s: any) => s.category === 'encouragement' || s.category === 'engagement');
    const timingItems = suggestions.filter((s: any) => s.category === 'timing');
    const celebrationItems = suggestions.filter((s: any) => s.category === 'celebration' || s.category === 'strength');
    
    let report = '';
    
    // Opening
    report += `📋 **Αναφορά για ${childName}**\n\n`;
    report += `Με βάση τη δραστηριότητα των τελευταίων ${selectedDateLabel}, έχουμε τις εξής παρατηρήσεις:\n\n`;
    
    // Celebrations first (positive reinforcement)
    if (celebrationItems.length > 0) {
      report += `🌟 **Θετικά σημεία:**\n`;
      const habitNames = celebrationItems.map((s: any) => `"${s.habit_name}"`).join(', ');
      report += `Εξαιρετική πρόοδος στις συνήθειες: ${habitNames}. `;
      report += `Αυτές οι συνήθειες έχουν γίνει ρουτίνα και αξίζουν αναγνώριση! `;
      report += `Συνεχίστε να επιβραβεύετε την προσπάθεια.\n\n`;
    }
    
    // Attention needed
    if (attentionItems.length > 0) {
      report += `⚠️ **Χρειάζονται προσοχή:**\n`;
      attentionItems.forEach((s: any) => {
        report += `• **${s.habit_name}**: ${s.message}\n`;
      });
      report += `\n`;
    }
    
    // Timing issues
    if (timingItems.length > 0) {
      report += `⏰ **Θέμα χρονισμού:**\n`;
      const timingHabits = timingItems.map((s: any) => `"${s.habit_name}"`).join(', ');
      report += `Οι συνήθειες ${timingHabits} αναβάλλονται συχνά. `;
      report += `Δοκιμάστε να τις εντάξετε σε διαφορετική ώρα της ημέρας ή να τις συνδέσετε με μια υπάρχουσα ρουτίνα.\n\n`;
    }
    
    // Encouragement needed
    if (encouragementItems.length > 0) {
      report += `💬 **Χρειάζονται ενθάρρυνση:**\n`;
      encouragementItems.forEach((s: any) => {
        if (s.category === 'engagement') {
          report += `• **${s.habit_name}**: Ζητείται βοήθεια συχνά. Δοκιμάστε να κάνετε τη δραστηριότητα πιο διασκεδαστική με παιχνίδια ή μουσική.\n`;
        } else {
          report += `• **${s.habit_name}**: Χρειάζεται λίγη ώθηση. Επιβραβεύστε την προσπάθεια, όχι μόνο το αποτέλεσμα.\n`;
        }
      });
      report += `\n`;
    }
    
    // Closing advice
    report += `💡 **Γενική συμβουλή:**\n`;
    report += `Θυμηθείτε ότι η συνέπεια είναι πιο σημαντική από την τελειότητα. `;
    report += `Κάθε μικρή πρόοδος μετράει! Επικεντρωθείτε στα θετικά και δώστε χρόνο για τις δύσκολες συνήθειες.`;
    
    return report;
  };

  const selectedDateLabel = DATE_RANGES.find(r => r.days === selectedDays)?.label || '30 ημέρες';
  const selectedChildNames = children
    .filter(c => selectedChildIds.includes(c.child_id))
    .map(c => c.name)
    .join(', ');
  const stats = getTotalStats();
  const lineChartData = getLineChartData();
  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();
  const allTimeBreakdown = getAllTimeBreakdown();
  const consolidatedReport = getConsolidatedSuggestionsReport();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Αναλυτικά Στατιστικά</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          {/* Child Selector */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <Ionicons name="people" size={18} color={COLORS.softBlue} />
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedChildNames || 'Επιλέξτε παιδί'}
            </Text>
            <Ionicons 
              name={showChildSelector ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>

          {showChildSelector && (
            <View style={styles.selectorDropdown}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.child_id}
                  style={[
                    styles.selectorItem,
                    selectedChildIds.includes(child.child_id) && styles.selectorItemSelected
                  ]}
                  onPress={() => toggleChildSelection(child.child_id)}
                >
                  <Text style={styles.selectorItemText}>{child.name}</Text>
                  {selectedChildIds.includes(child.child_id) && (
                    <Ionicons name="checkmark" size={18} color={COLORS.softGreen} />
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Compare Toggle */}
              {selectedChildIds.length > 1 && (
                <TouchableOpacity
                  style={styles.compareToggle}
                  onPress={() => setCompareMode(!compareMode)}
                >
                  <Ionicons 
                    name={compareMode ? "git-compare" : "git-compare-outline"} 
                    size={18} 
                    color={compareMode ? COLORS.softBlue : COLORS.mediumGray} 
                  />
                  <Text style={[
                    styles.compareText,
                    compareMode && { color: COLORS.softBlue }
                  ]}>
                    Σύγκριση παιδιών
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Date Range Selector */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDateSelector(!showDateSelector)}
          >
            <Ionicons name="calendar" size={18} color={COLORS.warmCoral} />
            <Text style={styles.filterText}>{selectedDateLabel}</Text>
            <Ionicons 
              name={showDateSelector ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>

          {showDateSelector && (
            <View style={styles.selectorDropdown}>
              {DATE_RANGES.map(range => (
                <TouchableOpacity
                  key={range.days}
                  style={[
                    styles.selectorItem,
                    selectedDays === range.days && styles.selectorItemSelected
                  ]}
                  onPress={() => {
                    setSelectedDays(range.days);
                    setShowDateSelector(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{range.label}</Text>
                  {selectedDays === range.days && (
                    <Ionicons name="checkmark" size={18} color={COLORS.softGreen} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.softBlue} />
            <Text style={styles.loadingText}>Φόρτωση δεδομένων...</Text>
          </View>
        ) : analyticsData ? (
          <>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                  Επισκόπηση
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'habits' && styles.tabActive]}
                onPress={() => setActiveTab('habits')}
              >
                <Text style={[styles.tabText, activeTab === 'habits' && styles.tabTextActive]}>
                  Συνήθειες
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
                onPress={() => setActiveTab('suggestions')}
              >
                <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>
                  💡 Συμβουλές
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'overview' && (
              <>
                {/* Summary Stats */}
                <View style={styles.summaryCard}>
                  <Text style={styles.cardTitle}>📈 Στατιστικά Περιόδου ({selectedDateLabel})</Text>
                  <Text style={styles.cardHint}>Πατήστε σε κάθε στατιστικό για επεξήγηση</Text>
                  <View style={styles.statsGrid}>
                    <TouchableOpacity 
                      style={styles.statBox} 
                      onPress={() => showStatExplanation('completions')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statNumber}>{stats.completions}</Text>
                      <Text style={styles.statLabel}>Ολοκληρώσεις</Text>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} style={styles.infoIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.statBox}
                      onPress={() => showStatExplanation('points')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statNumber}>⭐ {stats.points}</Text>
                      <Text style={styles.statLabel}>Πόντοι</Text>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} style={styles.infoIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.statBox}
                      onPress={() => showStatExplanation('help')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statNumber}>🤝 {stats.help}</Text>
                      <Text style={styles.statLabel}>Βοήθειες</Text>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} style={styles.infoIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.statBox}
                      onPress={() => showStatExplanation('postponed')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statNumber}>⏰ {stats.postponed}</Text>
                      <Text style={styles.statLabel}>Αναβολές</Text>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} style={styles.infoIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.statBox}
                      onPress={() => showStatExplanation('love')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statNumber}>💕 {stats.love}</Text>
                      <Text style={styles.statLabel}>Love Credits</Text>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} style={styles.infoIcon} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* All-Time Points Breakdown */}
                {allTimeBreakdown.length > 0 && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>💰 Ανάλυση Πόντων (Συνολικά)</Text>
                    <Text style={styles.cardHint}>Πατήστε για επεξήγηση κάθε γραμμής</Text>
                    {allTimeBreakdown.map((child: any, idx: number) => (
                      <View key={idx} style={styles.breakdownContainer}>
                        {allTimeBreakdown.length > 1 && (
                          <Text style={styles.breakdownChildName}>{child.name}</Text>
                        )}
                        <TouchableOpacity 
                          style={styles.breakdownRow}
                          onPress={() => showStatExplanation('pointsFromHabits')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.breakdownLabel}>⭐ Πόντοι από συνήθειες:</Text>
                          <View style={styles.breakdownValueRow}>
                            <Text style={styles.breakdownValue}>+{child.pointsFromHabits}</Text>
                            <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.breakdownRow}
                          onPress={() => showStatExplanation('loveCreditsAll')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.breakdownLabel}>💕 Love Credits:</Text>
                          <View style={styles.breakdownValueRow}>
                            <Text style={styles.breakdownValue}>+{child.loveCreditsReceived}</Text>
                            <Ionicons name="information-circle-outline" size={14} color={COLORS.mediumGray} />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.breakdownRow, styles.breakdownRowTotal]}
                          onPress={() => showStatExplanation('totalEarned')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.breakdownLabelBold}>Σύνολο κερδισμένων:</Text>
                          <View style={styles.breakdownValueRow}>
                            <Text style={styles.breakdownValueBold}>{child.totalEarned}</Text>
                            <Ionicons name="information-circle-outline" size={14} color={COLORS.darkGray} />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.breakdownRow}
                          onPress={() => showStatExplanation('pointsSpent')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.breakdownLabel, { color: COLORS.warmCoral }]}>🎁 Ξοδεύτηκαν σε έπαθλα:</Text>
                          <View style={styles.breakdownValueRow}>
                            <Text style={[styles.breakdownValue, { color: COLORS.warmCoral }]}>-{child.pointsSpent}</Text>
                            <Ionicons name="information-circle-outline" size={14} color={COLORS.warmCoral} />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.breakdownRow, styles.breakdownRowBalance]}
                          onPress={() => showStatExplanation('currentBalance')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.breakdownLabelBold}>💎 Τρέχον υπόλοιπο:</Text>
                          <View style={styles.breakdownValueRow}>
                            <Text style={[styles.breakdownValueBold, { color: COLORS.softGreen }]}>{child.currentBalance}</Text>
                            <Ionicons name="information-circle-outline" size={14} color={COLORS.softGreen} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Line Chart - Trend */}
                {lineChartData && lineChartData.datasets[0]?.data?.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>📊 Τάση Ολοκληρώσεων</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <LineChart
                        data={lineChartData}
                        width={Math.max(screenWidth - 48, lineChartData.labels.length * 50)}
                        height={200}
                        chartConfig={{
                          backgroundColor: COLORS.white,
                          backgroundGradientFrom: COLORS.white,
                          backgroundGradientTo: COLORS.white,
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(102, 178, 255, ${opacity})`,
                          labelColor: () => COLORS.mediumGray,
                          propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: COLORS.softBlue,
                          },
                        }}
                        bezier
                        style={styles.chart}
                      />
                    </ScrollView>
                    {compareMode && lineChartData.legend && (
                      <View style={styles.legendContainer}>
                        {lineChartData.legend.map((name: string, index: number) => (
                          <View key={name} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index] }]} />
                            <Text style={styles.legendText}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Pie Chart - Categories */}
                {pieChartData.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>🥧 Κατανομή ανά Κατηγορία</Text>
                    <PieChart
                      data={pieChartData}
                      width={screenWidth - 48}
                      height={200}
                      chartConfig={{
                        color: () => COLORS.softBlue,
                      }}
                      accessor="count"
                      backgroundColor="transparent"
                      paddingLeft="15"
                    />
                  </View>
                )}

                {/* Comparison Bar Chart */}
                {compareMode && barChartData && (
                  <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>⚔️ Σύγκριση Πόντων</Text>
                    <BarChart
                      data={barChartData}
                      width={screenWidth - 48}
                      height={200}
                      chartConfig={{
                        backgroundColor: COLORS.white,
                        backgroundGradientFrom: COLORS.white,
                        backgroundGradientTo: COLORS.white,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                        labelColor: () => COLORS.darkGray,
                      }}
                      style={styles.chart}
                      yAxisLabel=""
                      yAxisSuffix=""
                    />
                  </View>
                )}
              </>
            )}

            {activeTab === 'habits' && (
              <>
                {/* Strengths */}
                {analyticsData.children.map((child: any) => (
                  <View key={`strengths-${child.child_id}`} style={styles.habitCard}>
                    <Text style={styles.cardTitle}>💪 Δυνατά Σημεία - {child.child_name}</Text>
                    {child.strengths && child.strengths.length > 0 ? (
                      child.strengths.map((habit: any) => (
                        <View key={habit.habit_id} style={styles.habitRow}>
                          <View style={styles.habitInfo}>
                            <Text style={styles.habitName}>{habit.name}</Text>
                            <Text style={styles.habitStats}>
                              {habit.total_completions} ολοκληρώσεις • {Math.round(habit.completion_rate * 100)}%
                            </Text>
                          </View>
                          <View style={[styles.badge, styles.badgeGreen]}>
                            <Text style={styles.badgeText}>🌟</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>Δεν υπάρχουν αρκετά δεδομένα</Text>
                    )}
                  </View>
                ))}

                {/* Weaknesses */}
                {analyticsData.children.map((child: any) => (
                  child.weaknesses && child.weaknesses.length > 0 && (
                    <View key={`weaknesses-${child.child_id}`} style={styles.habitCard}>
                      <Text style={styles.cardTitle}>🎯 Χρειάζονται Προσοχή - {child.child_name}</Text>
                      {child.weaknesses.map((habit: any) => (
                        <View key={habit.habit_id} style={styles.habitRow}>
                          <View style={styles.habitInfo}>
                            <Text style={styles.habitName}>{habit.name}</Text>
                            <Text style={styles.habitStats}>
                              {habit.total_completions} ολοκληρώσεις • {Math.round(habit.completion_rate * 100)}%
                            </Text>
                            {habit.help_request_rate > 0.3 && (
                              <Text style={styles.habitWarning}>
                                ⚠️ Συχνά αιτήματα βοήθειας
                              </Text>
                            )}
                          </View>
                          <View style={[styles.badge, styles.badgeOrange]}>
                            <Text style={styles.badgeText}>💪</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                ))}

                {/* All Habits Breakdown */}
                {analyticsData.children.map((child: any) => (
                  <View key={`all-${child.child_id}`} style={styles.habitCard}>
                    <Text style={styles.cardTitle}>📋 Όλες οι Συνήθειες - {child.child_name}</Text>
                    {child.habit_breakdown && child.habit_breakdown.length > 0 ? (
                      child.habit_breakdown.map((habit: any) => (
                        <View key={habit.habit_id} style={styles.habitDetailRow}>
                          <Text style={styles.habitDetailName}>{habit.name}</Text>
                          <View style={styles.habitDetailStats}>
                            <Text style={styles.detailStat}>✅ {habit.total_completions}</Text>
                            <Text style={styles.detailStat}>🤝 {habit.help_requests}</Text>
                            <Text style={styles.detailStat}>⏰ {habit.postponed_count}</Text>
                            <Text style={[
                              styles.detailTrend,
                              habit.trend > 0 ? styles.trendUp : habit.trend < 0 ? styles.trendDown : {}
                            ]}>
                              {habit.trend > 0 ? '📈' : habit.trend < 0 ? '📉' : '➡️'}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>Δεν υπάρχουν συνήθειες</Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {activeTab === 'suggestions' && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Προτάσεις για Γονείς</Text>
                <Text style={styles.suggestionsSubtitle}>
                  Βασισμένες στα δεδομένα των τελευταίων {selectedDateLabel}
                </Text>

                {consolidatedReport ? (
                  <View style={styles.consolidatedReportCard}>
                    {consolidatedReport.split('\n\n').map((paragraph: string, idx: number) => {
                      // Check if paragraph is a header (starts with emoji and **)
                      const isHeader = paragraph.includes('**') && (
                        paragraph.startsWith('📋') || 
                        paragraph.startsWith('🌟') || 
                        paragraph.startsWith('⚠️') || 
                        paragraph.startsWith('⏰') || 
                        paragraph.startsWith('💬') || 
                        paragraph.startsWith('💡')
                      );
                      
                      // Parse bold text
                      const renderFormattedText = (text: string) => {
                        const parts = text.split(/\*\*(.*?)\*\*/g);
                        return parts.map((part, i) => {
                          if (i % 2 === 1) {
                            return <Text key={i} style={styles.reportBold}>{part}</Text>;
                          }
                          return <Text key={i}>{part}</Text>;
                        });
                      };
                      
                      if (paragraph.startsWith('•')) {
                        // Bullet points
                        return (
                          <View key={idx} style={styles.reportBulletContainer}>
                            {paragraph.split('\n').map((line, lineIdx) => (
                              <Text key={lineIdx} style={styles.reportBullet}>
                                {renderFormattedText(line)}
                              </Text>
                            ))}
                          </View>
                        );
                      } else if (isHeader) {
                        return (
                          <Text key={idx} style={styles.reportHeader}>
                            {renderFormattedText(paragraph)}
                          </Text>
                        );
                      } else {
                        return (
                          <Text key={idx} style={styles.reportParagraph}>
                            {renderFormattedText(paragraph)}
                          </Text>
                        );
                      }
                    })}
                  </View>
                ) : (
                  <View style={styles.noSuggestionsCard}>
                    <Ionicons name="checkmark-circle" size={48} color={COLORS.softGreen} />
                    <Text style={styles.noSuggestionsTitle}>Όλα πάνε καλά! 🎉</Text>
                    <Text style={styles.noSuggestionsText}>
                      Δεν υπάρχουν ιδιαίτερες προτάσεις αυτή τη στιγμή. 
                      Συνεχίστε την καλή δουλειά!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={64} color={COLORS.mediumGray} />
            <Text style={styles.noDataTitle}>Δεν υπάρχουν δεδομένα</Text>
            <Text style={styles.noDataSubtitle}>
              Επιλέξτε παιδί για να δείτε τα στατιστικά του
            </Text>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  filterText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
  },
  selectorDropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectorItemSelected: {
    backgroundColor: COLORS.softGreen + '20',
  },
  selectorItemText: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  compareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.lightGray,
  },
  compareText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.mediumGray,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.softBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
    textAlign: 'center',
  },
  infoIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  habitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  habitStats: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  habitWarning: {
    fontSize: 12,
    color: COLORS.warmCoral,
    marginTop: 4,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGreen: {
    backgroundColor: COLORS.softGreen + '30',
  },
  badgeOrange: {
    backgroundColor: COLORS.brightYellow + '30',
  },
  badgeText: {
    fontSize: 18,
  },
  habitDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  habitDetailName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  habitDetailStats: {
    flexDirection: 'row',
    gap: 12,
  },
  detailStat: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  detailTrend: {
    fontSize: 14,
  },
  trendUp: {
    color: COLORS.softGreen,
  },
  trendDown: {
    color: COLORS.warmCoral,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.mediumGray,
    fontSize: 14,
    paddingVertical: 20,
  },
  breakdownContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  breakdownChildName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownRowTotal: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 8,
  },
  breakdownRowBalance: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  breakdownLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  breakdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.softBlue,
  },
  suggestionAttention: {
    borderLeftColor: COLORS.warmCoral,
  },
  suggestionCelebration: {
    borderLeftColor: COLORS.softGreen,
  },
  suggestionStrength: {
    borderLeftColor: COLORS.brightYellow,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  suggestionChild: {
    fontSize: 12,
    color: COLORS.mediumGray,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  suggestionMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  noSuggestionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noSuggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  consolidatedReportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  reportHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 12,
    marginTop: 8,
  },
  reportParagraph: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.darkGray,
    lineHeight: 22,
    marginBottom: 12,
  },
  reportBold: {
    fontWeight: '700',
    color: COLORS.softBlue,
  },
  reportBulletContainer: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  reportBullet: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.darkGray,
    lineHeight: 24,
    marginBottom: 4,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
    textAlign: 'center',
  },
});
