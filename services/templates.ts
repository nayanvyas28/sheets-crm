import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom WhatsApp message templates. `text` may contain {name} which is
// replaced with the lead's name when sending.
export interface WaTemplate {
  id: string;
  label: string;
  text: string;
}

const KEY = 'WA_TEMPLATES';

export const DEFAULT_TEMPLATES: WaTemplate[] = [
  {
    id: 'greeting',
    label: '👋 Greeting',
    text: 'Namaste {name} ji! 🙏\n\nAapka hamare paas call aya tha. Main aapki kaise madad kar sakta hoon?',
  },
  {
    id: 'followup',
    label: '🔄 Follow-up',
    text: 'Namaste {name} ji! 🙏\n\nYe follow-up message hai. Kya aap hamare baare mein kuch jaanna chahte hain?',
  },
  {
    id: 'thankyou',
    label: '🙏 Thank You',
    text: 'Dhanyawad {name} ji! 🙏\n\nAapne hamare saath samay diya, hum bahut aabhari hain.',
  },
];

export async function loadTemplates(): Promise<WaTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export async function saveTemplates(list: WaTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function applyTemplate(text: string, name: string): string {
  return (text || '').replace(/\{name\}/gi, name || '');
}

export function newTemplateId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
