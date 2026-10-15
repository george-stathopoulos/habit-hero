import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const screenWidth = Dimensions.get('window').width;

interface AnalyticsPreviewProps {
  childIds: string[];
  isVisible?: boolean;
}

const AnalyticsPreviewComponent: React.FC<AnalyticsPreviewProps> = ({ childIds, isVisible = false }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const lastChildIdsRef = useRef<string>('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasPulsedRef = useRef(false);
  
  // Memoize child IDs string to prevent unnecessary re-renders
  const childIdsString = useMemo(() => childIds.sort().join(','), [childIds]);

  // Pulse animation when becoming visible
  useEffect(() => {
    if (isVisible && !hasPulsedRef.current && !loading) {
      hasPulsedRef.current = true;
      // Pulse 3 times
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [isVisible, loading]);

  useEffect(() => {
    // Only load if child IDs actually changed or first load
    if (childIdsString !== lastChildIdsRef.current || !loadedRef.current) {
      lastChildIdsRef.current = childIdsString;
      loadedRef.current = true;
      loadPreviewData();
    }
  }, [childIdsString]);

  const loadPreviewData = async () => {
    if (!childIds || childIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Don't show loading spinner on subsequent loads
      if (!previewData) {
        setLoading(true);
      }
      const response = await fetch(
        `${BACKEND_URL}/api/parent/comprehensive-analytics?child_ids=${childIds.join(',')}&days=7`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setError(null);
      } else {
        setError('Αδυναμία φόρτωσης');
      }
    } catch (err) {
      console.error('Analytics preview error:', err);
      setError('Σφάλμα σύνδεσης');
    } finally {
      setLoading(false);
    }
  };

  const openFullAnalytics = () => {
    router.push({
      pathname: '/parent/analytics',
      params: { childIds: childIds.join(',') }
    });
  };

  // Calculate summary stats from all children
  const getSummaryStats = () => {
    if (!previewData || !previewData.children || previewData.children.length === 0) {
      return { completions: 0, points: 0, streak: 0, loveCredits: 0 };
    }

    let totalCompletions = 0;
    let totalPoints = 0;
    let maxStreak = 0;
    let totalLoveCredits = 0;

    previewData.children.forEach((child: any) => {
      totalCompletions += child.summary?.total_completions || 0;
      totalPoints += child.summary?.total_points_earned || 0;
      maxStreak = Math.max(maxStreak, child.summary?.current_streak || 0);
      totalLoveCredits += child.summary?.love_credits_received || 0;
    });

    return { completions: totalCompletions, points: totalPoints, streak: maxStreak, loveCredits: totalLoveCredits };
  };

  // Get chart data for last 7 days
  const getChartData = () => {
    if (!previewData || !previewData.children || previewData.children.length === 0) {
      return null;
    }

    // Aggregate daily completions from all children
    const aggregatedData: { [key: string]: number } = {};
    
    previewData.children.forEach((child: any) => {
      if (child.daily_trend) {
        child.daily_trend.forEach((day: any) => {
          const date = day.date;
          if (!aggregatedData[date]) {
            aggregatedData[date] = 0;
          }
          aggregatedData[date] += day.completions;
        });
      }
    });

    // Sort by date and take last 7
    const sortedDates = Object.keys(aggregatedData).sort().slice(-7);
    const labels = sortedDates.map(d => {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('el-GR', { weekday: 'short' }).substring(0, 2);
    });
    const data = sortedDates.map(d => aggregatedData[d]);

    return { labels, data };
  };

  const stats = getSummaryStats();
  const chartData = getChartData();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.softBlue} />
          <Text style={styles.loadingText}>Φόρτωση analytics...</Text>
        </View>
      </View>
    );
  }

  if (error || !previewData) {
    return (
      <TouchableOpacity style={styles.container} onPress={openFullAnalytics}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="analytics" size={20} color={COLORS.softBlue} />
            <Text style={styles.title}>Στατιστικά</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </View>
        <Text style={styles.errorText}>{error || 'Δεν υπάρχουν δεδομένα'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={openFullAnalytics} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics" size={20} color={COLORS.softBlue} />
          <Text style={styles.title}>Στατιστικά (7 ημέρες)</Text>
        </View>
        <Animated.View style={[styles.pulseIconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="arrow-forward-circle" size={28} color={COLORS.softBlue} />
        </Animated.View>
      </View>

      {/* Mini Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completions}</Text>
          <Text style={styles.statLabel}>Ολοκληρώσεις</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>⭐ {stats.points}</Text>
          <Text style={styles.statLabel}>Πόντοι</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>💕 {stats.loveCredits}</Text>
          <Text style={styles.statLabel}>Love Credits</Text>
        </View>
      </View>

      {/* Mini Chart */}
      {chartData && chartData.data.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.data.length > 0 ? chartData.data : [0] }]
            }}
            width={screenWidth - 64}
            height={100}
            withVerticalLabels={true}
            withHorizontalLabels={false}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 178, 255, ${opacity})`,
              labelColor: () => COLORS.mediumGray,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: COLORS.softBlue
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Suggestions Preview */}
      {previewData.suggestions && previewData.suggestions.length > 0 && (
        <View style={styles.suggestionPreview}>
          <Ionicons name="bulb" size={16} color={COLORS.brightYellow} />
          <Text style={styles.suggestionText} numberOfLines={1}>
            {previewData.suggestions[0].title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Export with React.memo and custom comparison
export const AnalyticsPreview = React.memo(AnalyticsPreviewComponent, (prevProps, nextProps) => {
  // Only re-render if child IDs or visibility changed
  const prevIds = prevProps.childIds.sort().join(',');
  const nextIds = nextProps.childIds.sort().join(',');
  return prevIds === nextIds && prevProps.isVisible === nextProps.isVisible;
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  pulseIconContainer: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.mediumGray + '30',
  },
  chartContainer: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  suggestionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.darkGray,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.mediumGray,
    fontSize: 14,
    paddingVertical: 20,
  },
});
