import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, CATEGORY_COLORS } from '../constants/colors';

interface HabitData {
  category: string;
  count: number;
}

interface SuggestionsCardProps {
  childName?: string;
  habits: HabitData[];
  totalTasks: number;
  suggestions?: string[];
}

export function SuggestionsCard({ childName, habits, totalTasks, suggestions }: SuggestionsCardProps) {
  const categoryNames: Record<string, string> = {
    hygiene: 'Υγιεινή',
    organization: 'Οργάνωση',
    education: 'Εκπαίδευση',
    creativity: 'Δημιουργικότητα',
    health: 'Υγεία',
    social: 'Κοινωνικά',
    environment: 'Περιβάλλον',
    responsibility: 'Ευθύνη',
    routine: 'Ρουτίνα',
    general: 'Γενικά',
  };

  // Calculate pie chart data
  const total = habits.reduce((sum, h) => sum + h.count, 0);
  let startAngle = 0;

  const pieSlices = habits.map((habit, index) => {
    const percentage = total > 0 ? (habit.count / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    const slice = {
      ...habit,
      percentage,
      startAngle,
      endAngle,
      color: CATEGORY_COLORS[habit.category] || COLORS.mediumGray,
    };
    
    startAngle = endAngle;
    return slice;
  });

  // Generate SVG path for pie slice
  const createArcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const chartSize = 120;
  const chartRadius = 50;
  const chartCenter = chartSize / 2;

  // Get focus areas (top categories)
  const focusAreas = pieSlices
    .filter(s => s.percentage >= 15)
    .map(s => categoryNames[s.category] || s.category);

  // Generate suggestions based on distribution
  const getSuggestions = () => {
    const suggs: string[] = [];
    
    if (totalTasks > 10) {
      suggs.push('Πολλές συνήθειες! Σκεφτείτε να μειώσετε για καλύτερη εστίαση.');
    } else if (totalTasks < 3) {
      suggs.push('Λίγες συνήθειες. Μπορείτε να προσθέσετε περισσότερες!');
    }
    
    const hasHygiene = habits.some(h => h.category === 'hygiene' && h.count > 0);
    const hasEducation = habits.some(h => h.category === 'education' && h.count > 0);
    
    if (!hasHygiene) {
      suggs.push('Προσθέστε συνήθειες υγιεινής για ισορροπημένη ανάπτυξη.');
    }
    
    if (!hasEducation) {
      suggs.push('Εκπαιδευτικές δραστηριότητες βοηθούν στη μάθηση!');
    }
    
    return suggs.length > 0 ? suggs : suggestions || [];
  };

  const displaySuggestions = getSuggestions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={24} color={COLORS.sunnyYellow} />
        <Text style={styles.title}>
          {childName ? `Προτάσεις για ${childName}` : 'Προτάσεις'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <Svg width={chartSize} height={chartSize}>
            <G>
              {pieSlices.length > 0 ? (
                pieSlices.map((slice, index) => (
                  slice.percentage > 0 && (
                    <Path
                      key={index}
                      d={createArcPath(
                        chartCenter,
                        chartCenter,
                        chartRadius,
                        slice.startAngle,
                        slice.endAngle
                      )}
                      fill={slice.color}
                    />
                  )
                ))
              ) : (
                <Circle
                  cx={chartCenter}
                  cy={chartCenter}
                  r={chartRadius}
                  fill={COLORS.lightGray}
                />
              )}
              {/* Center circle */}
              <Circle
                cx={chartCenter}
                cy={chartCenter}
                r={25}
                fill={COLORS.white}
              />
              <SvgText
                x={chartCenter}
                y={chartCenter - 5}
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill={COLORS.darkGray}
              >
                {totalTasks}
              </SvgText>
              <SvgText
                x={chartCenter}
                y={chartCenter + 12}
                textAnchor="middle"
                fontSize="10"
                fill={COLORS.mediumGray}
              >
                συνήθειες
              </SvgText>
            </G>
          </Svg>
        </View>

        {/* Legend & Info */}
        <View style={styles.infoContainer}>
          {/* Focus areas */}
          {focusAreas.length > 0 && (
            <View style={styles.focusSection}>
              <Text style={styles.focusLabel}>Εστίαση:</Text>
              <Text style={styles.focusText}>{focusAreas.join(', ')}</Text>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            {pieSlices.slice(0, 4).map((slice, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendText}>
                  {categoryNames[slice.category] || slice.category}
                </Text>
                <Text style={styles.legendCount}>{slice.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Suggestions */}
      {displaySuggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          {displaySuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons name="arrow-forward-circle" size={16} color={COLORS.softBlue} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  focusSection: {
    marginBottom: 12,
  },
  focusLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  focusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  legend: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.darkGray,
  },
  legendCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  suggestionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});
