import { DayLog, MoodSnapshot, Insight, ActivityEntry, DEFAULT_ACTIVITIES as ACTIVITIES, LensValue } from './types';
import type { EventEntry } from './types';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const workOptions = [null, 'plus', 'normal', 'minus'] as const;
const trainingOptions = [null, 'plus', 'normal', 'minus'] as const;
const eventPool = ['alcohol', 'binge', 'panic', 'pm', 'smoking', 'conflict', 'good_news', 'insight', 'gratitude'];
const virtuePool = ['Мудрость', 'Умеренность', 'Мужество', 'Справедливость', null];
const archetypePool = ['sage', 'ruler', 'hero', 'explorer', null];
const virtueIdPool = ['wisdom', 'temperance', 'courage', 'justice', null];
const mindfulnessPool = ['presence', 'reaction', 'autopilot', 'acceptance'];

function randomEvents(): EventEntry[] {
  const count = Math.floor(Math.random() * 3);
  const shuffled = [...eventPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((id) => ({
    eventId: id,
    multiplier: 1 as const,
  }));
}

function randomLensValues(virtue: string | null, archetype: string | null): Record<string, LensValue> {
  const values: Record<string, LensValue> = {};

  // stoic-virtues
  const virtueId = virtue === 'Мудрость' ? 'wisdom'
    : virtue === 'Умеренность' ? 'temperance'
    : virtue === 'Мужество' ? 'courage'
    : virtue === 'Справедливость' ? 'justice'
    : null;
  values['stoic-virtues'] = { type: 'select', anchorId: virtueId };

  // jungian
  values['jungian'] = { type: 'detect', anchorId: archetype };

  // act-values (random scores)
  values['act-values'] = {
    type: 'rate',
    scores: {
      closeness: Math.round(3 + Math.random() * 7),
      creativity: Math.round(3 + Math.random() * 7),
      health: Math.round(3 + Math.random() * 7),
      honesty: Math.round(3 + Math.random() * 7),
      growth: Math.round(3 + Math.random() * 7),
    },
  };

  // perma (random scores)
  values['perma'] = {
    type: 'rate',
    scores: {
      positive: Math.round(3 + Math.random() * 7),
      engagement: Math.round(3 + Math.random() * 7),
      relations: Math.round(3 + Math.random() * 7),
      meaning: Math.round(3 + Math.random() * 7),
      achievement: Math.round(3 + Math.random() * 7),
    },
  };

  // mindfulness-quality
  values['mindfulness-quality'] = {
    type: 'select',
    anchorId: mindfulnessPool[Math.floor(Math.random() * mindfulnessPool.length)],
  };

  return values;
}

function randomActivities(): ActivityEntry[] {
  const activityPool = ACTIVITIES.map((a) => a.id);
  const entries: ActivityEntry[] = [];
  let hour = 7 + Math.floor(Math.random() * 2);

  const count = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const duration = 0.5 + Math.random() * 3;
    const startH = Math.floor(hour);
    const startM = Math.floor((hour % 1) * 60);
    const endHour = hour + duration;
    const endH = Math.floor(endHour);
    const endM = Math.floor((endHour % 1) * 60);

    entries.push({
      id: generateId(),
      activityId: activityPool[Math.floor(Math.random() * activityPool.length)],
      startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
    });

    hour = endHour + Math.random() * 0.5;
    if (hour > 23) break;
  }
  return entries;
}

function randomSnapshots(baseMood: number, baseEnergy: number): MoodSnapshot[] {
  const snapshots: MoodSnapshot[] = [];
  const times = ['09:00', '12:00', '15:00', '18:00', '21:00'];
  const comments = ['После прогулки стало легче', 'Устал от звонков', 'Хорошо поел, энергия вернулась', 'Медитация помогла', ''];
  for (const t of times) {
    if (Math.random() > 0.4) {
      const comment = Math.random() > 0.6 ? comments[Math.floor(Math.random() * comments.length)] : undefined;
      snapshots.push({
        id: Math.random().toString(36).substring(2, 9),
        time: t,
        mood: Math.min(10, Math.max(0, baseMood + Math.round(Math.random() * 4 - 2))),
        energy: Math.min(10, Math.max(0, baseEnergy + Math.round(Math.random() * 4 - 2))),
        comment: comment || undefined,
      });
    }
  }
  return snapshots;
}

export function generateMockDays(count: number = 30): DayLog[] {
  const days: DayLog[] = [];
  for (let i = 0; i < count; i++) {
    const sleepHours = 4.5 + Math.random() * 5;
    const sleepQuality = Math.round(sleepHours > 7 ? 5 + Math.random() * 5 : Math.random() * 6);
    const mood = Math.round(
      Math.min(10, Math.max(0, (sleepHours > 7 ? 6 : 3) + (Math.random() * 4 - 2)))
    );
    const energy = Math.round(
      Math.min(10, Math.max(0, mood + (Math.random() * 2 - 1)))
    );

    days.push({
      id: generateId(),
      date: dateStr(i),
      sleep: { hours: Math.round(sleepHours * 2) / 2, quality: Math.min(10, Math.max(0, sleepQuality)) },
      mood: Math.min(10, Math.max(0, mood)),
      energy: Math.min(10, Math.max(0, energy)),
      work: workOptions[Math.floor(Math.random() * 4)] as any,
      training: i % 2 === 0 ? trainingOptions[1 + Math.floor(Math.random() * 3)] as any : null,
      steps: Math.round(2000 + Math.random() * 13000),
      nutrition: {
        calories: Math.round(1400 + Math.random() * 1200),
        protein: Math.round(60 + Math.random() * 100),
        fat: Math.round(40 + Math.random() * 60),
        carbs: Math.round(100 + Math.random() * 200),
      },
      events: randomEvents(),
      virtue: virtuePool[Math.floor(Math.random() * virtuePool.length)] as any,
      virtueNote: i % 3 === 0 ? 'Сдержался в споре, выслушал другого.' : '',
      archetype: archetypePool[Math.floor(Math.random() * archetypePool.length)] as any,
      archetypeSecondary: null,
      reflection: i % 2 === 0 ? 'День прошёл продуктивно, удалось сосредоточиться на важном.' : '',
      status: i === 0 ? 'draft' : 'complete',
      activities: i === 0 ? [] : randomActivities(),
      moodSnapshots: i === 0 ? [] : randomSnapshots(mood, energy),
      lensValues: i === 0 ? {} : randomLensValues(
        virtuePool[Math.floor(Math.random() * virtuePool.length)] as string | null,
        archetypePool[Math.floor(Math.random() * archetypePool.length)] as string | null,
      ),
    });
  }
  return days;
}

export const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Недосып → жор и плохое настроение',
    description: 'В 80% дней, когда ты спал < 6 часов, на следующий день было настроение ≤ 4 и включён тег «Жор».',
    category: 'sleep',
    prism: 'pattern',
    layer: 'patterns',
    strength: 0.85,
    observationCount: 18,
    advice: 'Попробуй неделю придерживаться коридора 7–8 часов и сравни результат.',
    chartData: [
      { name: '<5ч', value1: 3.2, value2: 2.8 },
      { name: '5-6ч', value1: 4.5, value2: 4.1 },
      { name: '6-7ч', value1: 5.8, value2: 5.5 },
      { name: '7-8ч', value1: 7.2, value2: 6.9 },
      { name: '>8ч', value1: 7.8, value2: 7.2 },
    ],
  },
  {
    id: '2',
    title: 'Тренировки повышают настроение',
    description: 'В дни с тренировкой настроение в среднем на 1.5 пункта выше, чем без неё.',
    category: 'body',
    prism: 'archetype',
    layer: 'energy',
    strength: 0.78,
    observationCount: 14,
    advice: 'Физическая дисциплина напрямую улучшает эмоциональное состояние. Попробуй короткие тренировки в дни спада.',
    chartData: [
      { name: 'Пн', value1: 6, value2: 4 },
      { name: 'Вт', value1: 7, value2: 5 },
      { name: 'Ср', value1: 8, value2: 4 },
      { name: 'Чт', value1: 7, value2: 6 },
      { name: 'Пт', value1: 8, value2: 5 },
      { name: 'Сб', value1: 7, value2: 5 },
      { name: 'Вс', value1: 6, value2: 4 },
    ],
  },
  {
    id: '3',
    title: 'Соцсети > 2ч → падение энергии',
    description: 'Когда ты проводишь в соцсетях больше 2 часов подряд, энергия к вечеру ниже на 2.5 пункта.',
    category: 'psyche',
    prism: 'pattern',
    layer: 'patterns',
    strength: 0.76,
    observationCount: 11,
    advice: 'Установи таймер на 30 минут для соцсетей. Заметь разницу через неделю.',
    chartData: [
      { name: '<30м', value1: 7.5 },
      { name: '30м-1ч', value1: 6.8 },
      { name: '1-2ч', value1: 5.2 },
      { name: '>2ч', value1: 4.1 },
    ],
  },
  {
    id: '4',
    title: 'Прогулка — лучший перезаряд',
    description: 'После прогулки > 30 мин энергия вырастает в среднем на 2 пункта в течение 3 часов.',
    category: 'body',
    prism: 'pattern',
    layer: 'energy',
    strength: 0.81,
    observationCount: 9,
    advice: 'Используй прогулку как инструмент восстановления. Особенно эффективно после обеда.',
    chartData: [
      { name: 'До', value1: 4.5 },
      { name: '+1ч', value1: 6.2 },
      { name: '+2ч', value1: 6.8 },
      { name: '+3ч', value1: 6.0 },
    ],
  },
  {
    id: '5',
    title: 'Алкоголь разрушает следующий день',
    description: 'В 90% случаев после тега «Алкоголь» настроение на следующий день ниже на 2+ пункта.',
    category: 'body',
    prism: 'virtue',
    layer: 'lenses',
    strength: 0.92,
    observationCount: 8,
    advice: 'Добродетель Умеренность. Отслеживай частоту — даже 1 раз в неделю имеет кумулятивный эффект.',
    chartData: [
      { name: 'День до', value1: 7, value2: 9500 },
      { name: 'День с 🍷', value1: 6, value2: 7200 },
      { name: 'День после', value1: 4, value2: 5600 },
      { name: 'Через 2 дня', value1: 6, value2: 8100 },
    ],
  },
  {
    id: '6',
    title: 'Эта неделя — неделя Мудреца',
    description: 'Много чтения, рефлексии и медитации. Ты провёл 12 часов в режиме анализа и самопознания.',
    category: 'psyche',
    prism: 'archetype',
    layer: 'lenses',
    strength: 0.65,
    advice: 'Мудрец силён в понимании, но может увязнуть в раздумьях. Добавь действие — подключи Героя.',
    chartData: [
      { name: 'Мудрец', value1: 45 },
      { name: 'Правитель', value1: 20 },
      { name: 'Герой', value1: 15 },
      { name: 'Искатель', value1: 20 },
    ],
  },
  {
    id: '7',
    title: 'Конфликт → ПА в течение 24 часов',
    description: 'В 3 из 4 случаев после конфликта у тебя была паническая атака в тот же или следующий день.',
    category: 'psyche',
    prism: 'pattern',
    layer: 'patterns',
    strength: 0.88,
    observationCount: 12,
    advice: 'Не избегай конфликта, но готовь инструменты: дыхание, прогулка, медитация сразу после.',
    chartData: [
      { name: 'С конфликтом', value1: 3.2 },
      { name: 'Без', value1: 0.8 },
    ],
  },
  {
    id: '8',
    title: 'Ценность «Близость» падает в конце недели',
    description: 'По пятницам и субботам оценка ценности «Близость» снижается до 3–4, хотя в начале недели — 7–8.',
    category: 'relations',
    layer: 'lenses',
    strength: 0.71,
    observationCount: 10,
    advice: 'Запланируй время с близкими в конце недели — это помогает выровнять баланс.',
    chartData: [
      { name: 'Пн', value1: 7.5 },
      { name: 'Вт', value1: 7.2 },
      { name: 'Ср', value1: 6.8 },
      { name: 'Чт', value1: 6.1 },
      { name: 'Пт', value1: 4.2 },
      { name: 'Сб', value1: 3.8 },
      { name: 'Вс', value1: 5.5 },
    ],
  },
  {
    id: '9',
    title: 'Пиковая энергия — утром с 9 до 11',
    description: 'Снимки настроения показывают: твоя энергия стабильно выше 7 в промежутке 9:00–11:00.',
    category: 'productivity',
    layer: 'energy',
    strength: 0.83,
    observationCount: 22,
    advice: 'Ставь самые сложные задачи на утро. Избегай встреч и переписки до 9:00.',
    chartData: [
      { name: '7:00', value1: 5.2 },
      { name: '9:00', value1: 7.8 },
      { name: '11:00', value1: 7.5 },
      { name: '13:00', value1: 5.9 },
      { name: '15:00', value1: 5.1 },
      { name: '17:00', value1: 6.3 },
      { name: '19:00', value1: 5.5 },
    ],
  },
];

export const initialDays = generateMockDays(30);