import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../../store/leadsStore';
import { COLORS, STATUS_CONFIG, LEAD_SOURCES } from '../../../constants/config';
import { formatCallWhen } from '../../../constants/callPresets';
import ScheduleCallModal from '../../../components/ScheduleCallModal';
import { Lead } from '../../../types';

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

export default function EditLeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLeadById, updateLead, deleteLead } = useLeadsStore();

  const existing = getLeadById(id || '');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [form, setForm] = useState({
    name: existing?.name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    city: existing?.city || '',
    source: existing?.source || '',
    status: existing?.status || 'New',
    notes: existing?.notes || '',
    followUpDate: existing?.followUpDate || '',
  });

  if (!existing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Lead nahi mila 😕</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Wapas Jao</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('⚠️ Error', 'Name dalna zaroori hai');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('⚠️ Error', 'Phone number dalna zaroori hai');
      return;
    }

    setLoading(true);
    try {
      const updated: Lead = { ...existing, ...form };
      await updateLead(updated);
      Alert.alert('✅ Success!', 'Lead update ho gaya!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Update nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '🗑️ Lead Delete Karo?',
      `${existing.name} ka lead permanently delete ho jayega. Pakka?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteLead(existing.id);
              // Detail screen bhi band karo, seedha list pe jao
              router.replace('/(tabs)/leads');
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'Delete nahi ho saka');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <FormField label="👤 Naam">
          <TextInput
            style={styles.input}
            placeholder="Lead ka naam"
            placeholderTextColor={COLORS.textSecondary}
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
          />
        </FormField>

        <FormField label="📞 Phone Number">
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={COLORS.textSecondary}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
          />
        </FormField>

        <FormField label="✉️ Email">
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={COLORS.textSecondary}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="🏙️ City / Sheher">
          <TextInput
            style={styles.input}
            placeholder="Delhi, Mumbai, ..."
            placeholderTextColor={COLORS.textSecondary}
            value={form.city}
            onChangeText={(v) => updateField('city', v)}
          />
        </FormField>

        <FormField label="📣 Source">
          <TouchableOpacity style={styles.selectField} onPress={() => setShowSourceModal(true)}>
            <Text style={form.source ? styles.selectText : styles.placeholderText}>
              {form.source || 'Source select karo...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </FormField>

        <FormField label="🏷️ Status">
          <TouchableOpacity style={styles.selectField} onPress={() => setShowStatusModal(true)}>
            <Text style={styles.selectText}>
              {STATUS_CONFIG[form.status]?.emoji} {form.status}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </FormField>

        <FormField label="📞 Agli Call Kab?">
          <TouchableOpacity style={styles.selectField} onPress={() => setScheduleVisible(true)}>
            <Text style={form.followUpDate ? styles.selectText : styles.placeholderText}>
              {form.followUpDate ? formatCallWhen(form.followUpDate) : 'Call time select karo...'}
            </Text>
            <Ionicons name="alarm-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          {form.followUpDate ? (
            <TouchableOpacity onPress={() => updateField('followUpDate', '')}>
              <Text style={styles.clearDate}>✕ Clear</Text>
            </TouchableOpacity>
          ) : null}
        </FormField>

        <FormField label="📝 Notes / Remarks">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Lead ke baare mein notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={form.notes}
            onChangeText={(v) => updateField('notes', v)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </FormField>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabled]}
          onPress={handleSave}
          disabled={loading || deleting}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Changes Save Karo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.disabled]}
          onPress={handleDelete}
          disabled={loading || deleting}
        >
          {deleting ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              <Text style={styles.deleteText}>Lead Delete Karo</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>

      <ScheduleCallModal
        visible={scheduleVisible}
        leadName={form.name}
        currentDate={form.followUpDate}
        onPick={(iso) => {
          updateField('followUpDate', iso);
          setScheduleVisible(false);
        }}
        onClose={() => setScheduleVisible(false)}
        allowClear
      />

      <SelectModal
        visible={showSourceModal}
        title="Source Select Karo"
        options={LEAD_SOURCES}
        selected={form.source}
        onSelect={(v) => {
          updateField('source', v);
          setShowSourceModal(false);
        }}
        onClose={() => setShowSourceModal(false)}
      />

      <SelectModal
        visible={showStatusModal}
        title="Status Select Karo"
        options={STATUS_OPTIONS}
        selected={form.status}
        onSelect={(v) => {
          updateField('status', v);
          setShowStatusModal(false);
        }}
        onClose={() => setShowStatusModal(false)}
        renderOption={(option) => `${STATUS_CONFIG[option]?.emoji || ''} ${option}`}
      />
    </ScrollView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  renderOption,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  renderOption?: (option: string) => string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.modalOption, selected === option && styles.modalOptionSelected]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selected === option && styles.modalOptionTextSelected,
                ]}
              >
                {renderOption ? renderOption(option) : option}
              </Text>
              {selected === option && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: 20, gap: 4 },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  notFoundText: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  backLink: { color: COLORS.primary, fontSize: 16 },
  fieldContainer: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { height: 110, paddingTop: 14 },
  selectField: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { color: COLORS.text, fontSize: 15 },
  placeholderText: { color: COLORS.textSecondary, fontSize: 15 },
  clearDate: { color: COLORS.danger, fontSize: 12, marginTop: 6, marginLeft: 4 },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteButton: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  deleteText: { color: COLORS.danger, fontWeight: '600', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 6,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  modalOptionSelected: { borderWidth: 1, borderColor: COLORS.primary },
  modalOptionText: { color: COLORS.textSecondary, fontSize: 15 },
  modalOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
});
