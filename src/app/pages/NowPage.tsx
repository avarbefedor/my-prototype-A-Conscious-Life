import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Drawer } from 'vaul';
import { ChevronDown, ChevronUp, Plus, X, Clock, MessageCircle, Trash2, Settings, Check, Pencil, Menu } from 'lucide-react';
import { useDays, getStreak, useActivities, useEvents, useEventGroups, useLenses, useObjects } from '../data/store';
import { MOOD_LABELS } from '../data/types';
import type { ActivityType, MoodSnapshot } from '../data/types';
import { DraggableActivityGrid } from '../components/DraggableActivityGrid';
import { ActivityBottomSheet } from '../components/ActivityBottomSheet';
import { CompositeActivitySheet } from '../components/CompositeActivitySheet';
import { EmojiPickerSheet } from '../components/EmojiPickerSheet';
import { useDrawer } from '../context/DrawerContext';
import { MoodRing } from '../components/MoodRing';

function CoverShape({ type = 'circles', color = '#C2692A', emoji }: { type?: 'circles' | 'stripes' | 'arc'; color?: string; emoji?: string }) {
  const base: React.CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' };
  if (type === 'circles') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: color + '35', right: -30, bottom: -30 }} />
        <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: color + '55', right: -8, bottom: -8 }} />
        {emoji && <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 34, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'stripes') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${color}30 0 12px, transparent 12px 28px)` }} />
        {emoji && <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 34 }}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'arc') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', width: 190, height: 190, borderRadius: '50%', border: `22px solid ${color}45`, right: -80, top: -50 }} />
        {emoji && <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 36 }}>{emoji}</div>}
      </div>
    );
  }
  return null;
}

const MOOD_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#ef4444', 2: '#f97316', 3: '#f97316',
  4: '#eab308', 5: '#eab308', 6: '#84cc16',
  7: '#22c55e', 8: '#22c55e', 9: '#10b981', 10: '#059669',
};

type FeedItemType =
  | { kind: 'activity'; entry: { id: string; activityId: string; startTime: string; endTime?: string; comment?: string }; act: ActivityType; time: string }
  | { kind: 'mood'; snap: MoodSnapshot; time: string };

const PERIOD_LABELS = { morning: 'утро', day: 'день', evening: 'вечер', night: 'ночь' } as const;

function getTimePeriod(time: string): keyof typeof PERIOD_LABELS {
  const h = parseInt(time.split(':')[0]);
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

function formatDuration(startTime: string, endTime?: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  let eh: number, em: number;
  if (endTime) {
    [eh, em] = endTime.split(':').map(Number);
  } else {
    const now = new Date();
    eh = now.getHours();
    em = now.getMinutes();
  }
  const diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin < 1) return '< 1м';
  if (diffMin < 60) return `${diffMin}м`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function formatDurationMins(startTime: string, endTime?: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  let eh: number, em: number;
  if (endTime) {
    [eh, em] = endTime.split(':').map(Number);
  } else {
    const now = new Date();
    eh = now.getHours();
    em = now.getMinutes();
  }
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function adjustTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m + minutes;
  total = Math.max(0, Math.min(23 * 60 + 59, total));
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function NowPage() {
  const navigate = useNavigate();
  const { getOrCreateToday, toggleActivity, saveDay, addMoodSnapshot, updateMoodSnapshot, deleteMoodSnapshot, toggleEvent, updateEventEntry, updateActivityEntry, deleteActivityEntry, activeActivities } = useDays();
  const { activities, addActivity, reorderActivities, deleteActivity: deleteActivityType, updateActivity } = useActivities();
  const { getObjectById } = useObjects();
  const { events, addEvent, deleteEvent } = useEvents();
  const { eventGroups, addEventGroup, updateEventGroup, deleteEventGroup, reorderEventGroups } = useEventGroups();
  const { activeLensIds } = useLenses();
  const { openDrawer } = useDrawer();
  const today = getOrCreateToday();
  const streak = getStreak();
  const hasActiveLenses = activeLensIds.length > 0;

  // Panel + sheet state
  const [momentSheetOpen, setMomentSheetOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'activity' | 'state' | 'events' | null>(null);

  const [showState, setShowState] = useState(false); // unused, kept for compat
  const [tempMood, setTempMood] = useState(today.mood);
  const [tempEnergy, setTempEnergy] = useState(today.energy);
  const [tempComment, setTempComment] = useState('');
  const [tempTrigger, setTempTrigger] = useState<MoodSnapshot['trigger'] | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [commentingEntry, setCommentingEntry] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [justStarted, setJustStarted] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const commentRef = useRef<HTMLInputElement>(null);

  // Edit mode for activity grid
  const [gridEditMode, setGridEditMode] = useState(false);
  const [gridExpanded, setGridExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetActivity, setSheetActivity] = useState<ActivityType | null>(null);
  const [compositeSheet, setCompositeSheet] = useState<{ open: boolean; activity: ActivityType | null }>({ open: false, activity: null });
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editSnapMood, setEditSnapMood] = useState(5);
  const [editSnapEnergy, setEditSnapEnergy] = useState(5);
  const [editSnapComment, setEditSnapComment] = useState('');

  // Events state
  const [eventsEditMode, setEventsEditMode] = useState(false);
  const [descSheet, setDescSheet] = useState<{ open: boolean; eventId: string | null; text: string; intensity: number }>({ open: false, eventId: null, text: '', intensity: 1 });
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [editGroupLabel, setEditGroupLabel] = useState('');
  const [addingInGroup, setAddingInGroup] = useState<string | false>(false);
  const [newEventEmoji, setNewEventEmoji] = useState('');
  const [newEventLabel, setNewEventLabel] = useState('');
  const [showEventEmojiPicker, setShowEventEmojiPicker] = useState(false);

  useEffect(() => {
    if (activeActivities.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [activeActivities.length]);

  useEffect(() => {
    if (commentingEntry && commentRef.current) commentRef.current.focus();
  }, [commentingEntry]);

  useEffect(() => {
    if (!justStarted) return;
    const t = setTimeout(() => setJustStarted(null), 5000);
    return () => clearTimeout(t);
  }, [justStarted]);

  const handleToggle = useCallback((activityId: string) => {
    const wasActive = activeActivities.includes(activityId);
    const act = activities.find((a) => a.id === activityId);
    // Composite activity → open selection sheet on START. On STOP just toggle off.
    if (!wasActive && act?.composite) {
      setCompositeSheet({ open: true, activity: act });
      return;
    }
    toggleActivity(activityId);
    if (!wasActive) setJustStarted(activityId);
    else if (justStarted === activityId) setJustStarted(null);
  }, [activeActivities, activities, toggleActivity, justStarted]);

  const handleCompositeSelect = useCallback((opts: { variantId?: string; objectId?: string }) => {
    const act = compositeSheet.activity;
    if (!act) return;
    toggleActivity(act.id, opts);
    setJustStarted(act.id);
  }, [compositeSheet.activity, toggleActivity]);

  // Resolve display label for a running entry (template + variant/object)
  const getEntryLabel = useCallback((activityId: string): { mainLabel: string; subLabel?: string } => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return { mainLabel: '' };
    const entry = today.activities.find((a) => a.activityId === activityId && !a.endTime);
    if (!entry) return { mainLabel: act.label };
    if (entry.objectId) {
      const obj = getObjectById(entry.objectId);
      if (obj) return { mainLabel: act.label, subLabel: obj.title };
    }
    if (entry.variantId && act.composite?.variants) {
      const v = act.composite.variants.find((x) => x.id === entry.variantId);
      if (v) return { mainLabel: act.label, subLabel: v.label };
      // synthetic ad-hoc variant (not in template list)
      return { mainLabel: act.label, subLabel: entry.variantId.replace(/_/g, ' ') };
    }
    return { mainLabel: act.label };
  }, [activities, today.activities, getObjectById]);

  const getRunningEntry = useCallback((activityId: string) => {
    return today.activities.find((a) => a.activityId === activityId && !a.endTime);
  }, [today.activities]);

  const handleTimeShift = useCallback((activityId: string, shiftMinutes: number) => {
    const entry = getRunningEntry(activityId);
    if (!entry) return;
    updateActivityEntry(entry.id, { startTime: adjustTime(entry.startTime, shiftMinutes) });
    setJustStarted(null);
  }, [getRunningEntry, updateActivityEntry]);

  const INTENSITY_LEVELS = [1, 2, 3, 5, 10] as const;
  const INTENSITY_COLORS = ['var(--color-primary)', '#eab308', '#f97316', '#ef4444', '#dc2626'];
  const INTENSITY_LABELS = ['Слабо', 'Немного', 'Умеренно', 'Сильно', 'Очень сильно'];
  const multiplierToIntensity = (m: number) => Math.max(0, INTENSITY_LEVELS.indexOf(m as typeof INTENSITY_LEVELS[number]));
  const EVENT_EMOJIS = [
    '🍷','🍺','🚬','🍔','😰','💭','⚡','🤒','💊','❤️',
    '🎉','💡','🙏','🏆','😤','👥','✈️','💰','🎓','😴',
    '🥊','🧘','🎸','📱','💻','🚗','🐕','🌿','☕','😢',
    '😡','🥳','🤗','😂','🤔','😮','😎','🤑','🫂','🩺',
  ];

  // Тап на чип всегда открывает шторку. Если событие ещё не добавлено — показываем шторку
  // с дефолтными значениями; «Сохранить» добавит его, «Убрать» / закрыть — ничего не делает.
  const handleEventOpenSheet = (eventId: string) => {
    const entry = today.events.find((e) => e.eventId === eventId);
    const intensity = entry ? multiplierToIntensity(entry.multiplier) + 1 : 1;
    setDescSheet({ open: true, eventId, text: entry?.description || '', intensity });
  };

  const saveDescription = () => {
    if (descSheet.eventId) {
      const multiplier = INTENSITY_LEVELS[descSheet.intensity - 1];
      const alreadyActive = today.events.some((e) => e.eventId === descSheet.eventId);
      if (!alreadyActive) toggleEvent(descSheet.eventId); // добавляем запись, если её не было
      updateEventEntry(descSheet.eventId, { description: descSheet.text.trim() || undefined, multiplier });
    }
    setDescSheet({ open: false, eventId: null, text: '', intensity: 1 });
  };

  const removeEventFromDay = () => {
    if (descSheet.eventId) {
      const alreadyActive = today.events.some((e) => e.eventId === descSheet.eventId);
      if (alreadyActive) toggleEvent(descSheet.eventId);
    }
    setDescSheet({ open: false, eventId: null, text: '', intensity: 1 });
  };

  const renderEventChip = (tag: typeof events[0]) => {
    const entry = today.events.find((e) => e.eventId === tag.id);
    const isActive = !!entry;
    const intensityIdx = entry ? multiplierToIntensity(entry.multiplier) : 0;
    const activeColor = INTENSITY_COLORS[intensityIdx];

    if (eventsEditMode) {
      return (
        <div key={tag.id} className="relative">
          <span className="px-3 py-1.5 rounded-full text-sm border bg-background text-muted-foreground border-border inline-flex items-center gap-1 select-none">
            <span>{tag.emoji}</span>{tag.label}
          </span>
          <button
            onClick={() => deleteEvent(tag.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <button
        key={tag.id}
        onClick={() => handleEventOpenSheet(tag.id)}
        className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border select-none text-sm transition-colors cursor-pointer"
        style={isActive ? {
          backgroundColor: activeColor,
          borderColor: activeColor,
          color: '#fff',
        } : {
          backgroundColor: 'transparent',
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <span className="leading-none">{tag.emoji}</span>
        {tag.label}
        {entry?.description && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/60" />
        )}
      </button>
    );
  };

  const handleSaveState = () => {
    addMoodSnapshot(tempMood, tempEnergy, tempComment, tempTrigger ?? undefined);
    setTempComment('');
    setTempTrigger(null);
    setActivePanel(null);
  };

  const formatDate = () => {
    const d = new Date();
    return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const activeEntries = useMemo(() => {
    return activeActivities
      .map((actId) => {
        const entry = today.activities.find((a) => a.activityId === actId && !a.endTime);
        const actInfo = activities.find((a) => a.id === actId);
        if (!entry || !actInfo) return null;
        return { entry, actInfo };
      })
      .filter(Boolean) as { entry: typeof today.activities[0]; actInfo: typeof activities[0] }[];
  }, [activeActivities, today.activities, activities]);

  const timelineEntries = useMemo(() => [...today.activities].reverse(), [today.activities]);

  const timelineStats = useMemo(() => {
    const stats: Record<string, number> = {};
    today.activities.forEach((entry) => {
      const mins = formatDurationMins(entry.startTime, entry.endTime);
      stats[entry.activityId] = (stats[entry.activityId] || 0) + mins;
    });
    return Object.entries(stats)
      .map(([id, mins]) => ({ id, mins, act: activities.find((a) => a.id === id) }))
      .filter((s) => s.act)
      .sort((a, b) => b.mins - a.mins);
  }, [today.activities, activities, tick]);

  const totalMinutes = useMemo(() => timelineStats.reduce((sum, s) => sum + s.mins, 0), [timelineStats]);

  const feedItems = useMemo((): FeedItemType[] => {
    const items: FeedItemType[] = [];
    today.activities.filter((e) => e.endTime).forEach((entry) => {
      const act = activities.find((a) => a.id === entry.activityId);
      if (act) items.push({ kind: 'activity', entry, act, time: entry.startTime });
    });
    today.moodSnapshots.forEach((snap) => {
      items.push({ kind: 'mood', snap, time: snap.time });
    });
    return items.sort((a, b) => b.time.localeCompare(a.time));
  }, [today.activities, today.moodSnapshots, activities]);

  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  const isComplete = today.status === 'complete';

  const handleTimeAdjust = useCallback((entryId: string, field: 'startTime' | 'endTime', minutes: number) => {
    const entry = today.activities.find((a) => a.id === entryId);
    if (!entry) return;
    const currentTime = field === 'startTime' ? entry.startTime : (entry.endTime || nowTimeStr());
    updateActivityEntry(entryId, { [field]: adjustTime(currentTime, minutes) });
  }, [today.activities, updateActivityEntry]);

  const handleSetNow = useCallback((entryId: string, field: 'startTime' | 'endTime') => {
    updateActivityEntry(entryId, { [field]: nowTimeStr() });
  }, [updateActivityEntry]);

  const handleChangeEntryActivity = useCallback((entryId: string, newActivityId: string) => {
    updateActivityEntry(entryId, { activityId: newActivityId });
    setEditingEntry(null);
  }, [updateActivityEntry]);

  const handleSaveComment = useCallback((entryId: string, comment: string) => {
    updateActivityEntry(entryId, { comment: comment || undefined });
    setCommentingEntry(null);
  }, [updateActivityEntry]);

  const handleEditSnapshot = useCallback((id: string) => {
    const snap = today.moodSnapshots.find((s) => s.id === id);
    if (!snap) return;
    setEditingSnapshotId(id);
    setEditSnapMood(snap.mood);
    setEditSnapEnergy(snap.energy);
    setEditSnapComment(snap.comment || '');
  }, [today.moodSnapshots]);

  const handleSaveEditSnapshot = useCallback(() => {
    if (!editingSnapshotId) return;
    updateMoodSnapshot(editingSnapshotId, { mood: editSnapMood, energy: editSnapEnergy, comment: editSnapComment || undefined });
    setEditingSnapshotId(null);
  }, [editingSnapshotId, updateMoodSnapshot, editSnapMood, editSnapEnergy, editSnapComment]);

  const handleDeleteSnapshot = useCallback((id: string) => {
    deleteMoodSnapshot(id);
    if (editingSnapshotId === id) setEditingSnapshotId(null);
  }, [deleteMoodSnapshot, editingSnapshotId]);


  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--color-bento-bg)' }}>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">

      {/* ─── Header ─── */}
      <div className="px-4 pt-5 pb-0 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 12, color: '#78716C', marginBottom: 2 }}>{greeting}</p>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 500, color: '#1C1917', lineHeight: 1.1 }} className="capitalize">{formatDate()}</p>
        </div>
        <button
          onClick={openDrawer}
          style={{ width: 38, height: 38, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 pt-3 pb-6 space-y-2">

        {/* ─── Morning intent ─── */}
        {hasActiveLenses && (
          <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 18, padding: '14px 16px', border: '1.5px solid #e0e7ff' }}>
            <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Намерение на сегодня</p>
            <textarea
              value={today.morningIntent ?? ''}
              onChange={(e) => saveDay({ ...today, morningIntent: e.target.value })}
              placeholder="Как ты хочешь прожить этот день?"
              rows={2}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#312e81', resize: 'none', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.5 }}
            />
          </div>
        )}

        {/* ─── Pair header: streak + mood ─── */}
        <div className="grid grid-cols-2 gap-2">
          <div style={{ background: 'var(--color-cover-coral)', borderRadius: 18, padding: '12px 14px', minHeight: 72 }}>
            <div style={{ fontSize: 11, color: '#1C1917', opacity: 0.6, fontWeight: 500, marginBottom: 4 }}>🔥 Серия</div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>
              {streak > 0 ? `${streak} дн.` : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--color-cover-sage)', borderRadius: 18, padding: '12px 14px', minHeight: 72 }}>
            <div style={{ fontSize: 11, color: '#1C1917', opacity: 0.6, fontWeight: 500, marginBottom: 4 }}>Сегодня</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1C1917', lineHeight: 1 }}>{today.mood}</div>
              <div style={{ fontSize: 11, color: '#1C1917', opacity: 0.55 }}>/ {MOOD_LABELS[today.mood]}</div>
            </div>
          </div>
        </div>

        {/* ─── Hero tile: MoodRing + state + quick actions ─── */}
        <div style={{ background: 'white', borderRadius: 18, padding: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <MoodRing mood={today.mood} size={72} strokeWidth={7} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: MOOD_COLORS[today.mood] }}>{today.mood}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1917', marginBottom: 4 }}>{MOOD_LABELS[today.mood]}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: totalMinutes > 0 ? 6 : 0 }}>
                <span style={{ fontSize: 12, color: '#78716C' }}>⚡ {today.energy}/10</span>
                {totalMinutes > 0 && <span style={{ fontSize: 12, color: '#78716C' }}>⏱ {Math.floor(totalMinutes / 60)}ч {totalMinutes % 60}м</span>}
              </div>
              {totalMinutes > 0 && (
                <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', gap: 1 }}>
                  {timelineStats.map((s) => (
                    <div key={s.id} style={{ flex: s.mins, background: s.act!.color, borderRadius: 2 }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active entries */}
          <AnimatePresence>
            {activeEntries.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 12, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeEntries.map(({ entry, actInfo }) => {
                    const isCommenting = commentingEntry === entry.id;
                    const hasComment = !!entry.comment;
                    return (
                      <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} layout>
                        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5" style={{ backgroundColor: `${actInfo.color}12`, borderLeft: `3px solid ${actInfo.color}` }}>
                          <span className="text-lg">{actInfo.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm" style={{ color: actInfo.color }}>{actInfo.label}</span>
                              {(() => {
                                const lbl = getEntryLabel(actInfo.id);
                                return lbl.subLabel ? (
                                  <span className="text-xs" style={{ color: actInfo.color, fontWeight: 500 }}>· {lbl.subLabel}</span>
                                ) : null;
                              })()}
                              <span className="text-xs text-muted-foreground">· с {entry.startTime}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            </div>
                            {hasComment && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{entry.comment}</p>}
                          </div>
                          <button onClick={() => setCommentingEntry(isCommenting ? null : entry.id)} className="p-1.5 rounded-lg cursor-pointer transition-colors" style={{ color: hasComment ? actInfo.color : '#a1a1aa', backgroundColor: isCommenting ? `${actInfo.color}15` : 'transparent' }}>
                            <MessageCircle className="w-4 h-4" style={hasComment ? { fill: `${actInfo.color}30` } : undefined} />
                          </button>
                          <button onClick={() => toggleActivity(actInfo.id)} className="p-1.5 rounded-lg cursor-pointer hover:bg-black/5 transition-colors">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <AnimatePresence>
                          {isCommenting && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                              <div className="flex gap-2 mt-1 px-1">
                                <input ref={commentRef} defaultValue={entry.comment || ''} placeholder="Заметка..." className="flex-1 text-sm px-3 py-2 rounded-lg bg-accent/50 border-0 outline-none focus:ring-1 focus:ring-primary/20" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveComment(entry.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setCommentingEntry(null); }} onBlur={(e) => handleSaveComment(entry.id, e.target.value)} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {justStarted === actInfo.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                              <div className="flex items-center gap-1 mt-1 px-1">
                                <span className="text-[10px] text-muted-foreground shrink-0">Начал раньше?</span>
                                {[-60, -30, -15, -5].map((m) => (
                                  <button key={m} onClick={() => handleTimeShift(actInfo.id, m)} className="flex-1 py-1 rounded-md text-[10px] cursor-pointer transition-colors" style={{ backgroundColor: `${actInfo.color}10`, color: actInfo.color }}>{m}м</button>
                                ))}
                                <button onClick={() => setJustStarted(null)} className="p-0.5 rounded cursor-pointer text-muted-foreground/40 hover:text-muted-foreground"><X className="w-3 h-3" /></button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions row */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 14, display: 'flex' }}>
            {[
              { icon: '😊', label: 'Состояние', action: () => setMomentSheetOpen(true) },
              { icon: '⚡', label: 'События', action: () => setActivePanel(activePanel === 'events' ? null : 'events') },
              { icon: '🌙', label: 'Вечер', action: () => navigate('/evening') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, color: '#78716C' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Events panel (expandable) ─── */}
        <AnimatePresence>
          {activePanel === 'events' && (
            <motion.div key="events" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div style={{ background: 'white', borderRadius: 18 }}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">События</span>
                    {today.events.length > 0 && !eventsEditMode && (
                      <div className="flex gap-0.5">
                        {today.events.slice(0, 6).map((e) => {
                          const tag = events.find((t) => t.id === e.eventId);
                          return tag ? <span key={e.eventId} className="text-sm">{tag.emoji}</span> : null;
                        })}
                        {today.events.length > 6 && <span className="text-xs text-muted-foreground">+{today.events.length - 6}</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setEventsEditMode(!eventsEditMode); setRenamingGroupId(null); setAddingInGroup(false); }} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-accent">
                    {eventsEditMode ? <Check className="w-4 h-4 text-green-500" /> : <Settings className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  {!eventsEditMode && <p className="text-[10px] text-muted-foreground">Тап — отметить · интенсивность</p>}
                  {(() => {
                    const ungrouped = events.filter((t) => !t.groupId);
                    if (ungrouped.length === 0 && !eventsEditMode) return null;
                    return (
                      <div className="flex flex-wrap gap-2">
                        {ungrouped.map((tag) => renderEventChip(tag))}
                        {eventsEditMode && (
                          <button onClick={() => { setAddingInGroup('__ungrouped__'); setNewEventEmoji(''); setNewEventLabel(''); setShowEventEmojiPicker(false); }} className="px-3 py-1.5 rounded-full text-xs border border-dashed border-primary/30 text-primary/50 hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /></button>
                        )}
                      </div>
                    );
                  })()}
                  {eventGroups.map((group, groupIdx) => {
                    const groupEvents = events.filter((t) => t.groupId === group.id);
                    const isRenaming = renamingGroupId === group.id;
                    return (
                      <div key={group.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-border" />
                          {isRenaming ? (
                            <input autoFocus value={editGroupLabel} onChange={(e) => setEditGroupLabel(e.target.value)} onBlur={() => { if (editGroupLabel.trim()) updateEventGroup(group.id, editGroupLabel.trim()); setRenamingGroupId(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenamingGroupId(null); }} className="text-[11px] px-2 py-0.5 rounded bg-accent/60 border-0 outline-none w-28 text-center" />
                          ) : (
                            <span onClick={() => { if (eventsEditMode) { setRenamingGroupId(group.id); setEditGroupLabel(group.label); } }} className={`text-[11px] text-muted-foreground px-1 flex items-center gap-1 ${eventsEditMode ? 'cursor-pointer hover:text-foreground' : ''}`}>
                              {group.label}
                              {eventsEditMode && <Pencil className="w-2.5 h-2.5 opacity-40" />}
                            </span>
                          )}
                          <div className="h-px flex-1 bg-border" />
                          {eventsEditMode && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button onClick={() => reorderEventGroups(groupIdx, groupIdx - 1)} disabled={groupIdx === 0} className="p-0.5 rounded cursor-pointer text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                              <button onClick={() => reorderEventGroups(groupIdx, groupIdx + 1)} disabled={groupIdx === eventGroups.length - 1} className="p-0.5 rounded cursor-pointer text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
                              <button onClick={() => deleteEventGroup(group.id)} className="p-0.5 rounded cursor-pointer text-muted-foreground/30 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupEvents.map((tag) => renderEventChip(tag))}
                          {eventsEditMode && (
                            <button onClick={() => { setAddingInGroup(group.id); setNewEventEmoji(''); setNewEventLabel(''); setShowEventEmojiPicker(false); }} className="px-3 py-1.5 rounded-full text-xs border border-dashed border-primary/30 text-primary/50 hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <AnimatePresence>
                    {addingInGroup !== false && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="p-3 rounded-xl bg-accent/50 space-y-2.5">
                          <p className="text-[10px] text-muted-foreground">Новое событие</p>
                          <div className="flex gap-3 items-center">
                            <button onClick={() => setShowEventEmojiPicker(!showEventEmojiPicker)} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-2 border-primary/20 bg-card text-xl hover:scale-105 transition-transform">{newEventEmoji || '?'}</button>
                            <input autoFocus type="text" value={newEventLabel} onChange={(e) => setNewEventLabel(e.target.value)} placeholder="Название" className="w-full text-sm px-3 py-2 rounded-lg bg-card border-0 outline-none focus:ring-1 focus:ring-primary/20" onKeyDown={(e) => { if (e.key === 'Enter' && newEventEmoji && newEventLabel.trim()) { addEvent({ emoji: newEventEmoji, label: newEventLabel.trim(), groupId: addingInGroup === '__ungrouped__' ? undefined : addingInGroup as string }); setNewEventEmoji(''); setNewEventLabel(''); setAddingInGroup(false); } }} />
                          </div>
                          {showEventEmojiPicker && (
                            <div className="grid grid-cols-10 gap-1 p-2 bg-card rounded-xl">
                              {EVENT_EMOJIS.map((e) => (
                                <button key={e} onClick={() => { setNewEventEmoji(e); setShowEventEmojiPicker(false); }} className={`w-7 h-7 rounded-lg flex items-center justify-center text-base cursor-pointer transition-all ${newEventEmoji === e ? 'bg-primary/10 scale-110' : 'hover:bg-accent'}`}>{e}</button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => { if (newEventEmoji && newEventLabel.trim()) { addEvent({ emoji: newEventEmoji, label: newEventLabel.trim(), groupId: addingInGroup === '__ungrouped__' ? undefined : addingInGroup as string }); setNewEventEmoji(''); setNewEventLabel(''); setAddingInGroup(false); setShowEventEmojiPicker(false); } }} disabled={!newEventEmoji || !newEventLabel.trim()} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity">Добавить</button>
                            <button onClick={() => { setAddingInGroup(false); setNewEventEmoji(''); setNewEventLabel(''); setShowEventEmojiPicker(false); }} className="px-3 py-2 rounded-lg bg-card text-muted-foreground text-xs cursor-pointer hover:bg-accent">Отмена</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {eventsEditMode && (
                    <button onClick={() => addEventGroup('Новая группа')} className="w-full py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary/60 cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />Добавить группу
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Activity section ─── */}
        {(() => {
          const featured = activities.filter((a) => a.featured);
          const rest = activities.filter((a) => !a.featured);
          const shapeFor = (idx: number) => (['circles', 'stripes', 'arc', 'circles'] as const)[idx % 4];
          return (
            <>
              {/* Header above featured + rest */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>Чем занят</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeActivities.length > 0 && <span style={{ fontSize: 12, color: '#C2692A', fontWeight: 500 }}>{activeActivities.length} активны</span>}
                  <button onClick={() => setGridEditMode(!gridEditMode)} style={{ padding: 6, borderRadius: 8, cursor: 'pointer', background: 'transparent', border: 'none' }}>
                    {gridEditMode ? <Check className="w-4 h-4 text-green-500" /> : <Settings className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Featured: large bento tiles */}
              {featured.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {featured.map((act, i) => {
                    const isActive = activeActivities.includes(act.id);
                    const label = getEntryLabel(act.id);
                    return (
                      <button
                        key={act.id}
                        onClick={() => handleToggle(act.id)}
                        style={{
                          background: isActive ? act.color + '22' : '#FFFFFF',
                          border: 'none',
                          borderRadius: 18,
                          padding: 14,
                          minHeight: 108,
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          textAlign: 'left',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <CoverShape type={shapeFor(i)} color={act.color} emoji={act.emoji} />
                        <div style={{ position: 'relative', zIndex: 2 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{act.label}</div>
                          <div style={{ fontSize: 11, color: isActive ? act.color : '#78716C', marginTop: 2, fontWeight: isActive ? 600 : 400 }}>
                            {isActive
                              ? (label.subLabel ? `● ${label.subLabel}` : '● активно')
                              : (act.composite ? (act.composite.kind === 'variants' ? 'Выбрать тип' : 'Выбрать') : 'Отметить')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Rest: compact grid (existing draggable) */}
              {rest.length > 0 && (
                <div style={{ background: 'white', borderRadius: 18, padding: 14 }}>
                  {gridEditMode && <p className="text-xs text-muted-foreground mb-2">Перетаскивайте или нажмите для редактирования</p>}
                  <DraggableActivityGrid
                    activities={rest}
                    activeActivities={activeActivities}
                    editMode={gridEditMode}
                    onToggle={handleToggle}
                    onReorder={(from, to) => {
                      // Translate sub-grid indices back to global indices
                      const restIds = rest.map((r) => r.id);
                      const fromId = restIds[from];
                      const toId = restIds[to];
                      const globalFrom = activities.findIndex((a) => a.id === fromId);
                      const globalTo = activities.findIndex((a) => a.id === toId);
                      if (globalFrom >= 0 && globalTo >= 0) reorderActivities(globalFrom, globalTo);
                    }}
                    onDelete={deleteActivityType}
                    onEdit={(act) => { setSheetActivity(act); setSheetOpen(true); }}
                    onAdd={() => { setSheetActivity(null); setSheetOpen(true); }}
                  />
                </div>
              )}
            </>
          );
        })()}

        {/* ─── Black CTA ─── */}
        <button
          onClick={() => isEvening ? navigate('/evening') : setMomentSheetOpen(true)}
          style={{ width: '100%', padding: '16px 18px', borderRadius: 18, background: '#1C1917', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#C2692A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white' }}>{isEvening ? '🌙' : '+'}</span>
            {isEvening ? 'Вечерний ритуал' : 'Снимок состояния'}
          </span>
          <span style={{ color: '#C2692A', fontSize: 18, fontWeight: 700 }}>›</span>
        </button>

        {/* ─── Completed timeline (collapsible) ─── */}
        {feedItems.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden' }}>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1C1917' }}>История дня</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {totalMinutes > 0 && <span style={{ fontSize: 11, color: '#78716C' }}>{totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}ч${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}м` : ''}` : `${totalMinutes}м`}</span>}
                {showTimeline ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            <AnimatePresence>
              {showTimeline && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-2 pb-2">
                    {(() => {
                      const result: JSX.Element[] = [];
                      let lastPeriod: string | null = null;
                      feedItems.forEach((item, idx) => {
                        const period = getTimePeriod(item.time);
                        if (period !== lastPeriod) {
                          result.push(
                            <div key={`anchor-${period}-${idx}`} className="flex items-center gap-2 my-2 px-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-[10px] text-muted-foreground">{PERIOD_LABELS[period]}</span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                          );
                          lastPeriod = period;
                        }
                        if (item.kind === 'activity') {
                          const { entry, act } = item;
                          const isEditing = editingEntry === entry.id;
                          const duration = formatDuration(entry.startTime, entry.endTime);
                          result.push(
                            <div key={entry.id}>
                              <button onClick={() => setEditingEntry(isEditing ? null : entry.id)} className="w-full flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer text-left transition-colors hover:bg-accent/50" style={{ backgroundColor: isEditing ? `${act.color}12` : `${act.color}06`, borderLeft: `3px solid ${act.color}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${act.color}15` }}><span className="text-base">{act.emoji}</span></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-tight" style={{ color: act.color }}>{act.label}</p>
                                  <p className="text-[11px] text-muted-foreground">{entry.startTime}–{entry.endTime}</p>
                                  {entry.comment && <p className="text-[11px] text-muted-foreground truncate">{entry.comment}</p>}
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{duration}</span>
                              </button>
                              <AnimatePresence>
                                {isEditing && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                    <div className="py-2 px-2 space-y-2.5">
                                      <input defaultValue={entry.comment || ''} placeholder="Заметка..." className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-accent/40 border-0 outline-none" onBlur={(e) => handleSaveComment(entry.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-muted-foreground/50" /><span className="text-[10px] text-muted-foreground">Начало: {entry.startTime}</span></div>
                                        <div className="flex gap-0.5">
                                          {[-30, -5, -1].map((m) => (<button key={m} onClick={() => handleTimeAdjust(entry.id, 'startTime', m)} className="flex-1 py-1 rounded text-[10px] bg-accent text-muted-foreground cursor-pointer hover:bg-accent/80">{m}м</button>))}
                                          {[1, 5, 30].map((m) => (<button key={m} onClick={() => handleTimeAdjust(entry.id, 'startTime', m)} className="flex-1 py-1 rounded text-[10px] bg-accent text-muted-foreground cursor-pointer hover:bg-accent/80">+{m}м</button>))}
                                        </div>
                                      </div>
                                      {entry.endTime && (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-muted-foreground/50" /><span className="text-[10px] text-muted-foreground">Конец: {entry.endTime}</span></div>
                                          <div className="flex gap-0.5">
                                            {[-30, -5, -1].map((m) => (<button key={m} onClick={() => handleTimeAdjust(entry.id, 'endTime', m)} className="flex-1 py-1 rounded text-[10px] bg-accent text-muted-foreground cursor-pointer hover:bg-accent/80">{m}м</button>))}
                                            <button onClick={() => handleSetNow(entry.id, 'endTime')} className="flex-1 py-1 rounded text-[10px] cursor-pointer" style={{ backgroundColor: `${act.color}15`, color: act.color }}>Сейч</button>
                                            {[1, 5, 30].map((m) => (<button key={m} onClick={() => handleTimeAdjust(entry.id, 'endTime', m)} className="flex-1 py-1 rounded text-[10px] bg-accent text-muted-foreground cursor-pointer hover:bg-accent/80">+{m}м</button>))}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-[10px] text-muted-foreground mb-1 block">Сменить</span>
                                        <div className="flex flex-wrap gap-1">
                                          {activities.filter((a) => a.id !== entry.activityId).slice(0, 10).map((a) => (
                                            <button key={a.id} onClick={() => handleChangeEntryActivity(entry.id, a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: `${a.color}12` }} title={a.label}><span className="text-xs">{a.emoji}</span></button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => { deleteActivityEntry(entry.id); setEditingEntry(null); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-red-500 bg-red-50 cursor-pointer hover:bg-red-100"><Trash2 className="w-3 h-3" />Удалить</button>
                                        <button onClick={() => setEditingEntry(null)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground bg-accent cursor-pointer hover:bg-accent/80"><X className="w-3 h-3" />Закрыть</button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        } else {
                          const { snap } = item;
                          const isSelected = editingSnapshotId === snap.id;
                          result.push(
                            <div key={snap.id}>
                              <button onClick={() => isSelected ? setEditingSnapshotId(null) : handleEditSnapshot(snap.id)} className="w-full flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer text-left hover:bg-accent/50" style={{ backgroundColor: isSelected ? `${MOOD_COLORS[snap.mood]}10` : undefined }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0 relative" style={{ backgroundColor: MOOD_COLORS[snap.mood] }}>
                                  {snap.mood}
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ backgroundColor: '#eab308', opacity: 0.5 + snap.energy / 20 }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">😊 {snap.mood}/10</span>
                                    <span className="text-xs text-muted-foreground">· ⚡ {snap.energy}</span>
                                    {snap.trigger && <span className="text-[10px] text-muted-foreground">· {snap.trigger}</span>}
                                  </div>
                                  {snap.comment && <p className="text-[11px] text-muted-foreground truncate">{snap.comment}</p>}
                                </div>
                                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{snap.time}</span>
                              </button>
                              <AnimatePresence>
                                {isSelected && (() => (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    <div className="mt-2 pt-2 px-2 border-t border-border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{snap.time}</span>
                                        <div className="flex gap-1">
                                          <button onClick={() => handleDeleteSnapshot(snap.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-red-500 bg-red-50 cursor-pointer hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                                          <button onClick={() => setEditingSnapshotId(null)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground bg-accent cursor-pointer hover:bg-accent/80"><X className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] text-muted-foreground">Настроение</span>
                                          <span className="text-xs" style={{ color: MOOD_COLORS[editSnapMood] }}>{editSnapMood} — {MOOD_LABELS[editSnapMood]}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: 11 }, (_, i) => (
                                            <button key={i} onClick={() => setEditSnapMood(i)} className="flex-1 rounded transition-all cursor-pointer" style={{ height: `${12 + i * 1.5}px`, backgroundColor: i <= editSnapMood ? MOOD_COLORS[i] : '#e5e7eb', opacity: i <= editSnapMood ? 1 : 0.3 }} />
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] text-muted-foreground">Энергия</span>
                                          <span className="text-xs" style={{ color: '#eab308' }}>{editSnapEnergy}/10</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: 11 }, (_, i) => (
                                            <button key={i} onClick={() => setEditSnapEnergy(i)} className="flex-1 rounded transition-all cursor-pointer" style={{ height: `${12 + i * 1.5}px`, backgroundColor: i <= editSnapEnergy ? '#eab308' : '#e5e7eb', opacity: i <= editSnapEnergy ? 1 : 0.3 }} />
                                          ))}
                                        </div>
                                      </div>
                                      <input type="text" value={editSnapComment} onChange={(e) => setEditSnapComment(e.target.value)} placeholder="Что повлияло? (необязательно)" className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-accent/50 border-0 outline-none focus:ring-1 focus:ring-primary/20" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditSnapshot(); }} />
                                      <button onClick={handleSaveEditSnapshot} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs cursor-pointer hover:opacity-90 transition-opacity">Сохранить</button>
                                    </div>
                                  </motion.div>
                                ))()}
                              </AnimatePresence>
                            </div>
                          );
                        }
                      });
                      return result;
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
      </div>{/* end scroll wrapper */}

      {/* FAB — opens Moment Sheet */}
      <div className="absolute bottom-6 right-5 z-20">
        <button
          onClick={() => setMomentSheetOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-all active:scale-95"
          style={{ boxShadow: '0 4px 24px rgba(194,105,42,0.35)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Moment Sheet — quick mood+events capture */}
      <Drawer.Root open={momentSheetOpen} onOpenChange={setMomentSheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl outline-none max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            <div className="p-5 space-y-4">
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <h2 className="text-base font-semibold text-foreground">Записать состояние</h2>

              {/* Mood */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Настроение</span>
                  <span className="text-sm" style={{ color: MOOD_COLORS[tempMood] }}>{tempMood} — {MOOD_LABELS[tempMood]}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} onClick={() => setTempMood(i)} className="flex-1 rounded-md transition-all cursor-pointer" style={{ height: `${14 + i * 2}px`, backgroundColor: i <= tempMood ? MOOD_COLORS[i] : '#e5e7eb', opacity: i <= tempMood ? 1 : 0.35 }} />
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Энергия</span>
                  <span className="text-sm" style={{ color: '#eab308' }}>{tempEnergy}/10</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} onClick={() => setTempEnergy(i)} className="flex-1 rounded-md transition-all cursor-pointer" style={{ height: `${14 + i * 2}px`, backgroundColor: i <= tempEnergy ? '#eab308' : '#e5e7eb', opacity: i <= tempEnergy ? 1 : 0.35 }} />
                  ))}
                </div>
              </div>

              {/* Note */}
              <input
                type="text"
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Заметка..."
                className="w-full text-sm px-3 py-2 rounded-lg bg-accent/50 border-0 outline-none focus:ring-1 focus:ring-primary/20"
              />

              {/* Trigger */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Что вызвало изменение?</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: 'work', label: '💼 Работа' },
                    { id: 'rest', label: '😴 Отдых' },
                    { id: 'social', label: '👥 Общение' },
                    { id: 'physical', label: '🏃 Физическое' },
                    { id: 'event', label: '⚡ Событие' },
                    { id: 'spontaneous', label: '✨ Само по себе' },
                  ] as { id: MoodSnapshot['trigger']; label: string }[]).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTempTrigger(tempTrigger === t.id ? null : t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer ${
                        tempTrigger === t.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick events */}
              {events.filter(e => !e.groupId).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Быстрые события</p>
                  <div className="flex flex-wrap gap-2">
                    {events.filter(e => !e.groupId).map((tag) => renderEventChip(tag))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  addMoodSnapshot(tempMood, tempEnergy, tempComment, tempTrigger ?? undefined);
                  setTempComment('');
                  setTempTrigger(null);
                  setMomentSheetOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm cursor-pointer hover:opacity-90 transition-opacity font-medium"
              >
                Зафиксировать →
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Description drawer */}
      <Drawer.Root open={descSheet.open} onOpenChange={(open) => { if (!open) setDescSheet({ open: false, eventId: null, text: '', intensity: 1 }); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-5 space-y-4 outline-none" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            {descSheet.eventId && (() => {
              const tag = events.find((e) => e.id === descSheet.eventId);
              return tag ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tag.emoji}</span>
                  <span className="text-base font-medium">{tag.label}</span>
                </div>
              ) : null;
            })()}

            {/* Intensity bars */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Интенсивность</span>
                <span className="text-xs font-medium" style={{ color: INTENSITY_COLORS[descSheet.intensity - 1] }}>
                  {INTENSITY_LABELS[descSheet.intensity - 1]}
                </span>
              </div>
              <div className="flex gap-1 items-end">
                {INTENSITY_LEVELS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDescSheet((s) => ({ ...s, intensity: i + 1 }))}
                    className="flex-1 rounded transition-all cursor-pointer"
                    style={{
                      height: `${14 + i * 5}px`,
                      backgroundColor: i < descSheet.intensity ? INTENSITY_COLORS[i] : 'var(--color-border)',
                      opacity: i < descSheet.intensity ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>

            <textarea
              value={descSheet.text}
              onChange={(e) => setDescSheet((s) => ({ ...s, text: e.target.value }))}
              placeholder="Заметка к событию..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-accent/40 border-0 outline-none text-sm resize-none focus:ring-1 focus:ring-primary/20"
            />
            <div className="flex gap-2">
              <button onClick={saveDescription} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm cursor-pointer hover:opacity-90 transition-opacity">
                Сохранить
              </button>
              <button onClick={() => setDescSheet({ open: false, eventId: null, text: '', intensity: 1 })} className="px-4 py-2.5 rounded-xl bg-accent text-muted-foreground text-sm cursor-pointer hover:bg-accent/70 transition-colors">
                Отмена
              </button>
            </div>
            {descSheet.eventId && today.events.some((e) => e.eventId === descSheet.eventId) && (
              <button
                onClick={removeEventFromDay}
                className="w-full py-2 rounded-xl text-sm text-destructive/70 cursor-pointer hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                Убрать событие из дня
              </button>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Composite activity sheet (variants / progress objects) */}
      <CompositeActivitySheet
        open={compositeSheet.open}
        activity={compositeSheet.activity}
        onClose={() => setCompositeSheet({ open: false, activity: null })}
        onSelect={handleCompositeSelect}
      />
    </div>
  );
}
