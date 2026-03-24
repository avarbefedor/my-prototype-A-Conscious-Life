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
  trigger?: 'work' | 'rest' | 'social' | 'physical' | 'event' | 'spontaneous';
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
  // Legacy philosophical fields (kept for backward compat)
  virtue: string | null;
  virtueNote: string;
  archetype: string | null;
  archetypeSecondary: string | null;
  detectedArchetype?: string | null;
  // New lens system
  lensValues?: Record<string, LensValue>;
  morningIntent?: string;
  reflection: string;
  status: 'draft' | 'partial' | 'complete';
  activities: ActivityEntry[];
  moodSnapshots: MoodSnapshot[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'sleep' | 'body' | 'psyche' | 'productivity' | 'relations';
  prism?: 'pattern' | 'virtue' | 'archetype';
  layer: 'base' | 'patterns' | 'energy' | 'lenses';
  strength: number; // 0-1 correlation strength
  observationCount?: number;
  locked?: boolean;
  advice: string;
  chartData: { name: string; value1: number; value2?: number }[];
}

// ---- Lens system ----

export interface LensAnchor {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  color?: string;
  detectionRules?: { activityIds?: string[]; eventIds?: string[]; weight: number }[];
}

export interface Lens {
  id: string;
  name: string;
  description: string;
  anchorType: 'select' | 'rate' | 'detect';
  anchors: LensAnchor[];
  eveningQuestion: string;
  insightPrism: string;
  icon: string;
  color: string;
}

export type LensValue =
  | { type: 'select'; anchorId: string | null; note?: string }
  | { type: 'rate'; scores: Record<string, number>; note?: string }
  | { type: 'detect'; anchorId: string | null };

export const BUILT_IN_LENSES: Lens[] = [
  {
    id: 'stoic-virtues',
    name: 'Стоические добродетели',
    description: 'Взгляд через призму четырёх классических добродетелей стоицизма',
    anchorType: 'select',
    eveningQuestion: '{{anchor}} — как это проявилось сегодня?',
    insightPrism: 'lenses',
    icon: 'BookHeart',
    color: '#14b8a6',
    anchors: [
      { id: 'wisdom', name: 'Мудрость', description: 'Способность видеть суть вещей и принимать взвешенные решения', emoji: '🦉', color: '#6366f1' },
      { id: 'temperance', name: 'Умеренность', description: 'Контроль желаний, импульсов и эмоций', emoji: '⚖️', color: '#14b8a6' },
      { id: 'courage', name: 'Мужество', description: 'Действие вопреки страху, лени и неопределённости', emoji: '🦁', color: '#ef4444' },
      { id: 'justice', name: 'Справедливость', description: 'Честность с собой и другими, забота о тех, кто рядом', emoji: '🤝', color: '#f59e0b' },
    ],
  },
  {
    id: 'jungian',
    name: 'Архетипы',
    description: 'Система определяет твой доминирующий архетип по активностям дня',
    anchorType: 'detect',
    eveningQuestion: 'Сегодня ты был {{anchor}}',
    insightPrism: 'lenses',
    icon: 'Sparkles',
    color: '#6366f1',
    anchors: [
      {
        id: 'sage',
        name: 'Мудрец',
        description: 'Рефлексия, анализ, поиск причинно-следственных связей',
        emoji: '📚',
        color: '#6366f1',
        detectionRules: [
          { activityIds: ['reading', 'meditation'], weight: 2 },
          { activityIds: ['studying'], weight: 1 },
          { eventIds: ['insight'], weight: 2 },
          { eventIds: ['gratitude'], weight: 1 },
        ],
      },
      {
        id: 'ruler',
        name: 'Правитель',
        description: 'Системы учёта, контроль, организация',
        emoji: '👑',
        color: '#f59e0b',
        detectionRules: [
          { activityIds: ['work'], weight: 2 },
        ],
      },
      {
        id: 'hero',
        name: 'Герой',
        description: 'Дисциплина, преодоление, действия через боль',
        emoji: '⚡',
        color: '#ef4444',
        detectionRules: [
          { activityIds: ['sport'], weight: 3 },
        ],
      },
      {
        id: 'explorer',
        name: 'Искатель',
        description: 'Поиск смысла, эксперименты, избегание застоя',
        emoji: '🧭',
        color: '#10b981',
        detectionRules: [
          { activityIds: ['hobby', 'walking'], weight: 2 },
          { activityIds: ['entertainment'], weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'act-values',
    name: 'Ценности',
    description: 'Оцени, насколько ты жил своими ценностями сегодня (из ACT-терапии)',
    anchorType: 'rate',
    eveningQuestion: 'Насколько ты жил ценностью {{anchor}} сегодня?',
    insightPrism: 'lenses',
    icon: 'Heart',
    color: '#10b981',
    anchors: [
      { id: 'closeness', name: 'Близость', description: 'Глубокие связи с людьми', emoji: '🤗', color: '#ec4899' },
      { id: 'creativity', name: 'Творчество', description: 'Создавать, выражать, придумывать', emoji: '🎨', color: '#8b5cf6' },
      { id: 'health', name: 'Здоровье', description: 'Забота о теле и разуме', emoji: '💪', color: '#10b981' },
      { id: 'honesty', name: 'Честность', description: 'Быть подлинным с собой и другими', emoji: '🌿', color: '#6366f1' },
      { id: 'growth', name: 'Рост', description: 'Развитие, обучение, движение вперёд', emoji: '🌱', color: '#f59e0b' },
    ],
  },
  {
    id: 'perma',
    name: 'PERMA',
    description: 'Пять элементов процветания по модели позитивной психологии Селигмана',
    anchorType: 'rate',
    eveningQuestion: 'Насколько был присутствующим элемент {{anchor}} сегодня?',
    insightPrism: 'lenses',
    icon: 'Sun',
    color: '#f59e0b',
    anchors: [
      { id: 'positive', name: 'Позитивные эмоции', description: 'Радость, интерес, благодарность', emoji: '😊', color: '#f59e0b' },
      { id: 'engagement', name: 'Вовлечённость', description: 'Поток, погружение в задачу', emoji: '🎯', color: '#6366f1' },
      { id: 'relations', name: 'Отношения', description: 'Связь с другими людьми', emoji: '👥', color: '#ec4899' },
      { id: 'meaning', name: 'Смысл', description: 'Ощущение цели, принадлежность к большему', emoji: '✨', color: '#8b5cf6' },
      { id: 'achievement', name: 'Достижения', description: 'Прогресс, завершённые дела', emoji: '🏆', color: '#10b981' },
    ],
  },
  {
    id: 'mindfulness-quality',
    name: 'Качество внимания',
    description: 'Насколько ты был присутствующим и осознанным в течение дня',
    anchorType: 'select',
    eveningQuestion: 'Какое качество внимания преобладало сегодня?',
    insightPrism: 'lenses',
    icon: 'Eye',
    color: '#8b5cf6',
    anchors: [
      { id: 'presence', name: 'Присутствие', description: 'Осознанность здесь и сейчас', emoji: '🧘', color: '#8b5cf6' },
      { id: 'reaction', name: 'Реакция', description: 'Жил в режиме ответа на внешние стимулы', emoji: '⚡', color: '#f97316' },
      { id: 'autopilot', name: 'Автопилот', description: 'День прошёл автоматически, без осознанности', emoji: '🤖', color: '#94a3b8' },
      { id: 'acceptance', name: 'Принятие', description: 'Позволял событиям быть такими, какие они есть', emoji: '🌊', color: '#14b8a6' },
    ],
  },
];

export const ACT_VALUES_BANK = [
  { id: 'closeness', name: 'Близость', emoji: '🤗' },
  { id: 'creativity', name: 'Творчество', emoji: '🎨' },
  { id: 'health', name: 'Здоровье', emoji: '💪' },
  { id: 'honesty', name: 'Честность', emoji: '🌿' },
  { id: 'growth', name: 'Рост', emoji: '🌱' },
  { id: 'freedom', name: 'Свобода', emoji: '🕊️' },
  { id: 'meaning', name: 'Смысл', emoji: '✨' },
  { id: 'contribution', name: 'Вклад', emoji: '🤲' },
  { id: 'balance', name: 'Баланс', emoji: '⚖️' },
  { id: 'curiosity', name: 'Любопытство', emoji: '🔍' },
  { id: 'family', name: 'Семья', emoji: '🏠' },
  { id: 'work_value', name: 'Работа', emoji: '💼' },
  { id: 'nature', name: 'Природа', emoji: '🌲' },
  { id: 'humor', name: 'Юмор', emoji: '😄' },
  { id: 'acceptance', name: 'Принятие', emoji: '🌊' },
];

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