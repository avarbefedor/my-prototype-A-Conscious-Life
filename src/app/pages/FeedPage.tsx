import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Moon, Dumbbell, Footprints, Smile } from 'lucide-react';
import { useDays, isLayerUnlocked, useDevUnlock, useEvents } from '../data/store';
import { DayLog, ACTIVITIES } from '../data/types';

const MOOD_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#ef4444', 2: '#f97316', 3: '#f97316',
  4: '#eab308', 5: '#eab308', 6: '#84cc16',
  7: '#22c55e', 8: '#22c55e', 9: '#10b981', 10: '#059669',
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function FeedPage() {
  const { days } = useDays();
  const { events } = useEvents();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-foreground">Лента</h1>
      </div>

      <div className="px-5 pb-4">
        <div className="flex bg-accent/50 rounded-lg p-1">
          {([
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex-1 py-2 rounded-md text-sm transition-all cursor-pointer ${
                view === v.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {view === 'week' ? (
          <WeekView days={days} events={events} offset={weekOffset} setOffset={setWeekOffset} onDayClick={(d) => navigate(`/day/${d}`)} />
        ) : (
          <MonthView days={days} events={events} offset={monthOffset} setOffset={setMonthOffset} onDayClick={(d) => navigate(`/day/${d}`)} />
        )}
      </div>
    </div>
  );
}

// ---- Activity Stats View with Donut + Ranked List ----

function ActivityStatsView({ days, period, setPeriod }: {
  days: DayLog[];
  period: 'day' | 'week' | 'month';
  setPeriod: (p: 'day' | 'week' | 'month') => void;
}) {
  const stats = useMemo(() => {
    const now = new Date();
    let filteredDays: DayLog[];

    if (period === 'day') {
      const todayStr = now.toISOString().split('T')[0];
      filteredDays = days.filter((d) => d.date === todayStr);
    } else if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredDays = days.filter((d) => new Date(d.date) >= weekAgo);
    } else {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      filteredDays = days.filter((d) => new Date(d.date) >= monthAgo);
    }

    const actMinutes: Record<string, number> = {};
    let totalMin = 0;

    filteredDays.forEach((d) => {
      (d.activities || []).filter((a) => a.endTime).forEach((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime!.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins > 0) {
          actMinutes[entry.activityId] = (actMinutes[entry.activityId] || 0) + mins;
          totalMin += mins;
        }
      });
    });

    const sorted = Object.entries(actMinutes).sort((a, b) => b[1] - a[1]);
    return { sorted, totalMin, daysCount: filteredDays.length };
  }, [days, period]);

  // SVG Donut
  const donutSegments = useMemo(() => {
    if (stats.totalMin === 0) return [];
    const segments: { id: string; pct: number; color: string; emoji: string; offset: number }[] = [];
    let offset = 0;
    stats.sorted.forEach(([id, mins]) => {
      const act = ACTIVITIES.find((a) => a.id === id);
      if (!act) return;
      const pct = (mins / stats.totalMin) * 100;
      segments.push({ id, pct, color: act.color, emoji: act.emoji, offset });
      offset += pct;
    });
    return segments;
  }, [stats]);

  const totalHours = Math.floor(stats.totalMin / 60);
  const totalMins = stats.totalMin % 60;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {([
          { key: 'day', label: 'Сегодня' },
          { key: 'week', label: 'Неделя' },
          { key: 'month', label: 'Месяц' },
        ] as const).map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-all ${
              period === p.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats.totalMin === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Нет данных за этот период</p>
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {donutSegments.map((seg) => {
                    const circumference = 2 * Math.PI * 38;
                    const dashLength = (seg.pct / 100) * circumference;
                    const dashOffset = -(seg.offset / 100) * circumference;
                    return (
                      <circle
                        key={seg.id}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg text-foreground">{totalHours}ч</span>
                  {totalMins > 0 && <span className="text-xs text-muted-foreground">{totalMins}м</span>}
                </div>
              </div>

              {/* Top 5 legend */}
              <div className="flex-1 space-y-2">
                {stats.sorted.slice(0, 5).map(([id, mins]) => {
                  const act = ACTIVITIES.find((a) => a.id === id);
                  if (!act) return null;
                  const pct = Math.round((mins / stats.totalMin) * 100);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: act.color }} />
                      <span className="text-xs flex-1 truncate">{act.label}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ranked List */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
            <p className="text-sm text-muted-foreground mb-1">Детализация</p>
            {stats.sorted.map(([id, mins], index) => {
              const act = ACTIVITIES.find((a) => a.id === id);
              if (!act) return null;
              const hours = Math.floor(mins / 60);
              const m = mins % 60;
              const pct = Math.round((mins / stats.totalMin) * 100);
              const maxMins = stats.sorted[0][1];
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-right">{index + 1}</span>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${act.color}15` }}
                  >
                    <span className="text-lg">{act.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{act.label}</p>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(mins / maxMins) * 100}%`, backgroundColor: act.color }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm tabular-nums" style={{ color: act.color }}>
                      {hours > 0 ? `${hours}ч` : ''}{m > 0 ? ` ${m}м` : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Existing Week / Month views ----

function WeekView({ days, events, offset, setOffset, onDayClick }: {
  days: DayLog[];
  events: { id: string; emoji: string; label: string }[];
  offset: number;
  setOffset: (o: number) => void;
  onDayClick: (date: string) => void;
}) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + offset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLog = days.find((dl) => dl.date === dateStr);
      return {
        date: dateStr,
        dayName: WEEKDAYS[i],
        dayNum: d.getDate(),
        isToday: dateStr === new Date().toISOString().split('T')[0],
        log: dayLog,
      };
    });
  }, [days, offset]);

  const weekLabel = useMemo(() => {
    const first = new Date(weekDays[0].date);
    const last = new Date(weekDays[6].date);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${first.toLocaleDateString('ru-RU', opts)} — ${last.toLocaleDateString('ru-RU', opts)}`;
  }, [weekDays]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset(offset - 1)} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground">{weekLabel}</span>
        <button onClick={() => setOffset(offset + 1)} className="p-2 rounded-lg hover:bg-accent cursor-pointer" disabled={offset >= 0}>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((wd) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isLiveToday = wd.isToday && wd.date === todayStr;
          return (
            <button
              key={wd.date}
              onClick={() => (wd.log || wd.isToday) ? onDayClick(wd.date) : undefined}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer border ${
                wd.isToday ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-accent'
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{wd.dayName}</span>
              <span className={`text-sm mb-1 ${wd.isToday ? 'text-primary' : ''}`}>{wd.dayNum}</span>
              {wd.log ? (
                <>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mb-1 relative"
                    style={{ backgroundColor: MOOD_COLORS[wd.log.mood] || '#9ca3af' }}
                  >
                    {wd.log.mood}
                    {isLiveToday && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-card" />
                    )}
                  </div>
                  {wd.log.activities && wd.log.activities.filter((a) => a.endTime).length > 0 && (
                    <div className="flex gap-px w-full h-1.5 rounded-full overflow-hidden mt-0.5">
                      {wd.log.activities.filter((a) => a.endTime).slice(0, 5).map((entry) => {
                        const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                        return (
                          <div
                            key={entry.id}
                            className="flex-1 rounded-sm"
                            style={{ backgroundColor: act?.color || '#94a3b8' }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {wd.log.events.length > 0 && (
                    <div className="flex gap-px flex-wrap justify-center mt-1">
                      {wd.log.events.slice(0, 3).map((e) => {
                        const tag = events.find((t) => t.id === e.eventId);
                        return tag ? <span key={e.eventId} className="text-[9px]">{tag.emoji}</span> : null;
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground text-xs mb-1">
                  {isLiveToday ? <span className="w-2 h-2 rounded-full bg-primary/40" /> : '—'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <WeekSummary days={weekDays.filter((w) => w.log).map((w) => w.log!)} />
    </div>
  );
}

const CHARGING_ACTIVITY_IDS = new Set(['sport', 'reading', 'socializing', 'family', 'hobby', 'walking', 'rest', 'meditation', 'cooking']);
const DRAINING_ACTIVITY_IDS = new Set(['work', 'social_media', 'commute']);

function WeekSummary({ days }: { days: DayLog[] }) {
  useDevUnlock(); // subscribe to layer unlock changes
  if (days.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Нет данных за эту неделю</p>;

  const avgMood = (days.reduce((s, d) => s + d.mood, 0) / days.length).toFixed(1);
  const avgSleep = (days.reduce((s, d) => s + d.sleep.hours, 0) / days.length).toFixed(1);
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const trainingDays = days.filter((d) => d.training).length;

  const energyLayerActive = isLayerUnlocked('energy');
  let chargingMins = 0, drainingMins = 0;
  if (energyLayerActive) {
    days.forEach((d) => {
      (d.activities || []).filter((a) => a.endTime).forEach((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime!.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (CHARGING_ACTIVITY_IDS.has(entry.activityId)) chargingMins += mins;
        else if (DRAINING_ACTIVITY_IDS.has(entry.activityId)) drainingMins += mins;
      });
    });
  }

  const activityMinutes: Record<string, number> = {};
  days.forEach((d) => {
    (d.activities || []).filter((a) => a.endTime).forEach((entry) => {
      const [sh, sm] = entry.startTime.split(':').map(Number);
      const [eh, em] = entry.endTime!.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      activityMinutes[entry.activityId] = (activityMinutes[entry.activityId] || 0) + mins;
    });
  });
  const topActivities = Object.entries(activityMinutes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
      <p className="text-sm text-muted-foreground">Сводка</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Smile className="w-4 h-4 text-amber-500" />} label="Среднее настроение" value={avgMood} suffix="/10" />
        <Stat icon={<Moon className="w-4 h-4 text-indigo-500" />} label="Средний сон" value={avgSleep} suffix="ч" />
        <Stat icon={<Footprints className="w-4 h-4 text-orange-500" />} label="Всего шагов" value={totalSteps.toLocaleString('ru-RU')} />
        <Stat icon={<Dumbbell className="w-4 h-4 text-emerald-500" />} label="Тренировки" value={`${trainingDays}`} suffix={` из ${days.length}`} />
      </div>

      {energyLayerActive && (chargingMins > 0 || drainingMins > 0) && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground flex-1">Энергобаланс</span>
          <span className="text-xs" style={{ color: '#10b981' }}>⚡ {Math.round(chargingMins / 60 * 10) / 10}ч заряжающих</span>
          <span className="text-xs text-muted-foreground">vs</span>
          <span className="text-xs" style={{ color: '#f97316' }}>🔋 {Math.round(drainingMins / 60 * 10) / 10}ч истощающих</span>
        </div>
      )}

      {topActivities.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Топ активностей</p>
          <div className="space-y-1.5">
            {topActivities.map(([id, mins]) => {
              const act = ACTIVITIES.find((a) => a.id === id);
              if (!act) return null;
              const hours = Math.floor(mins / 60);
              const m = mins % 60;
              const maxMins = topActivities[0][1];
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center">{act.emoji}</span>
                  <span className="text-xs text-muted-foreground w-16">{act.label}</span>
                  <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(mins / maxMins) * 100}%`, backgroundColor: act.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">
                    {hours > 0 ? `${hours}ч` : ''}{m > 0 ? `${m}м` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg text-foreground">
          {value}<span className="text-xs text-muted-foreground">{suffix}</span>
        </p>
      </div>
    </div>
  );
}

function MonthView({ days, events, offset, setOffset, onDayClick }: {
  days: DayLog[];
  events: { id: string; emoji: string; label: string }[];
  offset: number;
  setOffset: (o: number) => void;
  onDayClick: (date: string) => void;
}) {
  const { calendarDays, monthLabel, summaryDays } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + offset;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const label = firstDay.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    const cells: { date: string; dayNum: number; inMonth: boolean; log?: DayLog }[] = [];

    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      cells.push({ date: d.toISOString().split('T')[0], dayNum: d.getDate(), inMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: dateStr,
        dayNum: i,
        inMonth: true,
        log: days.find((dl) => dl.date === dateStr),
      });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        cells.push({ date: d.toISOString().split('T')[0], dayNum: i, inMonth: false });
      }
    }

    const monthDays = days.filter((d) => {
      const dd = new Date(d.date);
      return dd.getMonth() === ((month % 12) + 12) % 12 && dd.getFullYear() === new Date(year, month, 1).getFullYear();
    });

    return { calendarDays: cells, monthLabel: label, summaryDays: monthDays };
  }, [days, offset]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset(offset - 1)} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm capitalize">{monthLabel}</span>
        <button onClick={() => setOffset(offset + 1)} className="p-2 rounded-lg hover:bg-accent cursor-pointer" disabled={offset >= 0}>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] text-muted-foreground py-1">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const completedActivities = (cell.log?.activities || []).filter((a) => a.endTime);
          return (
            <button
              key={cell.date}
              onClick={() => (cell.log || cell.date === todayStr) ? onDayClick(cell.date) : undefined}
              className={`rounded-xl flex flex-col items-center justify-start pt-1 pb-1 px-0.5 text-xs transition-all cursor-pointer relative min-h-[52px] ${
                !cell.inMonth ? 'opacity-30' : ''
              } ${cell.date === todayStr ? 'ring-2 ring-primary/30' : ''}`}
              style={{
                backgroundColor: cell.log
                  ? `${MOOD_COLORS[cell.log.mood]}18`
                  : undefined,
              }}
            >
              <span className={`${cell.log ? '' : 'text-muted-foreground'} ${cell.date === todayStr ? 'text-primary' : ''}`}>{cell.dayNum}</span>
              {cell.log && (
                <>
                  {completedActivities.length > 0 && (
                    <div className="flex gap-px w-full h-1 rounded-full overflow-hidden mt-0.5 px-0.5">
                      {completedActivities.slice(0, 4).map((entry) => {
                        const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                        return (
                          <div
                            key={entry.id}
                            className="flex-1 rounded-sm"
                            style={{ backgroundColor: act?.color || '#94a3b8' }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {cell.log.events.length > 0 && (
                    <div className="flex gap-px flex-wrap justify-center mt-0.5">
                      {cell.log.events.slice(0, 2).map((e) => {
                        const tag = events.find((t) => t.id === e.eventId);
                        return tag ? <span key={e.eventId} className="text-[8px]">{tag.emoji}</span> : null;
                      })}
                    </div>
                  )}
                  {completedActivities.length === 0 && cell.log.events.length === 0 && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: MOOD_COLORS[cell.log.mood] }}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {summaryDays.length > 0 && <WeekSummary days={summaryDays} />}
    </div>
  );
}