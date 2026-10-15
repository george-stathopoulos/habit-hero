import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface Insight {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface InsightsCardProps {
  insights: Insight[];
  helpRequestsToday: number;
  helpRequestsTotal: number;
  onPress?: () => void;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  insights,
  helpRequestsToday,
  helpRequestsTotal,
  onPress,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return COLORS.warmCoral;
      case 'high':
        return '#FF9800';
      case 'medium':
        return COLORS.brightYellow;
      default:
        return COLORS.softBlue;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'alert-circle';
      case 'high':
        return 'warning';
      case 'medium':
        return 'information-circle';
      default:
        return 'bulb';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={COLORS.softBlue} />
          <Text style={styles.title}>Στατιστικά Εβδομάδας</Text>
        </View>
        {onPress && (
          <TouchableOpacity onPress={onPress}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{helpRequestsToday}</Text>
          <Text style={styles.statLabel}>Σήμερα</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{helpRequestsTotal}</Text>
          <Text style={styles.statLabel}>Εβδομάδα</Text>
        </View>
      </View>

      {/* Insights */}
      {insights.length > 0 ? (
        <View style={styles.insightsList}>
          {insights.slice(0, 3).map((insight, index) => (
            <View 
              key={index} 
              style={[
                styles.insightItem,
                { borderLeftColor: getPriorityColor(insight.priority) }
              ]}
            >
              <Ionicons 
                name={getPriorityIcon(insight.priority) as any} 
                size={20} 
                color={getPriorityColor(insight.priority)} 
              />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription} numberOfLines={2}>
                  {insight.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyInsights}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.softGreen} />
          <Text style={styles.emptyText}>Όλα καλά! Δεν υπάρχουν ειδοποιήσεις.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.softBlue,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
    lineHeight: 18,
  },
  emptyInsights: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
