import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import { setAppsScriptUrl } from '../../services/sheetsApi';
import { useLeadsStore } from '../../store/leadsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadTemplates,
  saveTemplates,
  newTemplateId,
  WaTemplate,
} from '../../services/templates';

export default function SettingsScreen() {
  const { fetchLeads } = useLeadsStore();
  const [appsScriptUrl, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  // WhatsApp templates
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editText, setEditText] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('APPS_SCRIPT_URL').then((url) => {
      if (url) {
        setUrl(url);
        setAppsScriptUrl(url);
      }
    });
    loadTemplates().then(setTemplates);
  }, []);

  const persistTemplates = async (list: WaTemplate[]) => {
    setTemplates(list);
    await saveTemplates(list);
  };

  const openNewTemplate = () => {
    setEditId(null);
    setEditLabel('');
    setEditText('');
    setEditorVisible(true);
  };

  const openEditTemplate = (t: WaTemplate) => {
    setEditId(t.id);
    setEditLabel(t.label);
    setEditText(t.text);
    setEditorVisible(true);
  };

  const saveTemplate = async () => {
    if (!editLabel.trim() || !editText.trim()) {
      Alert.alert('⚠️', 'Label aur message dono bharo');
      return;
    }
    let list: WaTemplate[];
    if (editId) {
      list = templates.map((t) =>
        t.id === editId ? { ...t, label: editLabel.trim(), text: editText } : t
      );
    } else {
      list = [...templates, { id: newTemplateId(), label: editLabel.trim(), text: editText }];
    }
    await persistTemplates(list);
    setEditorVisible(false);
  };

  const deleteTemplate = (t: WaTemplate) => {
    Alert.alert('🗑️ Delete?', `"${t.label}" template delete karein?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => persistTemplates(templates.filter((x) => x.id !== t.id)),
      },
    ]);
  };

  const handleSaveUrl = async () => {
    if (!appsScriptUrl.startsWith('https://script.google.com')) {
      Alert.alert('❌ Invalid URL', 'Google Apps Script URL sahi dalo');
      return;
    }
    setAppsScriptUrl(appsScriptUrl);
    await AsyncStorage.setItem('APPS_SCRIPT_URL', appsScriptUrl);
    setSaved(true);
    Alert.alert('✅ Saved!', 'URL save ho gayi. Ab leads sync karo.');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestSync = async () => {
    try {
      await fetchLeads();
      Alert.alert('✅ Success!', 'Google Sheet se data aa gaya!');
    } catch (error: any) {
      Alert.alert('❌ Sync Failed', error.message);
    }
  };

  const openAppsScriptGuide = () => {
    Linking.openURL('https://developers.google.com/apps-script/guides/web');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Setup Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>🚀 Setup Guide</Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>Step 1: </Text>
            Google Sheets mein naya sheet banao jiska naam "Leads" ho
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>Step 2: </Text>
            Extensions → Apps Script mein jao
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>Step 3: </Text>
            Neeche diya hua code paste karo aur Deploy karo as Web App
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>Step 4: </Text>
            "Anyone" ko access do aur URL copy karo
          </Text>
          <Text style={styles.guideStep}>
            <Text style={styles.stepNum}>Step 5: </Text>
            Neeche URL paste karo aur Save karo
          </Text>

          <TouchableOpacity style={styles.docsButton} onPress={openAppsScriptGuide}>
            <Ionicons name="book-outline" size={16} color={COLORS.primary} />
            <Text style={styles.docsButtonText}>Apps Script Docs Dekho</Text>
          </TouchableOpacity>
        </View>

        {/* Apps Script Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>📋 Apps Script Code</Text>
          <Text style={styles.codeSubtitle}>Ye code Apps Script mein paste karo:</Text>
          <ScrollView horizontal style={styles.codeScroll}>
            <Text style={styles.code}>{APPS_SCRIPT_CODE}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.copyHint}
            onPress={() => Alert.alert('💡', 'Code ko select karke copy karo')}
          >
            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
            <Text style={styles.copyHintText}>Code copy karo</Text>
          </TouchableOpacity>
        </View>

        {/* URL Input */}
        <View style={styles.urlCard}>
          <Text style={styles.urlTitle}>🔗 Apps Script Web App URL</Text>
          <TextInput
            style={styles.urlInput}
            placeholder="https://script.google.com/macros/s/..."
            placeholderTextColor={COLORS.textSecondary}
            value={appsScriptUrl}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveButton, saved && styles.savedButton]}
            onPress={handleSaveUrl}
          >
            <Ionicons
              name={saved ? 'checkmark-circle' : 'save-outline'}
              size={18}
              color="#fff"
            />
            <Text style={styles.saveButtonText}>{saved ? 'Saved! ✓' : 'URL Save Karo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Test Sync */}
        <TouchableOpacity style={styles.syncButton} onPress={handleTestSync}>
          <Ionicons name="sync-outline" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>Test Sync Karo</Text>
        </TouchableOpacity>

        {/* WhatsApp Templates */}
        <View style={styles.urlCard}>
          <View style={styles.waHeader}>
            <Text style={styles.urlTitle}>💬 WhatsApp Messages</Text>
            <TouchableOpacity style={styles.waAddBtn} onPress={openNewTemplate}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.waAddText}>Naya</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.waHint}>
            Apne custom messages banao. {'{name}'} likho wahan lead ka naam aa jayega.
          </Text>
          {templates.map((t) => (
            <View key={t.id} style={styles.waItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.waLabel}>{t.label}</Text>
                <Text style={styles.waPreview} numberOfLines={2}>
                  {t.text}
                </Text>
              </View>
              <TouchableOpacity style={styles.waIcon} onPress={() => openEditTemplate(t)}>
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.waIcon} onPress={() => deleteTemplate(t)}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {templates.length === 0 && (
            <Text style={styles.waEmpty}>Koi template nahi — "Naya" daba ke banao.</Text>
          )}
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 App Info</Text>
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Developer" value="Nayan" />
          <InfoRow label="Stack" value="Expo + React Native" />
          <InfoRow label="Database" value="Google Sheets" />
        </View>
      </View>

      {/* Template Editor Modal */}
      <Modal
        visible={editorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editorModal}>
            <Text style={styles.editorTitle}>
              {editId ? '✏️ Message Edit' : '➕ Naya Message'}
            </Text>
            <Text style={styles.editorFieldLabel}>Button ka naam</Text>
            <TextInput
              style={styles.editorInput}
              placeholder="e.g. 👋 Greeting"
              placeholderTextColor={COLORS.textSecondary}
              value={editLabel}
              onChangeText={setEditLabel}
            />
            <Text style={styles.editorFieldLabel}>Message ({'{name}'} = lead ka naam)</Text>
            <TextInput
              style={[styles.editorInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Namaste {name} ji! ..."
              placeholderTextColor={COLORS.textSecondary}
              value={editText}
              onChangeText={setEditText}
              multiline
            />
            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.editorCancel} onPress={() => setEditorVisible(false)}>
                <Text style={styles.editorCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editorSave} onPress={saveTemplate}>
                <Text style={styles.editorSaveText}>💾 Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const APPS_SCRIPT_CODE = `var HEADERS = ['ID','Name','Phone','Email','City','Source','Status',
  'Notes','Follow-up Date','Last Called','Call Count','Created At'];

function doGet(e){ return handleRequest(e); }
function doPost(e){ return handleRequest(e); }

function json(o){
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeader(sheet){
  if (sheet.getLastRow() === 0){
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  sheet.getRange('C2:C').setNumberFormat('@');
  sheet.getRange('I2:L').setNumberFormat('@');
}

function handleRequest(e){
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
    var params = e.parameter || {};
    var postData = {};
    if (e.postData && e.postData.contents) postData = JSON.parse(e.postData.contents);
    var action = params.action || postData.action;

    if (action === 'getLeads'){
      var data = sheet.getLastRow() === 0 ? [] : sheet.getDataRange().getValues();
      return json({success:true, data:data});
    }
    if (action === 'addLead'){
      ensureHeader(sheet);
      sheet.appendRow(postData.data);
      return json({success:true});
    }
    if (action === 'updateLead'){
      ensureHeader(sheet);
      var r = postData.rowIndex, d = postData.data;
      if (!r || r < 2) return json({error:'Invalid rowIndex'});
      sheet.getRange(r,1,1,d.length).setValues([d]);
      return json({success:true});
    }
    if (action === 'deleteLead'){
      var dr = postData.rowIndex;
      if (!dr || dr < 2) return json({error:'Invalid rowIndex'});
      sheet.deleteRow(dr);
      return json({success:true});
    }
    if (action === 'initSheet'){
      ensureHeader(sheet);
      return json({success:true});
    }
    return json({error:'Unknown action: ' + action});
  } catch(err){
    return json({error: err.toString()});
  }
}`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  guideCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  guideStep: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  stepNum: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  docsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    alignSelf: 'flex-start',
  },
  docsButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  codeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  codeSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  codeScroll: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 12,
    maxHeight: 200,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#a9dc76',
    lineHeight: 18,
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  copyHintText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  urlCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  urlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  urlInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 13,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  savedButton: {
    backgroundColor: '#4ecb71',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  syncButton: {
    backgroundColor: COLORS.success,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  syncButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  waHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  waAddText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  waHint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  waItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waLabel: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  waPreview: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  waIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waEmpty: { color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  editorModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
  },
  editorTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  editorFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  editorInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  editorActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editorCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  editorCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  editorSave: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editorSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
