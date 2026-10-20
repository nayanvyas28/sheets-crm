import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../store/leadsStore';
import { COLORS, STATUS_CONFIG } from '../../constants/config';
import { Lead } from '../../types';

const STATUS_FILTERS = ['All', 'New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'];

export default function LeadsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { leads, loading, fetchLeads, updateStatus } = useLeadsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(
    (params.filter as string) || 'All'
  );
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Status filter
    if (selectedStatus !== 'All') {
      result = result.filter((l) => l.status === selectedStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [leads, searchQuery, selectedStatus, sortBy]);

  const renderLead = useCallback(
    ({ item }: { item: Lead }) => {
      const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['New'];
      const hasFollowUp = !!(item.followUpDate && new Date(item.followUpDate) >= new Date());
      const isOverdue = !!(
        item.followUpDate &&
        new Date(item.followUpDate) < new Date() &&
        item.status !== 'Converted'
      );

      return (
        <View style={[styles.leadCard, isOverdue && styles.overdueCard]}>
        <TouchableOpacity
          style={styles.leadMain}
          onPress={() => router.push(`/lead/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: sc.color + '25' }]}>
            <Text style={[styles.avatarText, { color: sc.color }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.leadInfo}>
            <View style={styles.leadTopRow}>
              <Text style={styles.leadName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: sc.color + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: sc.color }]}>
                  {sc.emoji} {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.leadPhone}>{item.phone}</Text>

            <View style={styles.leadMeta}>
              {item.city ? (
                <View style={styles.metaChip}>
                  <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.city}</Text>
                </View>
              ) : null}
              {item.source ? (
                <View style={styles.metaChip}>
                  <Ionicons name="funnel-outline" size={11} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.source}</Text>
                </View>
              ) : null}
              {item.callCount > 0 && (
                <View style={styles.metaChip}>
                  <Ionicons name="call-outline" size={11} color={COLORS.success} />
                  <Text style={[styles.metaText, { color: COLORS.success }]}>
                    {item.callCount} calls
                  </Text>
                </View>
              )}
              {hasFollowUp && (
                <View style={[styles.metaChip, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="alarm-outline" size={11} color={COLORS.warning} />
                  <Text style={[styles.metaText, { color: COLORS.warning }]}>
                    {new Date(item.followUpDate).toLocaleDateString('hi-IN')}
                  </Text>
                </View>
              )}
              {isOverdue && (
                <View style={[styles.metaChip, { backgroundColor: COLORS.danger + '20' }]}>
                  <Ionicons name="warning-outline" size={11} color={COLORS.danger} />
                  <Text style={[styles.metaText, { color: COLORS.danger }]}>Overdue</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick status actions — detail khole bina */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, item.status === 'Interested' && styles.quickActive]}
            onPress={() => updateStatus(item.id, 'Interested')}
          >
            <Text style={[styles.quickText, item.status === 'Interested' && { color: STATUS_CONFIG.Interested.color }]}>
              🌟 Interested
            </Text>
          </TouchableOpacity>
          <View style={styles.quickDivider} />
          <TouchableOpacity
            style={[styles.quickBtn, item.status === 'Not Interested' && styles.quickActive]}
            onPress={() => updateStatus(item.id, 'Not Interested')}
          >
            <Text style={[styles.quickText, item.status === 'Not Interested' && { color: STATUS_CONFIG['Not Interested'].color }]}>
              ❌ Not
            </Text>
          </TouchableOpacity>
          <View style={styles.quickDivider} />
          <TouchableOpacity
            style={[styles.quickBtn, item.status === 'Converted' && styles.quickActive]}
            onPress={() => updateStatus(item.id, 'Converted')}
          >
            <Text style={[styles.quickText, item.status === 'Converted' && { color: STATUS_CONFIG.Converted.color }]}>
              ✅ Done
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      );
    },
    [router, updateStatus]
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name, phone ya city dhundho..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChips}
        contentContainerStyle={styles.filterChipsContent}
      >
        {STATUS_FILTERS.map((status) => {
          const count =
            status === 'All'
              ? leads.length
              : leads.filter((l) => l.status === status).length;
          const isSelected = selectedStatus === status;
          const sc = status !== 'All' ? STATUS_CONFIG[status] : null;

          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.chip,
                isSelected && {
                  backgroundColor: sc ? sc.color : COLORS.primary,
                  borderColor: sc ? sc.color : COLORS.primary,
                },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {sc ? sc.emoji + ' ' : ''}{status} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} mila
      </Text>

      {/* Lead List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderLead}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLeads}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Koi Lead Nahi Mila</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Search change karke dekho' : 'Koi lead abhi nahi hai'}
            </Text>
          </View>
        }
      />

      {/* Sort/Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.modalTitle}>Sort Karo</Text>
            {(['newest', 'oldest', 'name'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.sortOption, sortBy === option && styles.sortOptionSelected]}
                onPress={() => {
                  setSortBy(option);
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextSelected,
                  ]}
                >
                  {option === 'newest'
                    ? '🕐 Naye pehle'
                    : option === 'oldest'
                    ? '🕓 Purane pehle'
                    : '🔤 Naam se (A-Z)'}
                </Text>
                {sortBy === option && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChips: {
    maxHeight: 44,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 10,
  },
  leadCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  leadMain: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  overdueCard: {
    borderColor: COLORS.danger + '60',
  },
  quickRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActive: {
    backgroundColor: COLORS.surface,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  leadInfo: {
    flex: 1,
    gap: 4,
  },
  leadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leadPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  leadMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  sortOptionSelected: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  sortOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
