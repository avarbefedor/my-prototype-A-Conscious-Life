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

        {/* Activity Timeline */}
        {timelineActivities.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-3">Активности</p>
            <div className="space-y-1.5">
              {timelineActivities.map((entry) => {
                const act = ACTIVITIES.find((a) => a.id === entry.activityId);
                if (!act || !entry.endTime) return null;
                const [sh, sm] = entry.startTime.split(':').map(Number);
                const [eh, em] = entry.endTime.split(':').map(Number);
                const diffMin = (eh * 60 + em) - (sh * 60 + sm);
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                const durationStr = hours > 0 ? (mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`) : `${mins}м`;
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ backgroundColor: `${act.color}12` }}
                  >
                    <span className="text-xl">{act.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: act.color }}>{act.label}</p>
                      <p className="text-xs text-muted-foreground">{entry.startTime} – {entry.endTime}</p>
                    </div>
                    <span className="text-sm tabular-nums" style={{ color: act.color }}>{durationStr}</span>
                  </div>
                );
              })}
            </div>
            {/* Summary donut-like stats */}
            {(() => {
              const actMinutes: Record<string, number> = {};
              let totalMin = 0;
              timelineActivities.forEach((e) => {
                if (!e.endTime) return;
                const [sh, sm] = e.startTime.split(':').map(Number);
                const [eh, em] = e.endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                actMinutes[e.activityId] = (actMinutes[e.activityId] || 0) + mins;
                totalMin += mins;
              });
              const sorted = Object.entries(actMinutes).sort((a, b) => b[1] - a[1]);
              if (sorted.length === 0) return null;
              return (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  {sorted.map(([id, mins]) => {
                    const act = ACTIVITIES.find((a) => a.id === id);
                    if (!act) return null;
                    const pct = Math.round((mins / totalMin) * 100);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-sm w-6 text-center">{act.emoji}</span>
                        <span className="text-xs w-16 text-muted-foreground">{act.label}</span>
                        <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: act.color }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Mood snapshots */}
        {day.moodSnapshots && day.moodSnapshots.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Настроение в течение дня</p>
            <div className="flex gap-2">
              {day.moodSnapshots.map((snap, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: MOOD_COLORS[snap.mood] }}
                  >
                    {snap.mood}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{snap.time}</span>
                </div>
              ))}
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