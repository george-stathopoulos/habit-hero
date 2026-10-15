import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const AVATARS = ['🦁', '🐰', '🦊', '🐻', '🐸', '🦄', '🐯', '🐼'];

const DATE_RANGES = [
  { label: '7 ημέρες', days: 7 },
  { label: '30 ημέρες', days: 30 },
  { label: '90 ημέρες', days: 90 },
  { label: 'Όλα', days: 0 },
];

interface Transaction {
  id: string;
  type: string;
  category: 'earned' | 'spent' | 'lost';
  title: string;
  emoji: string;
  points: number;
  timestamp: string;
  date: string;
  details: any;
}

interface ChildHistory {
  child_id: string;
  child_name: string;
  avatar_id: number;
  current_balance: number;
  summary: {
    total_earned: number;
    total_spent: number;
    total_lost: number;
    net_change: number;
    transaction_count: number;
  };
  transactions: Transaction[];
  grouped: {
    earned: Transaction[];
    spent: Transaction[];
    lost: Transaction[];
  };
}

export default function PointsHistory() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<ChildHistory | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['earned']));

  // Load children list
  const loadChildren = async () => {
    try {
      console.log('Loading children from:', `${BACKEND_URL}/api/children`);
      const response = await fetch(`${BACKEND_URL}/api/children`, {
        credentials: 'include',
      });
      console.log('Children response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Children data:', JSON.stringify(data));
        
        // API returns array directly, not {children: [...]}
        const childList = Array.isArray(data) ? data : (data.children || []);
        console.log('Child list length:', childList.length);
        
        setChildren(childList);
        if (childList.length > 0 && !selectedChildId) {
          setSelectedChildId(childList[0].child_id);
        } else if (childList.length === 0) {
          setLoading(false);
        }
      } else {
        console.error('Failed to load children:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      setLoading(false);
    }
  };

  // Load comprehensive history for selected child
  const loadHistory = async () => {
    if (!selectedChildId) {
      setLoading(false);
      return;
    }
    
    const url = `${BACKEND_URL}/api/parent/comprehensive-points-history/${selectedChildId}?days=${selectedDays}`;
    console.log('Loading history from:', url);
    
    try {
      setLoading(true);
      
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('History response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('History data received, transactions:', data?.transactions?.length || 0);
        setHistoryData(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load history:', response.status, errorText);
        setHistoryData(null);
      }
    } catch (error: any) {
      console.error('Error loading history:', error.message || error);
      setHistoryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadHistory();
    }
  }, [selectedChildId, selectedDays]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const selectedChild = children.find(c => c.child_id === selectedChildId);
  const selectedDateLabel = DATE_RANGES.find(r => r.days === selectedDays)?.label || '30 ημέρες';

  const renderTransactionItem = (transaction: Transaction, index: number) => {
    const isPositive = transaction.points > 0;
    // Generate a unique key - use id if available, otherwise use type+index
    const uniqueKey = transaction.id || `${transaction.type}-${index}-${transaction.timestamp || Date.now()}`;
    
    return (
      <View key={uniqueKey} style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionEmoji}>{transaction.emoji}</Text>
        </View>
        <View style={styles.transactionContent}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.timestamp)}
          </Text>
          {transaction.details?.needed_help && (
            <Text style={styles.transactionDetail}>🤝 Χρειάστηκε βοήθεια</Text>
          )}
          {transaction.details?.fulfilled === false && transaction.type === 'reward_redemption' && (
            <Text style={[styles.transactionDetail, { color: COLORS.warmCoral }]}>⏳ Αναμένεται</Text>
          )}
          {transaction.details?.fulfilled === true && transaction.type === 'reward_redemption' && (
            <Text style={[styles.transactionDetail, { color: COLORS.softGreen }]}>✅ Ολοκληρώθηκε</Text>
          )}
        </View>
        <Text style={[
          styles.transactionPoints,
          isPositive ? styles.pointsPositive : styles.pointsNegative
        ]}>
          {isPositive ? '+' : ''}{transaction.points}
        </Text>
      </View>
    );
  };

  const renderSection = (
    title: string, 
    icon: string, 
    sectionKey: string, 
    transactions: Transaction[], 
    totalPoints: number,
    color: string
  ) => {
    const isExpanded = expandedSections.has(sectionKey);
    const count = transactions.length;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.sectionHeader, { borderLeftColor: color }]}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <View>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionCount}>{count} συναλλαγές</Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRight}>
            <Text style={[styles.sectionTotal, { color }]}>
              {totalPoints >= 0 ? '+' : ''}{totalPoints}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={COLORS.mediumGray} 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {transactions.length > 0 ? (
              transactions.map((t, index) => renderTransactionItem(t, index))
            ) : (
              <Text style={styles.emptyText}>Δεν υπάρχουν συναλλαγές</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading && !historyData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 Ιστορικό Πόντων</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.softBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Ιστορικό Πόντων</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters Row */}
        <View style={styles.filtersRow}>
          {/* Child Selector */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowChildSelector(!showChildSelector);
              setShowDateSelector(false);
            }}
          >
            <Text style={styles.filterEmoji}>
              {AVATARS[(selectedChild?.avatar_id || 1) - 1] || '🦁'}
            </Text>
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedChild?.name || 'Επιλέξτε'}
            </Text>
            <Ionicons 
              name={showChildSelector ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>

          {/* Date Range Selector */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowDateSelector(!showDateSelector);
              setShowChildSelector(false);
            }}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.softBlue} />
            <Text style={styles.filterText}>{selectedDateLabel}</Text>
            <Ionicons 
              name={showDateSelector ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>
        </View>

        {/* Child Selector Dropdown */}
        {showChildSelector && (
          <View style={styles.dropdown}>
            {children.map(child => (
              <TouchableOpacity
                key={child.child_id}
                style={[
                  styles.dropdownItem,
                  selectedChildId === child.child_id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedChildId(child.child_id);
                  setShowChildSelector(false);
                }}
              >
                <Text style={styles.dropdownEmoji}>
                  {AVATARS[(child.avatar_id || 1) - 1] || '🦁'}
                </Text>
                <Text style={styles.dropdownText}>{child.name}</Text>
                {selectedChildId === child.child_id && (
                  <Ionicons name="checkmark" size={18} color={COLORS.softGreen} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date Range Dropdown */}
        {showDateSelector && (
          <View style={styles.dropdown}>
            {DATE_RANGES.map(range => (
              <TouchableOpacity
                key={range.days}
                style={[
                  styles.dropdownItem,
                  selectedDays === range.days && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedDays(range.days);
                  setShowDateSelector(false);
                }}
              >
                <Text style={styles.dropdownText}>{range.label}</Text>
                {selectedDays === range.days && (
                  <Ionicons name="checkmark" size={18} color={COLORS.softGreen} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {historyData ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryAvatar}>
                  {AVATARS[(historyData.avatar_id || 1) - 1] || '🦁'}
                </Text>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryName}>{historyData.child_name}</Text>
                  <Text style={styles.summaryPeriod}>
                    {selectedDays > 0 ? `Τελευταίες ${selectedDays} ημέρες` : 'Όλο το ιστορικό'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>Τρέχον Υπόλοιπο</Text>
                <Text style={styles.balanceValue}>⭐ {historyData.current_balance}</Text>
              </View>

              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="arrow-up" size={16} color={COLORS.softGreen} />
                  </View>
                  <Text style={styles.statLabel}>Κερδισμένοι</Text>
                  <Text style={[styles.statValue, { color: COLORS.softGreen }]}>
                    +{historyData.summary.total_earned}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="cart" size={16} color="#FF9800" />
                  </View>
                  <Text style={styles.statLabel}>Ξοδευμένοι</Text>
                  <Text style={[styles.statValue, { color: '#FF9800' }]}>
                    -{historyData.summary.total_spent}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="sad" size={16} color={COLORS.warmCoral} />
                  </View>
                  <Text style={styles.statLabel}>Αφαιρέθηκαν</Text>
                  <Text style={[styles.statValue, { color: COLORS.warmCoral }]}>
                    -{historyData.summary.total_lost}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="calculator" size={16} color={COLORS.softBlue} />
                  </View>
                  <Text style={styles.statLabel}>Σύνολο Περιόδου</Text>
                  <Text style={[styles.statValue, { 
                    color: historyData.summary.net_change >= 0 ? COLORS.softGreen : COLORS.warmCoral 
                  }]}>
                    {historyData.summary.net_change >= 0 ? '+' : ''}{historyData.summary.net_change}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transaction Sections */}
            {renderSection(
              'Πόντοι που Κερδήθηκαν',
              '⭐',
              'earned',
              historyData.grouped.earned,
              historyData.summary.total_earned,
              COLORS.softGreen
            )}
            
            {renderSection(
              'Πόντοι που Ξοδεύτηκαν',
              '🎁',
              'spent',
              historyData.grouped.spent,
              -historyData.summary.total_spent,
              '#FF9800'
            )}
            
            {renderSection(
              'Πόντοι που Αφαιρέθηκαν',
              '😢',
              'lost',
              historyData.grouped.lost,
              -historyData.summary.total_lost,
              COLORS.warmCoral
            )}

            {/* Empty State */}
            {historyData.summary.transaction_count === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>Δεν υπάρχει ιστορικό</Text>
                <Text style={styles.emptySubtitle}>
                  Δεν υπάρχουν συναλλαγές για αυτή την περίοδο
                </Text>
              </View>
            )}
          </>
        ) : children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👶</Text>
            <Text style={styles.emptyTitle}>Δεν υπάρχουν παιδιά</Text>
            <Text style={styles.emptySubtitle}>
              Προσθέστε παιδιά για να δείτε το ιστορικό πόντων τους
            </Text>
          </View>
        ) : null}
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
    backgroundColor: COLORS.softBlue,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  filterEmoji: {
    fontSize: 20,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  dropdownEmoji: {
    fontSize: 24,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryAvatar: {
    fontSize: 48,
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  summaryPeriod: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  balanceBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderLeftWidth: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  transactionDetail: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  transactionPoints: {
    fontSize: 15,
    fontWeight: '600',
  },
  pointsPositive: {
    color: COLORS.softGreen,
  },
  pointsNegative: {
    color: COLORS.warmCoral,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.mediumGray,
    fontSize: 14,
    padding: 20,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
