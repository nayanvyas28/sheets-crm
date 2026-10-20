// ============================================================
// App Configuration
// Google Sheet ka connection services/sheetsApi.ts (Apps Script URL) se hota hai.
// WhatsApp message templates ab app ke andar Settings se manage hote hain
// (services/templates.ts).
// ============================================================

// App Theme Colors
export const COLORS = {
  background: '#0f0f1a',
  surface: '#1a1a2e',
  card: '#16213e',
  primary: '#6c63ff',
  primaryLight: '#8b84ff',
  accent: '#f72585',
  success: '#4cc9f0',
  warning: '#f7b731',
  danger: '#ff6b6b',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  border: '#2d2d4a',
  gradient: ['#6c63ff', '#4cc9f0'],
};

// Lead Status Config
export const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  New: { label: 'New Lead', color: '#6c63ff', emoji: '🆕' },
  Contacted: { label: 'Contacted', color: '#4cc9f0', emoji: '📞' },
  Interested: { label: 'Interested', color: '#f7b731', emoji: '🌟' },
  'Not Interested': { label: 'Not Interested', color: '#ff6b6b', emoji: '❌' },
  Converted: { label: 'Converted', color: '#4ecb71', emoji: '✅' },
  Lost: { label: 'Lost', color: '#a0a0b8', emoji: '💔' },
};

// Lead Sources
export const LEAD_SOURCES = [
  'Website',
  'Phone Call',
  'WhatsApp',
  'Referral',
  'Instagram',
  'Facebook',
  'Walk-in',
  'Other',
];
