import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../store/leadsStore';
import { COLORS, STATUS_CONFIG } from '../../constants/config';
import { formatCallWhen } from '../../constants/callPresets';
import { loadTemplates, applyTemplate, WaTemplate } from '../../services/templates';
import ScheduleCallModal from '../../components/ScheduleCallModal';
import { Lead } from '../../types';

const CALL_OUTCOMES = [
  '✅ Interested',
  '🚫 Not Interested',
  '📵 Not Answered',
  '📞 Will Call Back',
  '💬 Requested WhatsApp',
  '🔄 Follow-up Set',
];

// In outcomes ke baad auto "agli call kab?" poochho
const RESCHEDULE_OUTCOMES = ['📵 Not Answered', '📞 Will Call Back', '🔄 Follow-up Set'];

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLeadById, logCall, updateStatus, setNextCall, fetchLeads, leads } = useLeadsStore();

  const [lead, setLead] = useState<Lead | undefined>(undefined);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callOutcome, setCallOutcome] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [logging, setLogging] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);

  useEffect(() => {
    const found = getLeadById(id || '');
    setLead(found);
  }, [id, leads]);

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  if (!lead) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Lead nahi mila 😕</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Wapas Jao</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG['New'];

  const handleCall = () => {
    const phoneUrl = `tel:${lead.phone}`;
    Linking.openURL(phoneUrl);
    // Show call log modal after a brief delay
    setTimeout(() => setCallModalVisible(true), 1000);
  };

  const handleLogCall = async () => {
    if (!callOutcome) {
      Alert.alert('⚠️', 'Call ka outcome select karo');
      return;
    }

    const outcome = callOutcome;
    setLogging(true);
    try {
      await logCall(lead.id, outcome, callNotes);
      const updated = getLeadById(lead.id);
      if (updated) setLead(updated);
      setCallModalVisible(false);
      setCallOutcome('');
      setCallNotes('');
      // Agar call nahi uthi / call-back / follow-up -> turant agli call set karo
      if (RESCHEDULE_OUTCOMES.includes(outcome)) {
        setTimeout(() => setScheduleVisible(true), 300);
      } else {
        Alert.alert('✅', 'Call log ho gaya Google Sheet mein!');
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLogging(false);
    }
  };

  const handleSchedulePick = async (iso: string) => {
    setScheduleVisible(false);
    try {
      await setNextCall(lead.id, iso);
      const updated = getLeadById(lead.id);
      if (updated) setLead(updated);
      if (iso) {
        Alert.alert('✅ Set!', `Agli call: ${formatCallWhen(iso)}`);
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusModalVisible(false);
    try {
      await updateStatus(lead.id, newStatus);
      const updated = getLeadById(lead.id);
      if (updated) setLead(updated);
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  const openWhatsApp = (message: string) => {
    const phone = lead.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('❌ Error', 'WhatsApp open nahi ho saka. Install hai?');
    });
  };

  const handleWhatsApp = () => {
    const first = templates[0];
    setWhatsappMsg(first ? applyTemplate(first.text, lead.name) : '');
    setWhatsappModalVisible(true);
  };

  const callHistory = lead.notes
    ?.split('\n')
    .filter((line) => line.startsWith('Call ')) || [];
  const otherNotes = lead.notes
    ?.split('\n')
    .filter((line) => !line.startsWith('Call '))
    .join('\n') || '';

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={[styles.avatarLarge, { backgroundColor: sc.color + '25' }]}>
          <Text style={[styles.avatarText, { color: sc.color }]}>
            {lead.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.leadName}>{lead.name}</Text>
          <Text style={styles.leadPhone}>{lead.phone}</Text>
          {lead.email ? <Text style={styles.leadEmail}>{lead.email}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: sc.color + '25', borderColor: sc.color + '50' }]}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={[styles.statusText, { color: sc.color }]}>
            {sc.emoji} {lead.status}
          </Text>
          <Ionicons name="pencil" size={12} color={sc.color} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Quick Info */}
      <View style={styles.infoGrid}>
        <InfoItem icon="location-outline" label="City" value={lead.city || '—'} />
        <InfoItem icon="funnel-outline" label="Source" value={lead.source || '—'} />
        <InfoItem
          icon="call-outline"
          label="Total Calls"
          value={`${lead.callCount} calls`}
          valueColor={COLORS.success}
        />
        <InfoItem
          icon="time-outline"
          label="Add Kiya"
          value={new Date(lead.createdAt).toLocaleDateString('hi-IN')}
        />
        {lead.lastCalled ? (
          <InfoItem
            icon="checkmark-circle-outline"
            label="Last Call"
            value={new Date(lead.lastCalled).toLocaleString('hi-IN')}
          />
        ) : null}
        {lead.followUpDate ? (
          <InfoItem
            icon="alarm-outline"
            label="Agli Call"
            value={formatCallWhen(lead.followUpDate)}
            valueColor={COLORS.warning}
          />
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
          <Ionicons name="call" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Call Karo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.whatsappBtn]}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.logBtn]}
          onPress={() => setCallModalVisible(true)}
        >
          <Ionicons name="clipboard-outline" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Call Log</Text>
        </TouchableOpacity>
      </View>

      {/* Next Call schedule / reschedule */}
      <TouchableOpacity style={styles.scheduleBar} onPress={() => setScheduleVisible(true)}>
        <Ionicons name="alarm-outline" size={18} color={COLORS.warning} />
        <Text style={styles.scheduleBarText}>
          {lead.followUpDate
            ? `Agli call: ${formatCallWhen(lead.followUpDate)}  (badlo)`
            : 'Agli call set karo'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Call History */}
      {callHistory.length > 0 && (
        <>
          <SectionTitle title="📞 Call History" />
          <View style={styles.callHistoryContainer}>
            {callHistory.map((entry, i) => (
              <View key={i} style={styles.callEntry}>
                <View style={styles.callEntryDot} />
                <Text style={styles.callEntryText}>{entry}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Notes */}
      {otherNotes ? (
        <>
          <SectionTitle title="📝 Notes" />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{otherNotes}</Text>
          </View>
        </>
      ) : null}

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push(`/lead/edit/${lead.id}`)}
      >
        <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
        <Text style={styles.editButtonText}>Lead Edit Karo</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />

      {/* Call Log Modal */}
      <Modal
        visible={callModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCallModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.callModal}>
            <Text style={styles.modalTitle}>
              📞 Call #{lead.callCount + 1} Log Karo
            </Text>
            <Text style={styles.modalSubtitle}>
              {lead.name} ke saath call ka result kya raha?
            </Text>

            <View style={styles.outcomeGrid}>
              {CALL_OUTCOMES.map((outcome) => (
                <TouchableOpacity
                  key={outcome}
                  style={[
                    styles.outcomeChip,
                    callOutcome === outcome && styles.outcomeChipSelected,
                  ]}
                  onPress={() => setCallOutcome(outcome)}
                >
                  <Text
                    style={[
                      styles.outcomeText,
                      callOutcome === outcome && styles.outcomeTextSelected,
                    ]}
                  >
                    {outcome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Additional notes (optional)..."
              placeholderTextColor={COLORS.textSecondary}
              value={callNotes}
              onChangeText={setCallNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCallModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, logging && { opacity: 0.6 }]}
                onPress={handleLogCall}
                disabled={logging}
              >
                {logging ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Sheet Mein Save Karo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.callModal}>
            <Text style={styles.modalTitle}>🏷️ Status Badlo</Text>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  lead.status === status && { borderColor: config.color, borderWidth: 2 },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={styles.statusOptionText}>
                  {config.emoji} {status}
                </Text>
                {lead.status === status && (
                  <Ionicons name="checkmark-circle" size={20} color={config.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WhatsApp Modal */}
      <Modal
        visible={whatsappModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWhatsappModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.callModal}>
            <Text style={styles.modalTitle}>💬 WhatsApp Message</Text>
            <Text style={styles.modalSubtitle}>Message edit karo aur bhejo</Text>

            {/* Template Buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.templateChip}
                    onPress={() => setWhatsappMsg(applyTemplate(t.text, lead.name))}
                  >
                    <Text style={styles.templateChipText}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.notesInput, { height: 120 }]}
              value={whatsappMsg}
              onChangeText={setWhatsappMsg}
              multiline
              textAlignVertical="top"
              placeholder="Message type karo..."
              placeholderTextColor={COLORS.textSecondary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setWhatsappModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#25D366' }]}
                onPress={() => {
                  setWhatsappModalVisible(false);
                  openWhatsApp(whatsappMsg);
                }}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>WhatsApp Bhejo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Next Call */}
      <ScheduleCallModal
        visible={scheduleVisible}
        leadName={lead.name}
        currentDate={lead.followUpDate}
        onPick={handleSchedulePick}
        onClose={() => setScheduleVisible(false)}
        allowClear
      />
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

function InfoItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: any;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  notFoundText: {
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 12,
  },
  backLink: {
    color: COLORS.primary,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  leadPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  leadEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callBtn: {
    backgroundColor: '#4ecb71',
    shadowColor: '#4ecb71',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
  },
  logBtn: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scheduleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.warning + '18',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  scheduleBarText: {
    flex: 1,
    color: COLORS.warning,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  callHistoryContainer: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginBottom: 8,
  },
  callEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  callEntryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginTop: 5,
  },
  callEntryText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notesBox: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  callModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -8,
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outcomeChipSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  outcomeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  outcomeTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    height: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
