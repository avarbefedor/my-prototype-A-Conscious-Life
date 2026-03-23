import { useState, useCallback, useEffect } from 'react';
import { DayLog, ActivityEntry, MoodSnapshot, DEFAULT_ACTIVITIES, ActivityType, DEFAULT_EVENT_TAGS, EventType, EventMultiplier, EventGroup, DEFAULT_EVENT_GROUPS } from './types';
import { initialDays } from './mockData';

// Simple global store
let days: DayLog[] = [...initialDays];
let activeActivities: Set<string> = new Set(); // multi-select
let listeners: Set<() => void> = new Set();

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

  const addMoodSnapshot = useCallback((mood: number, energy: number, comment?: string) => {
    const today = getOrCreateToday();
    const snapshot: MoodSnapshot = {
      id: generateId(),
      time: nowTime(),
      mood,
      energy,
      comment: comment || undefined,
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