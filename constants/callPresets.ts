// Quick "next call" presets. Each returns a fresh Date computed from "now".
export interface CallPreset {
  key: string;
  label: string;
  getDate: () => Date;
}

function at(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const CALL_PRESETS: CallPreset[] = [
  { key: 'today_eve', label: '🌆 Aaj shaam 6 PM', getDate: () => at(0, 18) },
  { key: 'tom_10', label: '☀️ Kal 10 AM', getDate: () => at(1, 10) },
  { key: 'tom_4', label: '🕓 Kal 4 PM', getDate: () => at(1, 16) },
  { key: '2d_11', label: '📅 2 din baad 11 AM', getDate: () => at(2, 11) },
  { key: 'week_10', label: '📆 Agle hafte 10 AM', getDate: () => at(7, 10) },
];

// Sirf future presets dikhao (jo nikal chuke unhe hide karo)
export function activePresets(): CallPreset[] {
  const now = Date.now();
  return CALL_PRESETS.filter((p) => p.getDate().getTime() > now);
}

// Short label like "Aaj 4:00 PM", "Kal 10:00 AM", "22 Oct 11:00 AM"
export function formatCallWhen(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  let day: string;
  if (diffDays === 0) day = 'Aaj';
  else if (diffDays === 1) day = 'Kal';
  else if (diffDays === -1) day = 'Kal (beeta)';
  else day = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
  return `${day} ${time}`;
}
