import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../store/leadsStore';
import { COLORS, STATUS_CONFIG } from '../../constants/config';
import { formatCallWhen } from '../../constants/callPresets';
import ScheduleCallModal from '../../components/ScheduleCallModal';
import { Lead } from '../../types';

export default function CallsScreen() {
  const router = useRouter();
  const { leads, loading, fetchLeads, setNextCall } = useLeadsStore();
  const [rescheduleLead, setRescheduleLead] = useState<Lead | null>(null);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 8);

  const withCall = leads.filter((l) => l.followUpDate && !isNaN(new Date(l.followUpDate).getTime()));
  const byTime = (a: Lead, b: Lead) =>
    new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();

  const dayStart = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };

  const overdue = withCall
    .filter((l) => new Date(l.followUpDate) < now && l.status !== 'Converted' && l.status !== 'Lost' && dayStart(new Date(l.followUpDate)) < today.getTime())
    .sort(byTime);
  const todayList = withCall
    .filter((l) => dayStart(new Date(l.followUpDate)) === today.getTime())
    .sort(byTime);
  const tomorrowList = withCall
    .filter((l) => dayStart(new Date(l.followUpDate)) === tomorrow.getTime())
    .sort(byTime);
  const dayAfterList = withCall
    .filter((l) => dayStart(new Date(l.followUpDate)) === dayAfter.getTime())
    .sort(byTime);
  const upcoming = withCall
    .filter((l) => {
      const t = dayStart(new Date(l.followUpDate));
      return t > dayAfter.getTime() && t < weekEnd.getTime();
    })
    .sort(byTime);

  const total =
    overdue.length + todayList.length + tomorrowList.length + dayAfterList.length + upcoming.length;

  const call = (lead: Lead) => {
    if (lead.phone) Linking.openURL(`tel:${lead.phone}`);
  };

  const handleReschedule = async (iso: string) => {
    const lead = rescheduleLead;
    setRescheduleLead(null);
    if (!lead) return;
    try {
      await setNextCall(lead.id, iso);
    } catch {
      // store sets error
    }
  };

  const renderCard = (lead: Lead) => {
    const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG['New'];
    return (
      <View key={lead.id} style={styles.card}>
        <TouchableOpacity style={styles.cardMain} onPress={() => router.push(`/lead/${lead.id}`)}>
          <View style={[styles.avatar, { backgroundColor: sc.color + '25' }]}>
            <Text style={[styles.avatarText, { color: sc.color }]}>
              {lead.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
            <Text style={styles.phone}>{lead.phone}</Text>
            <Text style={styles.when}>⏰ {formatCallWhen(lead.followUpDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.color + '20' }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.emoji}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actBtn, styles.callBtn]} onPress={() => call(lead)}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.actText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actBtn, styles.reBtn]}
            onPress={() => setRescheduleLead(lead)}
          >
            <Ionicons name="time-outline" size={16} color={COLORS.warning} />
            <Text style={[styles.actText, { color: COLORS.warning }]}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const Section = ({ title, data, color, emoji }: { title: string; data: Lead[]; color: string; emoji: string }) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.countText, { color }]}>{data.length}</Text>
          </View>
        </View>
        {data.map(renderCard)}
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={[1]}
        keyExtractor={() => 'main'}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLeads} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        renderItem={() => (
          <View>
            {total === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>Koi Call Pending Nahi!</Text>
                <Text style={styles.emptySubtitle}>
                  Kisi lead pe "Agli Call" set karo to woh yahan dikhega.
                </Text>
              </View>
            ) : (
              <>
                <Section title="Overdue (reh gaye)" data={overdue} color={COLORS.danger} emoji="🚨" />
                <Section title="Aaj Call Karni Hai" data={todayList} color={COLORS.warning} emoji="📞" />
                <Section title="Kal" data={tomorrowList} color={COLORS.success} emoji="📅" />
                <Section title="Parso (2 din baad)" data={dayAfterList} color={COLORS.primary} emoji="🗓️" />
                <Section title="Is Hafte" data={upcoming} color={COLORS.primaryLight} emoji="📆" />
              </>
            )}
            <View style={{ height: 30 }} />
          </View>
        )}
      />

      <ScheduleCallModal
        visible={!!rescheduleLead}
        leadName={rescheduleLead?.name}
        currentDate={rescheduleLead?.followUpDate}
        onPick={handleReschedule}
        onClose={() => setRescheduleLead(null)}
        allowClear
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontWeight: 'bold', fontSize: 13 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  phone: { fontSize: 12, color: COLORS.textSecondary },
  when: { fontSize: 12, color: COLORS.warning, marginTop: 2, fontWeight: '600' },
  statusBadge: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  statusText: { fontSize: 16 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  callBtn: { backgroundColor: '#4ecb71' },
  reBtn: { backgroundColor: COLORS.warning + '18' },
  actText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 120, padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
