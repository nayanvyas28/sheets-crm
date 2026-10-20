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
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeadsStore } from '../../store/leadsStore';
import { COLORS, STATUS_CONFIG, LEAD_SOURCES } from '../../constants/config';
import { formatCallWhen } from '../../constants/callPresets';
import ScheduleCallModal from '../../components/ScheduleCallModal';

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

export default function AddLeadScreen() {
  const router = useRouter();
  const { addLead } = useLeadsStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    source: '',
    status: 'New',
    notes: '',
    followUpDate: '',
  });

  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
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
      await addLead(form);
      const addedName = form.name;
      // Form reset karo taaki agla lead fresh ho
      setForm({
        name: '',
        phone: '',
        email: '',
        city: '',
        source: '',
        status: 'New',
        notes: '',
        followUpDate: '',
      });
      Alert.alert('✅ Success!', `${addedName} ka lead add ho gaya!`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/leads') },
      ]);
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Lead add nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Name */}
        <FormField label="👤 Naam *" required>
          <TextInput
            style={styles.input}
            placeholder="Lead ka naam"
            placeholderTextColor={COLORS.textSecondary}
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
          />
        </FormField>

        {/* Phone */}
        <FormField label="📞 Phone Number *" required>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={COLORS.textSecondary}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
          />
        </FormField>

        {/* Email */}
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

        {/* City */}
        <FormField label="🏙️ City / Sheher">
          <TextInput
            style={styles.input}
            placeholder="Delhi, Mumbai, ..."
            placeholderTextColor={COLORS.textSecondary}
            value={form.city}
            onChangeText={(v) => updateField('city', v)}
          />
        </FormField>

        {/* Source */}
        <FormField label="📣 Source (Kahaan se aaya)">
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowSourceModal(true)}
          >
            <Text style={form.source ? styles.selectText : styles.placeholderText}>
              {form.source || 'Source select karo...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </FormField>

        {/* Status */}
        <FormField label="🏷️ Status">
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.selectText}>
              {STATUS_CONFIG[form.status]?.emoji} {form.status}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </FormField>

        {/* Next Call (date + time) */}
        <FormField label="📞 Agli Call Kab?">
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setScheduleVisible(true)}
          >
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

        {/* Notes */}
        <FormField label="📝 Notes / Remarks">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Lead ke baare mein kuch notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={form.notes}
            onChangeText={(v) => updateField('notes', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </FormField>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Lead Save Karo (Google Sheet)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>

      {/* Next Call scheduler */}
      <ScheduleCallModal
        visible={scheduleVisible}
        currentDate={form.followUpDate}
        onPick={(iso) => {
          updateField('followUpDate', iso);
          setScheduleVisible(false);
        }}
        onClose={() => setScheduleVisible(false)}
        allowClear
      />

      {/* Source Modal */}
      <SelectModal
        visible={showSourceModal}
        title="Source Select Karo"
        options={LEAD_SOURCES}
        selected={form.source}
        onSelect={(v) => { updateField('source', v); setShowSourceModal(false); }}
        onClose={() => setShowSourceModal(false)}
      />

      {/* Status Modal */}
      <SelectModal
        visible={showStatusModal}
        title="Status Select Karo"
        options={STATUS_OPTIONS}
        selected={form.status}
        onSelect={(v) => { updateField('status', v); setShowStatusModal(false); }}
        onClose={() => setShowStatusModal(false)}
        renderOption={(option) => (
          `${STATUS_CONFIG[option]?.emoji || ''} ${option}`
        )}
      />
    </ScrollView>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: 20,
    gap: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: COLORS.danger,
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
  textArea: {
    height: 100,
    paddingTop: 14,
  },
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
  selectText: {
    color: COLORS.text,
    fontSize: 15,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  clearDate: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  modalOptionSelected: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalOptionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
