export interface ActivityEntry {
  id: string;
  activityId: string;
  startTime: string; // HH:MM
  endTime?: string;  // HH:MM
  comment?: string;
}

export interface MoodSnapshot {
  id: string;
  time: string; // HH:MM
  mood: number; // 0-10
  energy: number; // 0-10
  comment?: string;
}

export type EventMultiplier = 1 | 2 | 3 | 5 | 10;

export interface EventEntry {
  eventId: string;
  multiplier: EventMultiplier;
  description?: string;
}

export interface EventGroup {
  id: string;
  label: string;
}

export interface EventType {
  id: string;
  label: string;
  emoji: string;
  groupId?: string;
}

export interface DayLog {
  id: string;
  date: string; // YYYY-MM-DD
  sleep: { hours: number; quality: number }; // quality 0-10
  mood: number; // 0-10 (итоговое)
  energy: number; // 0-10 (итоговое)
  work: null | 'plus' | 'normal' | 'minus';
  training: null | 'plus' | 'normal' | 'minus';
  steps: number;
  nutrition: { calories: number; protein?: number; fat?: number; carbs?: number };
  events: EventEntry[];
  virtue: string | null;
  virtueNote: string;
  archetype: string | null;
  archetypeSecondary: string | null;
  reflection: string;
  status: 'draft' | 'partial' | 'complete';
  activities: ActivityEntry[];
  moodSnapshots: MoodSnapshot[];
  detectedArchetype?: string | null;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'sleep' | 'body' | 'psyche' | 'productivity' | 'relations';
  prism?: 'pattern' | 'virtue' | 'archetype';
  strength: number; // 0-1 correlation strength
  advice: string;
  chartData: { name: string; value1: number; value2?: number }[];
}

export const VIRTUES = ['Мудрость', 'Умеренность', 'Мужество', 'Справедливость'] as const;

export const ARCHETYPES = [
  { id: 'sage', name: 'Мудрец', nameEn: 'The Sage', traits: ['рефлексия', 'анализ', 'причинно-следственные связи'] },
  { id: 'ruler', name: 'Правитель', nameEn: 'The Ruler', traits: ['системы учёта', 'контроль', 'организация'] },
  { id: 'hero', name: 'Герой', nameEn: 'The Hero', traits: ['дисциплина', 'преодоление', 'действия через боль'] },
  { id: 'explorer', name: 'Искатель', nameEn: 'The Explorer', traits: ['поиск смысла', 'эксперименты', 'избегание застоя'] },
] as const;

export interface ActivityType {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const DEFAULT_ACTIVITIES: ActivityType[] = [
  { id: 'work', label: 'Работа', emoji: '💼', color: '#3b82f6' },
  { id: 'sport', label: 'Спорт', emoji: '🏋️', color: '#10b981' },
  { id: 'reading', label: 'Чтение', emoji: '📚', color: '#8b5cf6' },
  { id: 'social_media', label: 'Соцсети', emoji: '📱', color: '#f43f5e' },
  { id: 'socializing', label: 'Общение', emoji: '👥', color: '#f59e0b' },
  { id: 'family', label: 'Семья', emoji: '🏠', color: '#ec4899' },
  { id: 'cooking', label: 'Готовка', emoji: '🍳', color: '#f97316' },
  { id: 'studying', label: 'Учёба', emoji: '🎓', color: '#6366f1' },
  { id: 'hobby', label: 'Хобби', emoji: '🎨', color: '#14b8a6' },
  { id: 'walking', label: 'Прогулка', emoji: '🚶', color: '#22c55e' },
  { id: 'rest', label: 'Отдых', emoji: '😴', color: '#94a3b8' },
  { id: 'meditation', label: 'Медитация', emoji: '🧘', color: '#a78bfa' },
  { id: 'commute', label: 'Дорога', emoji: '🚗', color: '#78716c' },
  { id: 'entertainment', label: 'Развлечения', emoji: '🎮', color: '#e879f9' },
];

/** @deprecated Use useActivities() hook instead */
export const ACTIVITIES = DEFAULT_ACTIVITIES;

export const DEFAULT_EVENT_GROUPS: EventGroup[] = [
  { id: 'negative', label: 'Вредное' },
  { id: 'positive', label: 'Хорошее' },
];

export const DEFAULT_EVENT_TAGS: EventType[] = [
  { id: 'alcohol', label: 'Алкоголь', emoji: '🍷', groupId: 'negative' },
  { id: 'binge', label: 'Жор', emoji: '🍔', groupId: 'negative' },
  { id: 'panic', label: 'ПА', emoji: '😰', groupId: 'negative' },
  { id: 'pm', label: 'ПМ', emoji: '💭', groupId: 'negative' },
  { id: 'smoking', label: 'Курение', emoji: '🚬', groupId: 'negative' },
  { id: 'conflict', label: 'Конфликт', emoji: '⚡', groupId: 'negative' },
  { id: 'bad_news', label: 'Плохая новость', emoji: '😞', groupId: 'negative' },
  { id: 'good_news', label: 'Хорошая новость', emoji: '🎉', groupId: 'positive' },
  { id: 'insight', label: 'Озарение', emoji: '💡', groupId: 'positive' },
  { id: 'gratitude', label: 'Благодарность', emoji: '🙏', groupId: 'positive' },
];

/** @deprecated Use useEvents() hook instead */
export const EVENT_TAGS = DEFAULT_EVENT_TAGS;

export const MOOD_LABELS: Record<number, string> = {
  0: 'ужасно',
  1: 'очень плохо',
  2: 'плохо',
  3: 'тяжело',
  4: 'ниже среднего',
  5: 'нормально',
  6: 'неплохо',
  7: 'хорошо',
  8: 'очень хорошо',
  9: 'отлично',
  10: 'великолепно',
};