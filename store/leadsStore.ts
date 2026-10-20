import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead } from '../types';
import { SheetsAPI } from '../services/sheetsApi';
import { scheduleFollowUpReminder, cancelFollowUpReminder } from '../services/notifications';

const CACHE_KEY = 'CACHED_LEADS';

function cacheLeads(leads: Lead[]) {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(leads)).catch(() => {});
}

interface LeadsStore {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  
  // Actions
  hydrate: () => Promise<void>;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'rowIndex' | 'createdAt' | 'callCount' | 'lastCalled'>) => Promise<void>;
  updateLead: (lead: Lead) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  logCall: (leadId: string, outcome: string, notes: string) => Promise<void>;
  updateStatus: (leadId: string, status: string) => Promise<void>;
  setNextCall: (leadId: string, iso: string) => Promise<void>;
  
  // Computed helpers
  getLeadById: (id: string) => Lead | undefined;
  getTodayFollowUps: () => Lead[];
  getStatsByStatus: () => Record<string, number>;
}

export const useLeadsStore = create<LeadsStore>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  lastSynced: null,

  // App start pe cached leads turant dikha do (instant open)
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: Lead[] = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length && get().leads.length === 0) {
          set({ leads: cached });
        }
      }
    } catch {
      // ignore
    }
  },

  fetchLeads: async () => {
    set({ loading: true, error: null });
    try {
      const leads = await SheetsAPI.getLeads();
      set({ leads, loading: false, lastSynced: new Date() });
      cacheLeads(leads);
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Leads load nahi ho sake' });
    }
  },

  addLead: async (leadData) => {
    set({ loading: true, error: null });
    try {
      const newLead = await SheetsAPI.addLead(leadData);
      set((state) => ({
        leads: [newLead, ...state.leads],
        loading: false,
      }));
      cacheLeads(get().leads);

      // Follow-up reminder set karo
      if (newLead.followUpDate) {
        await scheduleFollowUpReminder(newLead.id, newLead.name, newLead.followUpDate);
      }
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Lead add nahi ho saka' });
      throw error;
    }
  },

  updateLead: async (lead) => {
    try {
      await SheetsAPI.updateLead(lead);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === lead.id ? lead : l)),
      }));
      cacheLeads(get().leads);

      // Reminder update karo
      if (lead.followUpDate) {
        await scheduleFollowUpReminder(lead.id, lead.name, lead.followUpDate);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteLead: async (leadId) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;

    try {
      await SheetsAPI.deleteLead(lead);
      await cancelFollowUpReminder(leadId);
      // Optimistic remove for instant UI feedback
      set((state) => ({
        leads: state.leads.filter((l) => l.id !== leadId),
      }));
      // Deleting a row shifts every later row up by one, so rowIndex values
      // go stale — re-sync from the sheet to keep future edits accurate.
      await get().fetchLeads();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  logCall: async (leadId, outcome, notes) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;

    try {
      const updatedLead = await SheetsAPI.logCall(lead, outcome, notes);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      }));
      cacheLeads(get().leads);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateStatus: async (leadId, status) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;

    try {
      const updatedLead = await SheetsAPI.updateStatus(lead, status);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      }));
      cacheLeads(get().leads);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Agli call ki date+time set karo (ya '' = clear)
  setNextCall: async (leadId, iso) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;
    const updated: Lead = { ...lead, followUpDate: iso };
    try {
      await SheetsAPI.updateLead(updated);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
      }));
      cacheLeads(get().leads);
      if (iso) {
        await scheduleFollowUpReminder(leadId, updated.name, iso);
      } else {
        await cancelFollowUpReminder(leadId);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  getLeadById: (id) => get().leads.find((l) => l.id === id),

  getTodayFollowUps: () => {
    const today = new Date().toDateString();
    return get().leads.filter((l) => {
      if (!l.followUpDate) return false;
      return new Date(l.followUpDate).toDateString() === today;
    });
  },

  getStatsByStatus: () => {
    const stats: Record<string, number> = {};
    get().leads.forEach((lead) => {
      stats[lead.status] = (stats[lead.status] || 0) + 1;
    });
    return stats;
  },
}));
