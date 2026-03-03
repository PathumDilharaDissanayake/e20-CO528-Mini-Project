import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Appbar, useTheme, Text, Card, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDashboardStats, fetchUserGrowth, fetchEngagementStats } from '../../features/analyticsSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AnalyticsDashboard: React.FC = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { stats, userGrowth, engagement, isLoading } = useAppSelector((state) => state.analytics);
  const [period, setPeriod] = React.useState('month');

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchUserGrowth(period as 'week' | 'month' | 'year'));
    dispatch(fetchEngagementStats(period as 'week' | 'month' | 'year'));
  }, [period]);

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content>
        <View style={styles.statHeader}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
          <Text variant="headlineMedium" style={styles.statValue}>{value}</Text>
        </View>
        <Text variant="bodyMedium" style={styles.statTitle}>{title}</Text>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header><Appbar.Content title="Analytics Dashboard" /></Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Analytics Dashboard" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        </View>

        {stats && (
          <View style={styles.statsGrid}>
            <StatCard title="Total Users" value={stats.totalUsers} icon="account-group" color="#6200ee" />
            <StatCard title="Active Users" value={stats.activeUsers} icon="account-check" color="#4caf50" />
            <StatCard title="New This Month" value={stats.newUsersThisMonth} icon="account-plus" color="#ff9800" />
            <StatCard title="Total Posts" value={stats.totalPosts} icon="post" color="#2196f3" />
            <StatCard title="Total Jobs" value={stats.totalJobs} icon="briefcase" color="#9c27b0" />
            <StatCard title="Total Events" value={stats.totalEvents} icon="calendar" color="#f44336" />
          </View>
        )}

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>User Growth</Text>
            {userGrowth && (
              <View style={styles.chartPlaceholder}>
                <Text variant="bodySmall" style={styles.chartData}>
                  {userGrowth.labels?.join(', ')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>Engagement</Text>
            {engagement && (
              <View style={styles.chartPlaceholder}>
                <Text variant="bodySmall" style={styles.chartData}>
                  Posts: {engagement.posts?.reduce((a, b) => a + b, 0)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  periodSelector: { marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: (width - 56) / 2, marginBottom: 8 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statValue: { fontWeight: 'bold' },
  statTitle: { opacity: 0.7 },
  chartCard: { marginBottom: 16 },
  chartTitle: { fontWeight: 'bold', marginBottom: 12 },
  chartPlaceholder: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
  chartData: { opacity: 0.6 },
});

export default AnalyticsDashboard;
