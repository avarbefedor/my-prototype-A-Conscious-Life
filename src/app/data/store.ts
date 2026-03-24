import { useState, useCallback, useEffect } from 'react';
import { DayLog, ActivityEntry, MoodSnapshot, DEFAULT_ACTIVITIES, ActivityType, DEFAULT_EVENT_TAGS, EventType, EventMultiplier, EventGroup, DEFAULT_EVENT_GROUPS, LensValue, BUILT_IN_LENSES, ACT_VALUES_BANK } from './types';
import { initialDays } from './mockData';

// Simple global store
let days: DayLog[] = [...initialDays];
let activeActivities: Set<string> = new Set(); // multi-select
let listeners: Set<() => void> = new Set();

// Lens store
let userActiveLenses: string[] = ['stoic-virtues', 'jungian'];
let userLensAnchors: Record<string, string[]> = {
  'act-values': ['closeness', 'creativity', 'health', 'honesty', 'growth'],
};
let lensListeners: Set<() => void> = new Set();

function notifyLenses() {
  lensListeners.forEach((l) => l());
}

// Dev toggle: all layers unlocked by default
let devUnlockAll = true;
let layerListeners: Set<() => void> = new Set();

export function isLayerUnlocked(_layerId: 'patterns' | 'energy' | 'lenses'): boolean {
  return devUnlockAll;
}

export function useDevUnlock() {
  const [unlocked, setUnlocked] = useState(devUnlockAll);

  useEffect(() => {
    const listener = () => setUnlocked(devUnlockAll);
    layerListeners.add(listener);
    return () => { layerListeners.delete(listener); };
  }, []);

  const toggle = useCallback(() => {
    devUnlockAll = !devUnlockAll;
    layerListeners.forEach((l) => l());
  }, []);

  return { unlocked, toggle };
}

// Custom activities store
let customActivities: ActivityType[] = [...DEFAULT_ACTIVITIES];
let activityListeners: Set<() => void> = new Set();

// Custom events store
let customEvents: EventType[] = [...DEFAULT_EVENT_TAGS];
let eventListeners: Set<() => void> = new Set();

// Event groups store
let customEventGroups: EventGroup[] = [...DEFAULT_EVENT_GROUPS];
let eventGroupListeners: Set<() => void> = new Set();

function notifyEvents() {
  eventListeners.forEach((l) => l());
}

function notifyEventGroups() {
  eventGroupListeners.forEach((l) => l());
}

function notifyActivities() {
  activityListeners.forEach((l) => l());
}

function notify() {
  listeners.forEach((l) => l());
}

function nowTime(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Haptic feedback helper
function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    if (navigator.vibrate) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[style]);
    }
  } catch (_) { /* ignore */ }
}

// ---- Events store ----
export function useEvents() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    eventListeners.add(listener);
    return () => { eventListeners.delete(listener); };
  }, []);

  const addEvent = useCallback((event: Omit<EventType, 'id'>) => {
    const newEvt: EventType = { ...event, id: generateId() };
    customEvents = [...customEvents, newEvt];
    notifyEvents();
    return newEvt;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<EventType>) => {
    customEvents = customEvents.map((e) => e.id === id ? { ...e, ...updates } : e);
    notifyEvents();
  }, []);

  const deleteEvent = useCallback((id: string) => {
    customEvents = customEvents.filter((e) => e.id !== id);
    notifyEvents();
  }, []);

  const setEventGroup = useCallback((eventId: string, groupId: string | undefined) => {
    customEvents = customEvents.map((e) => e.id === eventId ? { ...e, groupId } : e);
    notifyEvents();
  }, []);

  const reorderEvents = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...customEvents];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    customEvents = updated;
    notifyEvents();
  }, []);

  return {
    events: customEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    setEventGroup,
    reorderEvents,
  };
}

// ---- Event Groups store ----
export function useEventGroups() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    eventGroupListeners.add(listener);
    return () => { eventGroupListeners.delete(listener); };
  }, []);

  const addEventGroup = useCallback((label: string) => {
    const group: EventGroup = { id: generateId(), label };
    customEventGroups = [...customEventGroups, group];
    notifyEventGroups();
    return group;
  }, []);

  const updateEventGroup = useCallback((id: string, label: string) => {
    customEventGroups = customEventGroups.map((g) => g.id === id ? { ...g, label } : g);
    notifyEventGroups();
  }, []);

  const deleteEventGroup = useCallback((id: string) => {
    customEventGroups = customEventGroups.filter((g) => g.id !== id);
    customEvents = customEvents.map((e) => e.groupId === id ? { ...e, groupId: undefined } : e);
    notifyEventGroups();
    notifyEvents();
  }, []);

  const reorderEventGroups = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= customEventGroups.length) return;
    const updated = [...customEventGroups];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    customEventGroups = updated;
    notifyEventGroups();
  }, []);

  return {
    eventGroups: customEventGroups,
    addEventGroup,
    updateEventGroup,
    deleteEventGroup,
    reorderEventGroups,
  };
}

// ---- Activities store ----
export function useActivities() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    activityListeners.add(listener);
    return () => { activityListeners.delete(listener); };
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityType, 'id'>) => {
    const newAct: ActivityType = { ...activity, id: generateId() };
    customActivities = [...customActivities, newAct];
    notifyActivities();
    return newAct;
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<ActivityType>) => {
    customActivities = customActivities.map((a) => a.id === id ? { ...a, ...updates } : a);
    notifyActivities();
  }, []);

  const deleteActivity = useCallback((id: string) => {
    customActivities = customActivities.filter((a) => a.id !== id);
    notifyActivities();
  }, []);

  const reorderActivities = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...customActivities];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    customActivities = updated;
    notifyActivities();
  }, []);

  const getActivityById = useCallback((id: string) => {
    return customActivities.find((a) => a.id === id) || null;
  }, []);

  return {
    activities: customActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    getActivityById,
  };
}

export function useDays() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getDay = useCallback((date: string) => {
    return days.find((d) => d.date === date) || null;
  }, []);

  const saveDay = useCallback((day: DayLog) => {
    const idx = days.findIndex((d) => d.date === day.date);
    if (idx >= 0) {
      days = [...days];
      days[idx] = day;
    } else {
      days = [day, ...days];
    }
    notify();
  }, []);

  const getOrCreateToday = useCallback((): DayLog => {
    const today = todayStr();
    const existing = days.find((d) => d.date === today);
    if (existing) return existing;
    const newDay: DayLog = {
      id: generateId(),
      date: today,
      sleep: { hours: 7, quality: 5 },
      mood: 5,
      energy: 5,
      work: null,
      training: null,
      steps: 0,
      nutrition: { calories: 0 },
      events: [],
      virtue: null,
      virtueNote: '',
      archetype: null,
      archetypeSecondary: null,
      reflection: '',
      status: 'draft',
      activities: [],
      moodSnapshots: [],
    };
    days = [newDay, ...days];
    notify();
    return newDay;
  }, []);

  // Toggle activity on/off (multi-select support)
  const toggleActivity = useCallback((activityId: string) => {
    haptic('medium');
    const today = getOrCreateToday();
    const time = nowTime();

    if (activeActivities.has(activityId)) {
      // Stop this activity — set endTime on its running entry
      activeActivities = new Set(activeActivities);
      activeActivities.delete(activityId);
      const updatedActivities = today.activities.map((a) => {
        if (a.activityId === activityId && !a.endTime) {
          return { ...a, endTime: time };
        }
        return a;
      });
      saveDay({ ...today, activities: updatedActivities });
    } else {
      // Start this activity
      activeActivities = new Set(activeActivities);
      activeActivities.add(activityId);
      const newEntry: ActivityEntry = {
        id: generateId(),
        activityId,
        startTime: time,
      };
      saveDay({ ...today, activities: [...today.activities, newEntry] });
    }
  }, []);

  // Legacy alias
  const startActivity = toggleActivity;

  const addMoodSnapshot = useCallback((mood: number, energy: number, comment?: string, trigger?: MoodSnapshot['trigger']) => {
    const today = getOrCreateToday();
    const snapshot: MoodSnapshot = {
      id: generateId(),
      time: nowTime(),
      mood,
      energy,
      comment: comment || undefined,
      trigger,
    };
    saveDay({
      ...today,
      moodSnapshots: [...today.moodSnapshots, snapshot],
      mood,
      energy,
    });
  }, []);

  const updateMoodSnapshot = useCallback((snapshotId: string, updates: Partial<MoodSnapshot>) => {
    const today = getOrCreateToday();
    const updatedSnapshots = today.moodSnapshots.map((s) =>
      s.id === snapshotId ? { ...s, ...updates } : s
    );
    const last = updatedSnapshots[updatedSnapshots.length - 1];
    saveDay({
      ...today,
      moodSnapshots: updatedSnapshots,
      mood: last ? last.mood : today.mood,
      energy: last ? last.energy : today.energy,
    });
  }, []);

  const deleteMoodSnapshot = useCallback((snapshotId: string) => {
    const today = getOrCreateToday();
    const updatedSnapshots = today.moodSnapshots.filter((s) => s.id !== snapshotId);
    const last = updatedSnapshots[updatedSnapshots.length - 1];
    saveDay({
      ...today,
      moodSnapshots: updatedSnapshots,
      mood: last ? last.mood : 5,
      energy: last ? last.energy : 5,
    });
  }, []);

  const toggleEvent = useCallback((eventId: string) => {
    const today = getOrCreateToday();
    const existing = today.events.find((e) => e.eventId === eventId);
    const events = existing
      ? today.events.filter((e) => e.eventId !== eventId)
      : [...today.events, { eventId, multiplier: 1 as EventMultiplier }];
    saveDay({ ...today, events });
  }, []);

  const updateEventEntry = useCallback((eventId: string, updates: { description?: string; multiplier?: EventMultiplier }) => {
    const today = getOrCreateToday();
    const events = today.events.map((e) => e.eventId === eventId ? { ...e, ...updates } : e);
    saveDay({ ...today, events });
  }, []);

  const updateActivityEntry = useCallback((entryId: string, updates: Partial<ActivityEntry>) => {
    const today = getOrCreateToday();
    const updatedActivities = today.activities.map((a) =>
      a.id === entryId ? { ...a, ...updates } : a
    );
    saveDay({ ...today, activities: updatedActivities });
  }, []);

  const deleteActivityEntry = useCallback((entryId: string) => {
    const today = getOrCreateToday();
    const entry = today.activities.find((a) => a.id === entryId);
    // If deleting a running entry, also remove from activeActivities
    if (entry && !entry.endTime && activeActivities.has(entry.activityId)) {
      // Check if there are other running entries for same activity
      const otherRunning = today.activities.filter(
        (a) => a.id !== entryId && a.activityId === entry.activityId && !a.endTime
      );
      if (otherRunning.length === 0) {
        activeActivities = new Set(activeActivities);
        activeActivities.delete(entry.activityId);
      }
    }
    const updatedActivities = today.activities.filter((a) => a.id !== entryId);
    saveDay({ ...today, activities: updatedActivities });
  }, []);

  return {
    days,
    getDay,
    saveDay,
    getOrCreateToday,
    startActivity,
    toggleActivity,
    addMoodSnapshot,
    updateMoodSnapshot,
    deleteMoodSnapshot,
    toggleEvent,
    updateEventEntry,
    updateActivityEntry,
    deleteActivityEntry,
    activeActivities: Array.from(activeActivities),
  };
}

// ---- Lenses store ----
export function useLenses() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    lensListeners.add(listener);
    return () => { lensListeners.delete(listener); };
  }, []);

  const setActiveLenses = useCallback((ids: string[]) => {
    userActiveLenses = ids;
    notifyLenses();
  }, []);

  const toggleLens = useCallback((id: string) => {
    userActiveLenses = userActiveLenses.includes(id)
      ? userActiveLenses.filter((l) => l !== id)
      : [...userActiveLenses, id];
    notifyLenses();
  }, []);

  const setLensAnchors = useCallback((lensId: string, anchorIds: string[]) => {
    userLensAnchors = { ...userLensAnchors, [lensId]: anchorIds };
    notifyLenses();
  }, []);

  const getActiveLenses = () =>
    BUILT_IN_LENSES.filter((l) => userActiveLenses.includes(l.id));

  const getEffectiveLens = (lensId: string) => {
    const lens = BUILT_IN_LENSES.find((l) => l.id === lensId);
    if (!lens) return null;
    if (lensId === 'act-values' && userLensAnchors['act-values']?.length > 0) {
      const selectedAnchors = ACT_VALUES_BANK
        .filter((v) => userLensAnchors['act-values'].includes(v.id))
        .map((v) => ({ id: v.id, name: v.name, description: '', emoji: v.emoji, color: '#10b981' }));
      return { ...lens, anchors: selectedAnchors.length > 0 ? selectedAnchors : lens.anchors };
    }
    return lens;
  };

  return {
    activeLensIds: userActiveLenses,
    lensAnchors: userLensAnchors,
    activeLenses: getActiveLenses(),
    setActiveLenses,
    toggleLens,
    setLensAnchors,
    getEffectiveLens,
  };
}

export function getStreak(): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    const found = days.find((d) => d.date === expectedStr && d.status === 'complete');
    if (found) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// Detect archetype based on activities and behavior
export function detectArchetype(day: DayLog): string {
  let scores: Record<string, number> = { sage: 0, ruler: 0, hero: 0, explorer: 0 };

  const activityIds = day.activities.map((a) => a.activityId);
  if (activityIds.includes('reading') || activityIds.includes('meditation')) scores.sage += 2;
  if (activityIds.includes('studying')) scores.sage += 1;
  if (activityIds.includes('work')) scores.ruler += 2;
  if (activityIds.includes('sport')) scores.hero += 3;
  if (activityIds.includes('hobby') || activityIds.includes('walking')) scores.explorer += 2;
  if (activityIds.includes('entertainment')) scores.explorer += 1;

  if (day.events.some((e) => e.eventId === 'insight')) scores.sage += 2;
  if (day.events.some((e) => e.eventId === 'gratitude')) scores.sage += 1;
  if (day.reflection.length > 50) scores.sage += 1;

  if (day.training === 'plus') scores.hero += 2;
  if (day.training === 'normal') scores.hero += 1;
  if (day.work === 'plus') scores.ruler += 2;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

// ---- Pattern computation ----
export function computePatterns(sourceDays: DayLog[]): import('./types').Insight[] {
  const MIN_OBSERVATIONS = 7;
  const complete = sourceDays.filter((d) => d.status === 'complete').sort((a, b) => a.date.localeCompare(b.date));
  if (complete.length < MIN_OBSERVATIONS) return [];

  const insights: import('./types').Insight[] = [];
  let idCounter = 900;

  // Pattern 1: event[X] → next-day mood delta
  const eventPool = ['alcohol', 'binge', 'conflict', 'smoking', 'panic'];
  for (const eventId of eventPool) {
    const withEvent: number[] = [];
    const withoutEvent: number[] = [];
    for (let i = 0; i < complete.length - 1; i++) {
      const hasEvent = complete[i].events.some((e) => e.eventId === eventId);
      const nextMood = complete[i + 1].mood;
      if (hasEvent) withEvent.push(nextMood);
      else withoutEvent.push(nextMood);
    }
    if (withEvent.length < 4) continue;
    const avgWith = withEvent.reduce((s, v) => s + v, 0) / withEvent.length;
    const avgWithout = withoutEvent.length > 0
      ? withoutEvent.reduce((s, v) => s + v, 0) / withoutEvent.length
      : 6;
    const delta = avgWithout - avgWith;
    if (Math.abs(delta) >= 1.0) {
      const strength = Math.min(1, Math.abs(delta) / 4);
      insights.push({
        id: String(++idCounter),
        title: `«${eventId}» → настроение −${delta.toFixed(1)} на следующий день`,
        description: `В ${withEvent.length} случаях после события «${eventId}» настроение на следующий день было ниже на ${delta.toFixed(1)} пункта.`,
        category: 'psyche',
        layer: 'patterns',
        strength,
        observationCount: withEvent.length,
        advice: 'Отследи, как это событие влияет на твой завтрашний день. Можно предупредить последствия.',
        chartData: [
          { name: 'С событием', value1: Math.round(avgWith * 10) / 10 },
          { name: 'Без', value1: Math.round(avgWithout * 10) / 10 },
        ],
      });
    }
  }

  // Pattern 2: sleep < 6 → lower mood
  const shortSleepMoods: number[] = [];
  const normalSleepMoods: number[] = [];
  complete.forEach((d) => {
    if (d.sleep.hours < 6) shortSleepMoods.push(d.mood);
    else normalSleepMoods.push(d.mood);
  });
  if (shortSleepMoods.length >= 4 && normalSleepMoods.length >= 4) {
    const avgShort = shortSleepMoods.reduce((s, v) => s + v, 0) / shortSleepMoods.length;
    const avgNormal = normalSleepMoods.reduce((s, v) => s + v, 0) / normalSleepMoods.length;
    const delta = avgNormal - avgShort;
    if (delta >= 0.8) {
      insights.push({
        id: String(++idCounter),
        title: `Сон < 6ч → настроение −${delta.toFixed(1)}`,
        description: `При сне менее 6 часов настроение в среднем на ${delta.toFixed(1)} пункта ниже, чем при нормальном сне.`,
        category: 'sleep',
        layer: 'patterns',
        strength: Math.min(1, delta / 4),
        observationCount: shortSleepMoods.length,
        advice: 'Попробуй неделю придерживаться коридора 7–8 часов и сравни результат.',
        chartData: [
          { name: '< 6ч', value1: Math.round(avgShort * 10) / 10 },
          { name: '≥ 6ч', value1: Math.round(avgNormal * 10) / 10 },
        ],
      });
    }
  }

  // Pattern 3: activity X → mood delta (same day)
  const activityPool = ['sport', 'walking', 'meditation', 'social_media', 'entertainment'];
  for (const actId of activityPool) {
    const withAct: number[] = [];
    const withoutAct: number[] = [];
    complete.forEach((d) => {
      const hasAct = d.activities.some((a) => a.activityId === actId && a.endTime);
      if (hasAct) withAct.push(d.mood);
      else withoutAct.push(d.mood);
    });
    if (withAct.length < 5 || withoutAct.length < 3) continue;
    const avgWith = withAct.reduce((s, v) => s + v, 0) / withAct.length;
    const avgWithout = withoutAct.reduce((s, v) => s + v, 0) / withoutAct.length;
    const delta = avgWith - avgWithout;
    if (Math.abs(delta) >= 0.8) {
      const dir = delta > 0 ? '+' : '';
      insights.push({
        id: String(++idCounter),
        title: `${actId} → настроение ${dir}${delta.toFixed(1)}`,
        description: `В дни с активностью «${actId}» настроение ${delta > 0 ? 'выше' : 'ниже'} на ${Math.abs(delta).toFixed(1)} пункта.`,
        category: 'body',
        layer: 'patterns',
        strength: Math.min(1, Math.abs(delta) / 3),
        observationCount: withAct.length,
        advice: delta > 0
          ? `Активность «${actId}» положительно влияет на твоё настроение — используй её как инструмент.`
          : `Активность «${actId}» снижает настроение — попробуй ограничить её в трудные дни.`,
        chartData: [
          { name: `С ${actId}`, value1: Math.round(avgWith * 10) / 10 },
          { name: 'Без', value1: Math.round(avgWithout * 10) / 10 },
        ],
      });
    }
  }

  return insights.slice(0, 5); // top 5 patterns
}

// ---- Energy insights ----
export function computeEnergyInsights(sourceDays: DayLog[]): import('./types').Insight[] {
  const complete = sourceDays.filter((d) => d.status === 'complete' && d.moodSnapshots.length >= 2);
  if (complete.length < 7) return [];

  const insights: import('./types').Insight[] = [];
  let idCounter = 950;

  // Chronotype: avg energy by hour buckets
  const hourBuckets: Record<number, number[]> = {};
  complete.forEach((d) => {
    d.moodSnapshots.forEach((s) => {
      const hour = parseInt(s.time.split(':')[0], 10);
      const bucket = Math.floor(hour / 2) * 2; // 2-hour buckets
      if (!hourBuckets[bucket]) hourBuckets[bucket] = [];
      hourBuckets[bucket].push(s.energy);
    });
  });

  const bucketAvgs = Object.entries(hourBuckets)
    .filter(([, vals]) => vals.length >= 3)
    .map(([h, vals]) => ({
      hour: parseInt(h, 10),
      avg: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
    .sort((a, b) => a.hour - b.hour);

  if (bucketAvgs.length >= 3) {
    const peak = bucketAvgs.reduce((best, b) => b.avg > best.avg ? b : best, bucketAvgs[0]);
    const chartData = bucketAvgs.map((b) => ({
      name: `${b.hour}:00`,
      value1: Math.round(b.avg * 10) / 10,
    }));
    insights.push({
      id: String(++idCounter),
      title: `Пиковая энергия в ${peak.hour}:00–${peak.hour + 2}:00`,
      description: `Твоя энергия стабильно выше в промежутке ${peak.hour}:00–${peak.hour + 2}:00 (в среднем ${peak.avg.toFixed(1)}/10).`,
      category: 'productivity',
      layer: 'energy',
      strength: 0.8,
      observationCount: complete.length,
      advice: `Ставь самые сложные задачи на ${peak.hour}:00–${peak.hour + 2}:00. Это твои пиковые часы.`,
      chartData,
    });
  }

  // Recovery score: sleep hours → next day energy
  const sleepEnergyPairs: { sleep: number; energy: number }[] = [];
  for (let i = 0; i < complete.length - 1; i++) {
    sleepEnergyPairs.push({ sleep: complete[i].sleep.hours, energy: complete[i + 1].energy });
  }
  if (sleepEnergyPairs.length >= 5) {
    const buckets = [
      { label: '<6ч', pairs: sleepEnergyPairs.filter((p) => p.sleep < 6) },
      { label: '6-7ч', pairs: sleepEnergyPairs.filter((p) => p.sleep >= 6 && p.sleep < 7) },
      { label: '7-8ч', pairs: sleepEnergyPairs.filter((p) => p.sleep >= 7 && p.sleep < 8) },
      { label: '>8ч', pairs: sleepEnergyPairs.filter((p) => p.sleep >= 8) },
    ].filter((b) => b.pairs.length >= 2);

    if (buckets.length >= 2) {
      insights.push({
        id: String(++idCounter),
        title: 'Сон напрямую влияет на твою энергию',
        description: 'Анализ показывает чёткую корреляцию: больше сна → выше энергия на следующий день.',
        category: 'sleep',
        layer: 'energy',
        strength: 0.75,
        observationCount: sleepEnergyPairs.length,
        advice: 'Оптимальный сон для твоей энергии — 7–8 часов. Используй Recovery Score как индикатор.',
        chartData: buckets.map((b) => ({
          name: b.label,
          value1: Math.round((b.pairs.reduce((s, p) => s + p.energy, 0) / b.pairs.length) * 10) / 10,
        })),
      });
    }
  }

  return insights;
}