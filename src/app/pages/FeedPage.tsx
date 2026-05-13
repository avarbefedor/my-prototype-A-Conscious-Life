import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useDays, isLayerUnlocked, useDevUnlock, useEvents } from '../data/store';
import { DayLog, ACTIVITIES } from '../data/types';
import { useDrawer } from '../context/DrawerContext';

const MOOD_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#ef4444', 2: '#f97316', 3: '#f97316',
  4: '#eab308', 5: '#eab308', 6: '#84cc16',
  7: '#22c55e', 8: '#22c55e', 9: '#10b981', 10: '#059669',
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CHARGING_ACTIVITY_IDS = new Set(['sport', 'reading', 'socializing', 'family', 'hobby', 'walking', 'rest', 'meditation', 'cooking']);
const DRAINING_ACTIVITY_IDS = new Set(['work', 'social_media', 'commute']);

function CoverShape({ type = 'circles', color = '#C2692A', emoji }: { type?: 'circles' | 'stripes' | 'arc'; color?: string; emoji?: string }) {
  const base: React.CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' };
  if (type === 'circles') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: color + '40', right: -40, bottom: -40 }} />
        <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: color + '60', right: -10, bottom: -10 }} />
        {emoji && <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'stripes') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${color}30 0 14px, transparent 14px 32px)` }} />
        {emoji && <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 36 }}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'arc') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: `24px solid ${color}50`, right: -100, top: -60 }} />
        {emoji && <div style={{ position: 'absolute', right: 18, bottom: 12, fontSize: 38 }}>{emoji}</div>}
      </div>
    );
  }
  return null;
}

export function FeedPage() {
  const { days } = useDays();
  const { events } = useEvents();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const navigate = useNavigate();
  const { openDrawer } = useDrawer();

  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLog = days.find((dl) => dl.date === dateStr);
      return { date: dateStr, dayName: WEEKDAYS[i], dayNum: d.getDate(), isToday: dateStr === new Date().toISOString().split('T')[0], log: dayLog };
    });
  }, [days, weekOffset]);

  const summary = useMemo(() => {
    const logs = weekDays.filter((w) => w.log).map((w) => w.log!);
    if (!logs.length) return null;
    return {
      avgMood: (logs.reduce((s, d) => s + d.mood, 0) / logs.length).toFixed(1),
      avgSleep: (logs.reduce((s, d) => s + d.sleep.hours, 0) / logs.length).toFixed(1),
      totalSteps: logs.reduce((s, d) => s + d.steps, 0),
      trainDays: logs.filter((d) => d.training).length,
      days: logs.length,
    };
  }, [weekDays]);

  const moods = weekDays.map((w) => w.log?.mood ?? null);

  useDevUnlock();
  const energyLayerActive = isLayerUnlocked('energy');

  const energyStats = useMemo(() => {
    if (!energyLayerActive) return null;
    let chargingMins = 0, drainingMins = 0;
    weekDays.filter((w) => w.log).forEach((w) => {
      (w.log!.activities || []).filter((a) => a.endTime).forEach((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime!.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (CHARGING_ACTIVITY_IDS.has(entry.activityId)) chargingMins += mins;
        else if (DRAINING_ACTIVITY_IDS.has(entry.activityId)) drainingMins += mins;
      });
    });
    const total = chargingMins + drainingMins;
    return total > 0 ? { chargingMins, drainingMins, total } : null;
  }, [weekDays, energyLayerActive]);

  const weekLabel = useMemo(() => {
    const first = new Date(weekDays[0].date);
    const last = new Date(weekDays[6].date);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${first.toLocaleDateString('ru-RU', opts)} — ${last.toLocaleDateString('ru-RU', opts)}`;
  }, [weekDays]);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--color-bento-bg)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#78716C', marginBottom: 2 }}>
            {view === 'week' ? 'Эта неделя' : 'Этот месяц'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#1C1917', lineHeight: 1.1 }}>
            {summary?.avgMood ?? '—'} <span style={{ fontSize: 14, color: '#78716C', fontStyle: 'normal', fontFamily: 'DM Sans, sans-serif' }}>средний день</span>
          </div>
        </div>
        <button
          onClick={openDrawer}
          style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Menu style={{ width: 16, height: 16, color: '#1C1917' }} />
        </button>
      </div>

      {/* View toggle */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3 }}>
          {([{ key: 'week', label: 'Неделя' }, { key: 'month', label: 'Месяц' }] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: view === v.key ? '#FFFFFF' : 'transparent',
                color: view === v.key ? '#1C1917' : '#78716C',
                boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        {view === 'week' ? (
          <BentoWeekContent
            weekDays={weekDays}
            summary={summary}
            moods={moods}
            energyStats={energyStats}
            weekLabel={weekLabel}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            onDayClick={(d) => navigate(`/day/${d}`)}
          />
        ) : (
          <MonthView
            days={days}
            events={events}
            offset={monthOffset}
            setOffset={setMonthOffset}
            onDayClick={(d) => navigate(`/day/${d}`)}
          />
        )}
      </div>
    </div>
  );
}

function BentoWeekContent({
  weekDays, summary, moods, energyStats, weekLabel, weekOffset, setWeekOffset, onDayClick,
}: {
  weekDays: { date: string; dayName: string; dayNum: number; isToday: boolean; log?: DayLog }[];
  summary: { avgMood: string; avgSleep: string; totalSteps: number; trainDays: number; days: number } | null;
  moods: (number | null)[];
  energyStats: { chargingMins: number; drainingMins: number; total: number } | null;
  weekLabel: string;
  weekOffset: number;
  setWeekOffset: (o: number) => void;
  onDayClick: (date: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ padding: 6, borderRadius: 8, background: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft style={{ width: 18, height: 18, color: '#1C1917' }} />
        </button>
        <span style={{ fontSize: 12, color: '#78716C' }}>{weekLabel}</span>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          disabled={weekOffset >= 0}
          style={{ padding: 6, borderRadius: 8, background: '#FFFFFF', border: 'none', cursor: weekOffset >= 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', opacity: weekOffset >= 0 ? 0.4 : 1 }}
        >
          <ChevronRight style={{ width: 18, height: 18, color: '#1C1917' }} />
        </button>
      </div>

      {/* Pair header: tracked days + trainings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-cover-peach)', borderRadius: 18, padding: 14, minHeight: 74, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Отмечено</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>
            {summary?.days ?? 0}/7 <span style={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif', color: '#1C191799', fontWeight: 400 }}>дней</span>
          </div>
        </div>
        <div style={{ background: 'var(--color-cover-sky)', borderRadius: 18, padding: 14, minHeight: 74, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Тренировок</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>
            {summary?.trainDays ?? 0} <span style={{ fontSize: 16 }}>🏋️</span>
          </div>
        </div>
      </div>

      {/* Hero: mood bar chart */}
      <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Настроение</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1C1917', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>День за днём</div>
          </div>
          <div style={{ fontSize: 11, color: '#78716C' }}>0–10</div>
        </div>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingBottom: 4 }}>
          {moods.map((m, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                {m !== null ? (
                  <div
                    style={{
                      width: '100%',
                      height: `${(m / 10) * 100}%`,
                      background: weekDays[i].isToday ? '#1C1917' : (MOOD_COLORS[m] ?? '#9ca3af'),
                      borderRadius: 6,
                      minHeight: 6,
                      position: 'relative',
                    }}
                  >
                    {weekDays[i].isToday && (
                      <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, color: '#1C1917', fontFamily: 'JetBrains Mono, monospace' }}>{m}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4 }} />
                )}
              </div>
              <div
                onClick={() => { const w = weekDays[i]; if (w.log || w.isToday) onDayClick(w.date); }}
                style={{ fontSize: 10, color: weekDays[i].isToday ? '#1C1917' : '#78716C', fontWeight: weekDays[i].isToday ? 700 : 400, cursor: (weekDays[i].log || weekDays[i].isToday) ? 'pointer' : 'default' }}
              >
                {weekDays[i].dayName}
              </div>
            </div>
          ))}
        </div>

        {/* Mini dots row for activity ticks */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {weekDays.map((wd) => (
            <div key={wd.date} style={{ flex: 1 }}>
              {wd.log && (wd.log.activities || []).filter((a) => a.endTime).length > 0 && (
                <div style={{ display: 'flex', gap: 1, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  {(wd.log.activities || []).filter((a) => a.endTime).slice(0, 4).map((entry) => {
                    const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                    return <div key={entry.id} style={{ flex: 1, borderRadius: 1, background: act?.color || '#94a3b8' }} />;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2×2 stat tiles: sleep + steps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-cover-lilac)', borderRadius: 18, padding: 14, minHeight: 96, position: 'relative', overflow: 'hidden' }}>
          <CoverShape type="arc" color="#8b5cf6" emoji="😴" />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: 11, color: '#1C1917aa' }}>Средний сон</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>
              {summary?.avgSleep ?? 0}<span style={{ fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>ч</span>
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--color-cover-sage)', borderRadius: 18, padding: 14, minHeight: 96, position: 'relative', overflow: 'hidden' }}>
          <CoverShape type="circles" color="#22c55e" emoji="🚶" />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: 11, color: '#1C1917aa' }}>Шагов</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>
              {summary ? (summary.totalSteps >= 1000 ? (summary.totalSteps / 1000).toFixed(1) + 'к' : summary.totalSteps.toString()) : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Energy balance tile */}
      {energyStats && (
        <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Энергобаланс</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ flex: energyStats.chargingMins, background: '#10b981' }} />
            <div style={{ flex: energyStats.drainingMins, background: '#f97316' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#78716C' }}>
            <span style={{ color: '#059669', fontWeight: 500 }}>⚡ {(energyStats.chargingMins / 60).toFixed(1)}ч заряжающих</span>
            <span style={{ color: '#ea580c', fontWeight: 500 }}>🔋 {(energyStats.drainingMins / 60).toFixed(1)}ч истощающих</span>
          </div>
        </div>
      )}

      {/* Top activities */}
      <TopActivitiesWeek weekDays={weekDays} />

      {/* Black CTA */}
      <button style={{ width: '100%', padding: '16px 18px', borderRadius: 18, background: '#1C1917', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#C2692A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white' }}>→</span>
          Открыть отчёт недели
        </span>
        <span style={{ color: '#C2692A', fontSize: 18, fontWeight: 700 }}>›</span>
      </button>
    </div>
  );
}

function TopActivitiesWeek({ weekDays }: { weekDays: { log?: DayLog }[] }) {
  const topActivities = useMemo(() => {
    const activityMinutes: Record<string, number> = {};
    weekDays.filter((w) => w.log).forEach((w) => {
      (w.log!.activities || []).filter((a) => a.endTime).forEach((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime!.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins > 0) activityMinutes[entry.activityId] = (activityMinutes[entry.activityId] || 0) + mins;
      });
    });
    return Object.entries(activityMinutes).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [weekDays]);

  if (topActivities.length === 0) return null;
  const maxMins = topActivities[0][1];

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', marginBottom: 12 }}>Топ активностей</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topActivities.map(([id, mins]) => {
          const act = ACTIVITIES.find((a) => a.id === id);
          if (!act) return null;
          const hours = Math.floor(mins / 60);
          const m = mins % 60;
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: act.color + '18', flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>{act.emoji}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#1C1917', marginBottom: 4 }}>{act.label}</div>
                <div style={{ height: 6, background: 'var(--color-bento-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: act.color, width: `${(mins / maxMins) * 100}%` }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: act.color, flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                {hours > 0 ? `${hours}ч` : ''}{m > 0 ? ` ${m}м` : ''}
              </div>
            </div>
          );
        })}
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
      cells.push({ date: dateStr, dayNum: i, inMonth: true, log: days.find((dl) => dl.date === dateStr) });
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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <button onClick={() => setOffset(offset - 1)} style={{ padding: 6, borderRadius: 8, background: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft style={{ width: 18, height: 18, color: '#1C1917' }} />
        </button>
        <span style={{ fontSize: 13, color: '#1C1917', textTransform: 'capitalize' }}>{monthLabel}</span>
        <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} style={{ padding: 6, borderRadius: 8, background: '#FFFFFF', border: 'none', cursor: offset >= 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', opacity: offset >= 0 ? 0.4 : 1 }}>
          <ChevronRight style={{ width: 18, height: 18, color: '#1C1917' }} />
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ background: '#FFFFFF', borderRadius: 18, padding: '12px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <span key={w} style={{ fontSize: 10, color: '#78716C', padding: '2px 0' }}>{w}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {calendarDays.map((cell) => {
            const completedActivities = (cell.log?.activities || []).filter((a) => a.endTime);
            return (
              <button
                key={cell.date}
                onClick={() => (cell.log || cell.date === todayStr) ? onDayClick(cell.date) : undefined}
                style={{
                  borderRadius: 10,
                  padding: '4px 2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: 48,
                  border: cell.date === todayStr ? '2px solid #C2692A40' : '2px solid transparent',
                  background: cell.log ? (MOOD_COLORS[cell.log.mood] ?? '#9ca3af') + '18' : 'transparent',
                  opacity: !cell.inMonth ? 0.3 : 1,
                  cursor: (cell.log || cell.date === todayStr) ? 'pointer' : 'default',
                }}
              >
                <span style={{ fontSize: 12, color: cell.date === todayStr ? '#C2692A' : cell.log ? '#1C1917' : '#78716C' }}>{cell.dayNum}</span>
                {cell.log && completedActivities.length > 0 && (
                  <div style={{ display: 'flex', gap: 1, width: '100%', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                    {completedActivities.slice(0, 4).map((entry) => {
                      const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                      return <div key={entry.id} style={{ flex: 1, borderRadius: 1, background: act?.color || '#94a3b8' }} />;
                    })}
                  </div>
                )}
                {cell.log && cell.log.events.length > 0 && (
                  <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', marginTop: 1 }}>
                    {cell.log.events.slice(0, 2).map((e) => {
                      const tag = events.find((t) => t.id === e.eventId);
                      return tag ? <span key={e.eventId} style={{ fontSize: 8 }}>{tag.emoji}</span> : null;
                    })}
                  </div>
                )}
                {cell.log && completedActivities.length === 0 && cell.log.events.length === 0 && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 2, background: MOOD_COLORS[cell.log.mood] ?? '#9ca3af' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {summaryDays.length > 0 && <MonthSummaryTiles days={summaryDays} />}
    </div>
  );
}

function MonthSummaryTiles({ days }: { days: DayLog[] }) {
  const avgMood = (days.reduce((s, d) => s + d.mood, 0) / days.length).toFixed(1);
  const avgSleep = (days.reduce((s, d) => s + d.sleep.hours, 0) / days.length).toFixed(1);
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const trainingDays = days.filter((d) => d.training).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div style={{ background: 'var(--color-cover-coral)', borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Среднее настр.</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>{avgMood}<span style={{ fontSize: 12, fontWeight: 400 }}>/10</span></div>
      </div>
      <div style={{ background: 'var(--color-cover-sage)', borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Средний сон</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>{avgSleep}<span style={{ fontSize: 14, fontWeight: 400 }}>ч</span></div>
      </div>
      <div style={{ background: 'var(--color-cover-peach)', borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Всего шагов</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>
          {totalSteps >= 1000 ? (totalSteps / 1000).toFixed(0) + 'к' : totalSteps}
        </div>
      </div>
      <div style={{ background: 'var(--color-cover-sky)', borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 11, color: '#1C1917aa', fontWeight: 500 }}>Тренировок</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', fontFamily: 'Fraunces, serif' }}>{trainingDays} <span style={{ fontSize: 16 }}>🏋️</span></div>
      </div>
    </div>
  );
}
