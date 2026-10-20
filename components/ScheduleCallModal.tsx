import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/config';
import { activePresets, formatCallWhen } from '../constants/callPresets';

export default function ScheduleCallModal({
  visible,
  leadName,
  currentDate,
  onPick,
  onClose,
  allowClear,
}: {
  visible: boolean;
  leadName?: string;
  currentDate?: string;
  onPick: (iso: string) => void;
  onClose: () => void;
  allowClear?: boolean;
}) {
  const [pickDate, setPickDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  const startCustom = () => {
    setPickDate(currentDate ? new Date(currentDate) : new Date());
    setMode('date');
  };

  const onChange = (_: any, selected?: Date) => {
    if (!selected) {
      setMode(null);
      return;
    }
    if (mode === 'date') {
      // date chuni, ab time maango
      const d = new Date(pickDate || new Date());
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setPickDate(d);
      setMode('time');
    } else if (mode === 'time') {
      const d = new Date(pickDate || new Date());
      d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setMode(null);
      onPick(d.toISOString());
    }
  };

  const presets = activePresets();

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.sheet}>
            <Text style={styles.title}>📞 Agli Call Kab?</Text>
            {leadName ? <Text style={styles.subtitle}>{leadName}</Text> : null}
            {currentDate ? (
              <Text style={styles.current}>Abhi set hai: {formatCallWhen(currentDate)}</Text>
            ) : null}

            <View style={styles.presetWrap}>
              {presets.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={styles.preset}
                  onPress={() => onPick(p.getDate().toISOString())}
                >
                  <Text style={styles.presetText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.customBtn} onPress={startCustom}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.customText}>Custom date & time</Text>
            </TouchableOpacity>

            {allowClear && currentDate ? (
              <TouchableOpacity style={styles.clearBtn} onPress={() => onPick('')}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.clearText}>Call hata do (clear)</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {mode && (
        <DateTimePicker
          value={pickDate || new Date()}
          mode={mode}
          display="default"
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={onChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 10,
  },
  title: { fontSize: 19, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: -4 },
  current: { fontSize: 12, color: COLORS.warning, marginBottom: 4 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginTop: 6,
  },
  customText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  clearText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
});
