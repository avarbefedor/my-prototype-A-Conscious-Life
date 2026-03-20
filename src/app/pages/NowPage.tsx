import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ChevronDown, ChevronUp, Plus, Moon as MoonIcon, X, Clock, MessageCircle, Trash2, ChevronRight, Settings, Check } from 'lucide-react';
import { useDays, getStreak, useActivities, useEvents } from '../data/store';
import { MOOD_LABELS } from '../data/types';
import type { ActivityType, EventType } from '../data/types';
import { DraggableActivityGrid } from '../components/DraggableActivityGrid';
import { ActivityBottomSheet } from '../components/ActivityBottomSheet';
import { EmojiPickerSheet } from '../components/EmojiPickerSheet';

const MOOD_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#ef4444', 2: '#f97316', 3: '#f97316',
  4: '#eab308', 5: '#eab308', 6: '#84cc16',
  7: '#22c55e', 8: '#22c55e', 9: '#10b981', 10: '#059669',
};

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
  const { getOrCreateToday, toggleActivity, addMoodSnapshot, updateMoodSnapshot, deleteMoodSnapshot, toggleEvent, updateActivityEntry, deleteActivityEntry, activeActivities } = useDays();
  const { activities, addActivity, reorderActivities, deleteActivity: deleteActivityType, updateActivity } = useActivities();
  const { events, addEvent, deleteEvent } = useEvents();
  const today = getOrCreateToday();
  const streak = getStreak();

  const [showState, setShowState] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [tempMood, setTempMood] = useState(today.mood);
  const [tempEnergy, setTempEnergy] = useState(today.energy);
  const [tempComment, setTempComment] = useState('');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [commentingEntry, setCommentingEntry] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [justStarted, setJustStarted] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const commentRef = useRef<HTMLInputElement>(null);

  // Edit mode for activity grid
  const [gridEditMode, setGridEditMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetActivity, setSheetActivity] = useState<ActivityType | null>(null);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editSnapMood, setEditSnapMood] = useState(5);
  const [editSnapEnergy, setEditSnapEnergy] = useState(5);
  const [editSnapComment, setEditSnapComment] = useState('');

  // Events state
  const [eventsEditMode, setEventsEditMode] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
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
    toggleActivity(activityId);
    if (!wasActive) setJustStarted(activityId);
    else if (justStarted === activityId) setJustStarted(null);
  }, [activeActivities, toggleActivity, justStarted]);

  const getRunningEntry = useCallback((activityId: string) => {
    return today.activities.find((a) => a.activityId === activityId && !a.endTime);
  }, [today.activities]);

  const handleTimeShift = useCallback((activityId: string, shiftMinutes: number) => {
    const entry = getRunningEntry(activityId);
    if (!entry) return;
    updateActivityEntry(entry.id, { startTime: adjustTime(entry.startTime, shiftMinutes) });
    setJustStarted(null);
  }, [getRunningEntry, updateActivityEntry]);

  const handleSaveState = () => {
    addMoodSnapshot(tempMood, tempEnergy, tempComment);
    setTempComment('');
    setShowState(false);
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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground">Сейчас</h1>
            <p className="text-sm text-muted-foreground capitalize">{formatDate()}</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4" />
              <span className="text-sm">{streak}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 space-y-3">
        {/* ═══ Active Chips ═══ */}
        <AnimatePresence>
          {activeEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
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
                          <span className="text-xs text-muted-foreground">· с {entry.startTime}</span>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Activity Grid ═══ */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {gridEditMode ? 'Перетаскивайте или нажмите' : activeActivities.length > 0 ? 'Добавить ещё или убрать' : 'Чем ты сейчас занят?'}
            </p>
            <button onClick={() => setGridEditMode(!gridEditMode)} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-accent">
              {gridEditMode ? <Check className="w-4 h-4 text-green-500" /> : <Settings className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>

          <DraggableActivityGrid
            activities={activities}
            activeActivities={activeActivities}
            editMode={gridEditMode}
            onToggle={handleToggle}
            onReorder={reorderActivities}
            onDelete={deleteActivityType}
            onEdit={(act) => { setSheetActivity(act); setSheetOpen(true); }}
            onAdd={() => { setSheetActivity(null); setSheetOpen(true); }}
          />
        </div>

        {/* ═══ Activity Bottom Sheet ═══ */}
        <ActivityBottomSheet
          open={sheetOpen}
          activity={sheetActivity}
          onClose={() => setSheetOpen(false)}
          onSave={(data) => {
            if (sheetActivity) {
              updateActivity(sheetActivity.id, data);
            } else {
              addActivity(data);
            }
            setSheetOpen(false);
          }}
          onDelete={sheetActivity ? () => { deleteActivityType(sheetActivity.id); setSheetOpen(false); } : undefined}
        />

        {/* ═══ Quick State ═══ */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button onClick={() => setShowState(!showState)} className="w-full p-4 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: MOOD_COLORS[today.mood] }}>{today.mood}</div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: '#eab308' }}>{today.energy}</div>
              </div>
              <div>
                <p className="text-sm">Как ты сейчас?</p>
                <p className="text-xs text-muted-foreground">{MOOD_LABELS[today.mood]} · энергия {today.energy}/10</p>
              </div>
            </div>
            {showState ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showState && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-4">
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
                  <input
                    type="text"
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    placeholder="Заметка..."
                    className="w-full text-sm px-3 py-2 rounded-lg bg-accent/50 border-0 outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  <button onClick={handleSaveState} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm cursor-pointer hover:opacity-90 transition-opacity">Записать состояние</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Quick Events ═══ */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <button onClick={() => setShowEvents(!showEvents)} className="flex items-center gap-2 flex-1 cursor-pointer">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">События</span>
              {today.events.length > 0 && (
                <div className="flex gap-1 ml-1">
                  {today.events.slice(0, 4).map((e) => {
                    const tag = events.find((t) => t.id === e.eventId);
                    if (!tag) return null;
                    return (
                      <span key={e.eventId} className="text-sm relative">
                        {tag.emoji}
                        <span className="absolute -top-1 -right-1.5 text-[8px]">
                          {e.intensity === 'strong' ? '+' : e.intensity === 'weak' ? '−' : ''}
                        </span>
                      </span>
                    );
                  })}
                  {today.events.length > 4 && <span className="text-xs text-muted-foreground">+{today.events.length - 4}</span>}
                </div>
              )}
            </button>
            <div className="flex items-center gap-1">
              {showEvents && (
                <button onClick={() => { setEventsEditMode(!eventsEditMode); if (eventsEditMode) setAddingEvent(false); }} className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-accent">
                  {eventsEditMode ? <Check className="w-4 h-4 text-green-500" /> : <Settings className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              )}
              <button onClick={() => setShowEvents(!showEvents)} className="cursor-pointer p-1">
                {showEvents ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showEvents && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3">
                  {/* Hint */}
                  {!eventsEditMode && (
                    <p className="text-[10px] text-muted-foreground">Тап: обычное → сильное (+) → слабое (−) → выкл</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {events.map((tag) => {
                      const entry = today.events.find((e) => e.eventId === tag.id);
                      const intensity = entry?.intensity;
                      const isActive = !!entry;

                      // Visual styling based on intensity
                      let chipClass = '';
                      let chipStyle: React.CSSProperties = {};
                      let badge = '';

                      if (!isActive) {
                        chipClass = 'bg-background text-muted-foreground border-border hover:border-primary/40';
                      } else if (intensity === 'weak') {
                        chipClass = 'text-foreground/60 border-primary/30';
                        chipStyle = { backgroundColor: 'var(--color-primary-foreground)', borderStyle: 'dashed' };
                        badge = '−';
                      } else if (intensity === 'strong') {
                        chipClass = 'text-primary-foreground border-primary';
                        chipStyle = { backgroundColor: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' };
                        badge = '+';
                      } else {
                        chipClass = 'bg-primary text-primary-foreground border-primary';
                        badge = '';
                      }

                      if (eventsEditMode) {
                        return (
                          <div key={tag.id} className="relative">
                            <span className="px-3 py-1.5 rounded-full text-sm border bg-background text-muted-foreground border-border inline-flex items-center gap-1">
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
                          onClick={() => toggleEvent(tag.id)}
                          className={`relative px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer border ${chipClass}`}
                          style={chipStyle}
                        >
                          <span className="mr-1">{tag.emoji}</span>{tag.label}
                          {badge && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Add new event chip */}
                    {eventsEditMode && (
                      <button
                        onClick={() => setAddingEvent(!addingEvent)}
                        className="px-3 py-1.5 rounded-full text-sm border border-dashed border-primary/40 text-primary/60 hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />Своё
                      </button>
                    )}
                  </div>

                  {/* Add new event inline form */}
                  <AnimatePresence>
                    {addingEvent && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="p-3 rounded-xl bg-accent/50 space-y-2.5">
                          <div className="flex gap-3 items-center">
                            <button
                              onClick={() => setShowEventEmojiPicker(true)}
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-2 border-primary/20 bg-card text-xl hover:scale-105 transition-transform"
                            >
                              {newEventEmoji || '?'}
                            </button>
                            <input
                              type="text"
                              value={newEventLabel}
                              onChange={(e) => setNewEventLabel(e.target.value)}
                              placeholder="Название события"
                              className="w-full text-sm px-3 py-2 rounded-lg bg-card border-0 outline-none focus:ring-1 focus:ring-primary/20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newEventEmoji && newEventLabel.trim()) {
                                  addEvent({ emoji: newEventEmoji, label: newEventLabel.trim() });
                                  setNewEventEmoji('');
                                  setNewEventLabel('');
                                  setAddingEvent(false);
                                }
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (newEventEmoji && newEventLabel.trim()) {
                                  addEvent({ emoji: newEventEmoji, label: newEventLabel.trim() });
                                  setNewEventEmoji('');
                                  setNewEventLabel('');
                                  setAddingEvent(false);
                                }
                              }}
                              disabled={!newEventEmoji || !newEventLabel.trim()}
                              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                              Добавить
                            </button>
                            <button
                              onClick={() => { setAddingEvent(false); setNewEventEmoji(''); setNewEventLabel(''); }}
                              className="px-3 py-2 rounded-lg bg-card text-muted-foreground text-xs cursor-pointer hover:bg-accent transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Timeline Bar + Legend ═══ */}
        {today.activities.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-2.5">
            <button onClick={() => setShowTimeline(!showTimeline)} className="w-full flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground">Таймлайн дня</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[10px]">{totalMinutes > 0 ? (totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м` : `${totalMinutes}м`) : ''}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTimeline ? 'rotate-90' : ''}`} />
              </div>
            </button>
            {totalMinutes > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {timelineStats.map((s) => (
                  <div key={s.id} className="h-full rounded-sm first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.max((s.mins / totalMinutes) * 100, 2)}%`, backgroundColor: s.act!.color }} title={`${s.act!.label}: ${s.mins}м`} />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {timelineStats.map((s) => (
                <div key={s.id} className="flex items-center gap-1">
                  <span className="text-xs">{s.act!.emoji}</span>
                  <span className="text-[11px] text-muted-foreground">{s.mins >= 60 ? `${Math.floor(s.mins / 60)}ч${s.mins % 60 > 0 ? ` ${s.mins % 60}м` : ''}` : `${s.mins}м`}</span>
                </div>
              ))}
            </div>
            <AnimatePresence>
              {showTimeline && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="space-y-0.5 pt-1">
                    {timelineEntries.map((entry) => {
                      const act = activities.find((a) => a.id === entry.activityId);
                      if (!act) return null;
                      const isRunning = !entry.endTime;
                      const isEditing = editingEntry === entry.id;
                      const duration = formatDuration(entry.startTime, entry.endTime);
                      return (
                        <div key={entry.id}>
                          <button onClick={() => setEditingEntry(isEditing ? null : entry.id)} className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-left" style={{ backgroundColor: isEditing ? `${act.color}12` : isRunning ? `${act.color}08` : 'transparent' }}>
                            <span className="text-[11px] text-muted-foreground tabular-nums w-[85px] shrink-0">{entry.startTime}–{entry.endTime || '...'}</span>
                            <span className="text-sm">{act.emoji}</span>
                            <span className="text-xs flex-1 truncate" style={{ color: act.color }}>{act.label}</span>
                            {entry.comment && <MessageCircle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                            {isRunning && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: act.color }} />}
                            <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right shrink-0">{duration}</span>
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
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ Mood Snapshots ═══ */}
        {today.moodSnapshots.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Состояние за день</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {today.moodSnapshots.map((snap) => {
                const isSelected = editingSnapshotId === snap.id;
                return (
                  <button
                    key={snap.id}
                    onClick={() => isSelected ? setEditingSnapshotId(null) : handleEditSnapshot(snap.id)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer transition-transform"
                    style={{ transform: isSelected ? 'scale(1.1)' : 'scale(1)' }}
                  >
                    <div className="relative">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs transition-all"
                        style={{
                          backgroundColor: MOOD_COLORS[snap.mood],
                          boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${MOOD_COLORS[snap.mood]}` : 'none',
                        }}
                      >
                        {snap.mood}
                      </div>
                      {/* Energy dot */}
                      <div
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-card"
                        style={{ backgroundColor: '#eab308', opacity: snap.energy / 10 }}
                      />
                      {/* Comment indicator */}
                      {snap.comment && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 flex items-center justify-center">
                          <MessageCircle className="w-1.5 h-1.5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{snap.time}</span>
                  </button>
                );
              })}
            </div>

            {/* Inline editor */}
            <AnimatePresence>
              {editingSnapshotId && (() => {
                const snap = today.moodSnapshots.find((s) => s.id === editingSnapshotId);
                if (!snap) return null;
                return (
                  <motion.div
                    key={editingSnapshotId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{snap.time}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteSnapshot(editingSnapshotId)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-red-500 bg-red-50 cursor-pointer hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingSnapshotId(null)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground bg-accent cursor-pointer hover:bg-accent/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Mood editor */}
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

                      {/* Energy editor */}
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

                      {/* Comment */}
                      <input
                        type="text"
                        value={editSnapComment}
                        onChange={(e) => setEditSnapComment(e.target.value)}
                        placeholder="Что повлияло? (необязательно)"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-accent/50 border-0 outline-none focus:ring-1 focus:ring-primary/20"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditSnapshot(); }}
                      />

                      <button
                        onClick={handleSaveEditSnapshot}
                        className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Сохранить
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ End Day ═══ */}
        <button onClick={() => navigate('/evening')} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-card border border-border text-foreground hover:bg-accent transition-colors cursor-pointer">
          <MoonIcon className="w-5 h-5 text-indigo-500" />
          <span className="text-sm">Завершить день</span>
        </button>
      </div>

      {/* Event emoji picker overlay */}
      <EmojiPickerSheet
        open={showEventEmojiPicker}
        onClose={() => setShowEventEmojiPicker(false)}
        onSelect={(emoji) => setNewEventEmoji(emoji)}
        current={newEventEmoji || undefined}
      />
    </div>
  );
}