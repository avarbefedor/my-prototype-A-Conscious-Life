import { useDays } from '../data/store';
import { ARCHETYPES, EVENT_TAGS, MOOD_LABELS, ACTIVITIES } from '../data/types';

const MOOD_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#ef4444', 2: '#f97316', 3: '#f97316',
  4: '#eab308', 5: '#eab308', 6: '#84cc16',
  7: '#22c55e', 8: '#22c55e', 9: '#10b981', 10: '#059669',
};

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  complete: { text: 'Заполнено', color: 'text-emerald-600 bg-emerald-50' },
  partial: { text: 'Частично', color: 'text-amber-600 bg-amber-50' },
  draft: { text: 'Черновик', color: 'text-gray-600 bg-gray-100' },
};

const WORK_LABELS: Record<string, string> = { plus: 'Work+', normal: 'Work', minus: 'Work−' };
const TRAINING_LABELS: Record<string, string> = { plus: 'TR+', normal: 'TR', minus: 'TR−' };

export function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { getDay } = useDays();
  const day = date ? getDay(date) : null;

  if (!day) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p>День не найден</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary underline cursor-pointer">Назад</button>
      </div>
    );
  }

  const formatted = new Date(day.date).toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const statusInfo = STATUS_LABELS[day.status] || STATUS_LABELS.draft;
  const archetype = ARCHETYPES.find((a) => a.id === (day.detectedArchetype || day.archetype));
  const timelineActivities = (day.activities || []).filter((a) => a.endTime);

  const handleCopy = () => {
    toast.success('Значения скопированы на сегодня');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-accent cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-foreground capitalize">{formatted}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">
        {/* Mood hero */}
        <div className="bg-card rounded-2xl p-5 border border-border flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: MOOD_COLORS[day.mood] }}
          >
            {day.mood}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Настроение</p>
            <p className="text-lg">{MOOD_LABELS[day.mood]}</p>
          </div>
        </div>

        {/* Day Feed — unified chronological view */}
        {(timelineActivities.length > 0 || (day.moodSnapshots && day.moodSnapshots.length > 0)) && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <span className="text-sm text-muted-foreground">Хроника дня</span>
            </div>

            {/* Activity time bar */}
            {(() => {
              const actMin: Record<string, number> = {};
              let total = 0;
              timelineActivities.forEach((e) => {
                if (!e.endTime) return;
                const [sh, sm] = e.startTime.split(':').map(Number);
                const [eh, em] = e.endTime.split(':').map(Number);
                const m = (eh * 60 + em) - (sh * 60 + sm);
                actMin[e.activityId] = (actMin[e.activityId] || 0) + m;
                total += m;
              });
              if (total === 0) return null;
              const sorted = Object.entries(actMin).sort((a, b) => b[1] - a[1]);
              return (
                <div className="px-4 pb-3">
                  <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    {sorted.map(([id, m]) => {
                      const act = ACTIVITIES.find((a) => a.id === id);
                      return act ? (
                        <div key={id} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.max((m / total) * 100, 2)}%`, backgroundColor: act.color }} />
                      ) : null;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {sorted.map(([id, m]) => {
                      const act = ACTIVITIES.find((a) => a.id === id);
                      if (!act) return null;
                      const h = Math.floor(m / 60), min = m % 60;
                      return (
                        <div key={id} className="flex items-center gap-1">
                          <span className="text-xs">{act.emoji}</span>
                          <span className="text-[11px] text-muted-foreground">{h > 0 ? `${h}ч${min > 0 ? ` ${min}м` : ''}` : `${min}м`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Feed items with time anchors */}
            <div className="px-2 pb-3">
              {(() => {
                const items: Array<
                  | { kind: 'activity'; entry: typeof timelineActivities[0]; time: string }
                  | { kind: 'mood'; snap: typeof day.moodSnapshots[0]; time: string }
                > = [
                  ...timelineActivities.map((e) => ({ kind: 'activity' as const, entry: e, time: e.startTime })),
                  ...(day.moodSnapshots || []).map((s) => ({ kind: 'mood' as const, snap: s, time: s.time })),
                ].sort((a, b) => b.time.localeCompare(a.time));

                const getPeriod = (t: string) => {
                  const h = parseInt(t.split(':')[0]);
                  if (h >= 6 && h < 12) return 'утро';
                  if (h >= 12 && h < 18) return 'день';
                  if (h >= 18 && h < 23) return 'вечер';
                  return 'ночь';
                };

                const result: JSX.Element[] = [];
                let lastPeriod: string | null = null;

                items.forEach((item, idx) => {
                  const period = getPeriod(item.time);
                  if (period !== lastPeriod) {
                    result.push(
                      <div key={`anchor-${period}-${idx}`} className="flex items-center gap-2 my-2 px-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] text-muted-foreground">{period}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    );
                    lastPeriod = period;
                  }

                  if (item.kind === 'activity') {
                    const { entry } = item;
                    const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                    if (!act || !entry.endTime) return;
                    const [sh, sm] = entry.startTime.split(':').map(Number);
                    const [eh, em] = entry.endTime.split(':').map(Number);
                    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
                    const h = Math.floor(diffMin / 60), m = diffMin % 60;
                    const dur = h > 0 ? (m > 0 ? `${h}ч ${m}м` : `${h}ч`) : `${m}м`;
                    result.push(
                      <div key={entry.id} className="flex items-center gap-3 py-2 px-2 rounded-xl" style={{ backgroundColor: `${act.color}08` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${act.color}15` }}>
                          <span className="text-base">{act.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight" style={{ color: act.color }}>{act.label}</p>
                          <p className="text-[11px] text-muted-foreground">{entry.startTime}–{entry.endTime}</p>
                          {entry.comment && <p className="text-[11px] text-muted-foreground truncate">{entry.comment}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{dur}</span>
                      </div>
                    );
                  } else {
                    const { snap } = item;
                    result.push(
                      <div key={snap.time + idx} className="flex items-center gap-3 py-2 px-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0 relative" style={{ backgroundColor: MOOD_COLORS[snap.mood] }}>
                          {snap.mood}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ backgroundColor: '#eab308', opacity: 0.5 + snap.energy / 20 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">😊 {snap.mood}/10</span>
                            <span className="text-xs text-muted-foreground">· ⚡ {snap.energy}</span>
                          </div>
                          {snap.comment && <p className="text-[11px] text-muted-foreground truncate">{snap.comment}</p>}
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{snap.time}</span>
                      </div>
                    );
                  }
                });
                return result;
              })()}
            </div>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard icon={<Moon className="w-4 h-4 text-indigo-500" />} label="Сон" value={`${day.sleep.hours}ч`} sub={`Качество: ${day.sleep.quality}/10`} />
          <MetricCard icon={<Zap className="w-4 h-4 text-yellow-500" />} label="Энергия" value={`${day.energy}/10`} />
          <MetricCard icon={<Footprints className="w-4 h-4 text-orange-500" />} label="Шаги" value={day.steps.toLocaleString('ru-RU')} />
        </div>

        {/* Work & Training */}
        <div className="grid grid-cols-2 gap-3">
          {day.work && (
            <div className="bg-card rounded-2xl p-3 border border-border flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{WORK_LABELS[day.work]}</span>
            </div>
          )}
          {day.training && (
            <div className="bg-card rounded-2xl p-3 border border-border flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-500" />
              <span className="text-sm">{TRAINING_LABELS[day.training]}</span>
            </div>
          )}
        </div>

        {/* Nutrition */}
        {day.nutrition.calories > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-muted-foreground">Питание</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg">{day.nutrition.calories}</p>
                <p className="text-[10px] text-muted-foreground">ккал</p>
              </div>
              <div>
                <p className="text-lg">{day.nutrition.protein || '—'}</p>
                <p className="text-[10px] text-muted-foreground">белки</p>
              </div>
              <div>
                <p className="text-lg">{day.nutrition.fat || '—'}</p>
                <p className="text-[10px] text-muted-foreground">жиры</p>
              </div>
              <div>
                <p className="text-lg">{day.nutrition.carbs || '—'}</p>
                <p className="text-[10px] text-muted-foreground">углеводы</p>
              </div>
            </div>
          </div>
        )}

        {/* Events */}
        {day.events.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">События</p>
            <div className="flex flex-wrap gap-2">
              {day.events.map((e) => {
                const tag = EVENT_TAGS.find((t) => t.id === e.eventId);
                const intensityLabel = e.intensity === 'strong' ? ' +' : e.intensity === 'weak' ? ' −' : '';
                const intensityStyle = e.intensity === 'strong'
                  ? 'bg-primary/15 border border-primary/30'
                  : e.intensity === 'weak'
                    ? 'bg-accent/50 border border-dashed border-border'
                    : 'bg-accent';
                return tag ? (
                  <span key={e.eventId} className={`px-3 py-1 rounded-full text-sm ${intensityStyle}`}>
                    {tag.emoji} {tag.label}{intensityLabel}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Philosophy */}
        {(day.virtue || archetype) && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <BookHeart className="w-4 h-4 text-teal-500" />
              <span className="text-sm text-muted-foreground">Философия</span>
            </div>
            {day.virtue && (
              <div>
                <p className="text-sm">Добродетель: <span className="text-teal-600">{day.virtue}</span></p>
                {day.virtueNote && <p className="text-xs text-muted-foreground mt-0.5">{day.virtueNote}</p>}
              </div>
            )}
            {archetype && (
              <p className="text-sm">
                Архетип: <span className="text-indigo-600">{archetype.name}</span>
                {day.detectedArchetype && <span className="text-xs text-muted-foreground ml-1">(определён системой)</span>}
              </p>
            )}
          </div>
        )}

        {/* Reflection */}
        {day.reflection && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Рефлексия</p>
            <p className="text-sm">{day.reflection}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm hover:bg-accent cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm hover:bg-accent cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            Копировать
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl p-3 border border-border text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}