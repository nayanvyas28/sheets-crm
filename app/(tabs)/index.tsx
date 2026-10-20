import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useLeadsStore } from '../../store/leadsStore';
import { COLORS, STATUS_CONFIG } from '../../constants/config';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { leads, loading, fetchLeads, getTodayFollowUps, getStatsByStatus, lastSynced } =
    useLeadsStore();

  useEffect(() => {
    fetchLeads();
  }, []);

  const onRefresh = useCallback(() => {
    fetchLeads();
  }, []);

  const stats = getStatsByStatus();
  const todayFollowUps = getTodayFollowUps();

  const today = new Date();
  const todayLeads = leads.filter(
    (l) => new Date(l.createdAt).toDateString() === today.toDateString()
  );

  const thisWeekLeads = leads.filter((l) => {
    const d = new Date(l.createdAt);
    const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const convertedCount = leads.filter((l) => l.status === 'Converted').length;
  const conversionRate =
    leads.length > 0 ? ((convertedCount / leads.length) * 100).toFixed(1) : '0';

  const chartData = {
    labels: Object.keys(STATUS_CONFIG).map((s) => s.substring(0, 5)),
    datasets: [
      {
        data: Object.keys(STATUS_CONFIG).map((s) => stats[s] || 0),
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste! 🙏</Text>
          <Text style={styles.date}>{today.toLocaleDateString('hi-IN', { 
            weekday: 'long', day: 'numeric', month: 'long' 
          })}</Text>
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={fetchLeads}
        >
          <Ionicons name="sync-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {lastSynced && (
        <Text style={styles.syncedAt}>
          Last synced: {lastSynced.toLocaleTimeString()}
        </Text>
      )}

      {/* Today's Follow-ups Alert */}
      {todayFollowUps.length > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => router.push('/(tabs)/followups')}
        >
          <View style={styles.alertLeft}>
            <Text style={styles.alertEmoji}>🔔</Text>
            <View>
              <Text style={styles.alertTitle}>Aaj ke Follow-ups!</Text>
              <Text style={styles.alertSubtitle}>
                {todayFollowUps.length} lead{todayFollowUps.length > 1 ? 's' : ''} ka follow-up aaj hai
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.warning} />
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Leads"
          value={leads.length}
          icon="people"
          color={COLORS.primary}
          onPress={() => router.push('/(tabs)/leads')}
        />
        <StatCard
          label="Aaj Aaye"
          value={todayLeads.length}
          icon="today"
          color={COLORS.success}
        />
        <StatCard
          label="Is Hafte"
          value={thisWeekLeads.length}
          icon="calendar"
          color={COLORS.warning}
        />
        <StatCard
          label="Converted"
          value={`${conversionRate}%`}
          icon="trophy"
          color="#4ecb71"
        />
      </View>

      {/* Status Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Status Breakdown</Text>
      </View>

      <View style={styles.statusGrid}>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <TouchableOpacity
            key={status}
            style={styles.statusCard}
            onPress={() =>
              router.push({ pathname: '/(tabs)/leads', params: { filter: status } })
            }
          >
            <Text style={styles.statusEmoji}>{config.emoji}</Text>
            <Text style={[styles.statusCount, { color: config.color }]}>
              {stats[status] || 0}
            </Text>
            <Text style={styles.statusLabel}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar Chart */}
      {leads.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 Lead Distribution</Text>
          </View>
          <View style={styles.chartContainer}>
            <BarChart
              data={chartData}
              width={SCREEN_WIDTH - 40}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                labelColor: () => COLORS.textSecondary,
                style: { borderRadius: 12 },
                barPercentage: 0.6,
              }}
              style={styles.chart}
              showBarTops
              fromZero
            />
          </View>
        </>
      )}

      {/* Recent Leads */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🕐 Recent Leads</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/leads')}>
          <Text style={styles.viewAll}>Sab Dekho →</Text>
        </TouchableOpacity>
      </View>

      {leads.slice(0, 5).map((lead) => {
        const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG['New'];
        return (
          <TouchableOpacity
            key={lead.id}
            style={styles.recentCard}
            onPress={() => router.push(`/lead/${lead.id}`)}
          >
            <View style={[styles.avatar, { backgroundColor: sc.color + '30' }]}>
              <Text style={styles.avatarText}>
                {lead.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>{lead.name}</Text>
              <Text style={styles.recentPhone}>{lead.phone}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: sc.color + '20' }]}>
              <Text style={[styles.statusPillText, { color: sc.color }]}>
                {sc.emoji} {lead.status}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {leads.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Koi Lead Nahi</Text>
          <Text style={styles.emptySubtitle}>
            Pehla lead add karo ya Google Sheet sync karo
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Text style={styles.addFirstText}>➕ Lead Add Karo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  syncButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  syncedAt: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  alertCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertEmoji: {
    fontSize: 28,
  },
  alertTitle: {
    color: COLORS.warning,
    fontWeight: 'bold',
    fontSize: 15,
  },
  alertSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    paddingTop: 0,
    gap: 0,
  },
  statCard: {
    width: '50%',
    padding: 10,
  },
  statCardInner: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
