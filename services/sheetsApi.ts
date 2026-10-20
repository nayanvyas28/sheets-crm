import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead } from '../types';

// ============================================================
// Google Sheets API Service — Google Apps Script Web App
// Sheet structure:
// Col A: ID | B: Name | C: Phone | D: Email | E: City
// Col F: Source | G: Status | H: Notes | I: Follow-up Date
// Col J: Last Called | K: Call Count | L: Created At
// ============================================================

// ✅ Teri Apps Script Web App URL — Already Set Hai!
let APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxUZRC19rdm28soxx7ItQwQSzD9_W8johC-FZjJROoL1UM9GR4Ld3OeaPk0m5KPpBnOJw/exec';

export function setAppsScriptUrl(url: string) {
  if (url && url.trim()) APPS_SCRIPT_URL = url.trim();
}

export function getAppsScriptUrl(): string {
  return APPS_SCRIPT_URL;
}

// App start pe saved URL load karo (agar user ne custom set kiya ho)
export async function loadSavedAppsScriptUrl(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem('APPS_SCRIPT_URL');
    if (saved) setAppsScriptUrl(saved);
  } catch {
    // ignore — default URL use hoga
  }
}


// Safely convert any cell value (string | number | Date | null) into a string.
// Google Sheets returns numbers for phone/count columns and Date objects for
// date columns, so we must coerce everything or things like `phone.includes()`
// will crash the UI.
function cell(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// Parse a sheet row array into Lead object
function rowToLead(row: any[], rowIndex: number): Lead {
  return {
    id: cell(row[0]) || `lead_${rowIndex}`,
    name: cell(row[1]),
    phone: cell(row[2]),
    email: cell(row[3]),
    city: cell(row[4]),
    source: cell(row[5]),
    status: cell(row[6]) || 'New',
    notes: cell(row[7]),
    followUpDate: cell(row[8]),
    lastCalled: cell(row[9]),
    callCount: parseInt(cell(row[10]) || '0', 10) || 0,
    createdAt: cell(row[11]) || new Date().toISOString(),
    rowIndex,
  };
}

// Lead object ko sheet row array mein convert karo
function leadToRow(lead: Partial<Lead>): string[] {
  return [
    lead.id || generateId(),
    lead.name || '',
    lead.phone || '',
    lead.email || '',
    lead.city || '',
    lead.source || '',
    lead.status || 'New',
    lead.notes || '',
    lead.followUpDate || '',
    lead.lastCalled || '',
    String(lead.callCount || 0),
    lead.createdAt || new Date().toISOString(),
  ];
}

function generateId(): string {
  return `L${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

// ============================================================
// CRUD Operations via Google Apps Script Web App
// ============================================================

export const SheetsAPI = {
  // All leads fetch karo
  async getLeads(): Promise<Lead[]> {
    try {
      const response = await axios.get(APPS_SCRIPT_URL, {
        params: { action: 'getLeads' },
        timeout: 15000,
      });
      
      if (response.data.error) throw new Error(response.data.error);
      
      const rows: any[][] = response.data.data || [];
      // First row is header, skip it. Also drop fully-empty rows so a blank
      // trailing row in the sheet doesn't show up as a ghost lead.
      return rows
        .slice(1)
        .map((row, i) => rowToLead(row, i + 2))
        .filter((lead) => lead.name.trim() !== '' || lead.phone.trim() !== '');
    } catch (error: any) {
      console.error('getLeads error:', error.message);
      throw error;
    }
  },

  // Naya lead add karo
  async addLead(leadData: Omit<Lead, 'id' | 'rowIndex' | 'createdAt' | 'callCount' | 'lastCalled'>): Promise<Lead> {
    const newLead: Lead = {
      ...leadData,
      id: generateId(),
      callCount: 0,
      lastCalled: '',
      createdAt: new Date().toISOString(),
    };

    const row = leadToRow(newLead);

    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'addLead',
      data: row,
    });

    if (response.data.error) throw new Error(response.data.error);
    return newLead;
  },

  // Lead update karo
  async updateLead(lead: Lead): Promise<void> {
    const row = leadToRow(lead);
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'updateLead',
      rowIndex: lead.rowIndex,
      data: row,
    });
    if (response.data.error) throw new Error(response.data.error);
  },

  // Call log karo (Sheet mein note + count update)
  async logCall(lead: Lead, callOutcome: string, callNotes: string): Promise<Lead> {
    const newCallCount = lead.callCount + 1;
    const callEntry = `Call ${newCallCount} (${new Date().toLocaleDateString('hi-IN')}): ${callOutcome} - ${callNotes}`;
    
    const updatedNotes = lead.notes
      ? `${lead.notes}\n${callEntry}`
      : callEntry;

    const updatedLead: Lead = {
      ...lead,
      callCount: newCallCount,
      lastCalled: new Date().toISOString(),
      notes: updatedNotes,
      status: lead.status === 'New' ? 'Contacted' : lead.status,
    };

    await SheetsAPI.updateLead(updatedLead);
    return updatedLead;
  },

  // Lead status update karo
  async updateStatus(lead: Lead, newStatus: string): Promise<Lead> {
    const updatedLead = { ...lead, status: newStatus };
    await SheetsAPI.updateLead(updatedLead);
    return updatedLead;
  },

  // Lead delete karo (sheet se row hata do)
  async deleteLead(lead: Lead): Promise<void> {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'deleteLead',
      rowIndex: lead.rowIndex,
    });
    if (response.data.error) throw new Error(response.data.error);
  },

  // Header row initialize karo (first time setup)
  async initializeSheet(): Promise<void> {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'initSheet',
    });
    if (response.data.error) throw new Error(response.data.error);
  },
};
