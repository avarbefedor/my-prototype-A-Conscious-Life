import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Moon, Smile, Zap, Briefcase, Dumbbell, Footprints, UtensilsCrossed, BookHeart, ChevronRight, ChevronLeft, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DayLog, VIRTUES, ARCHETYPES, ACTIVITIES, MOOD_LABELS } from '../data/types';
import { useDays, detectArchetype } from '../data/store';
import { RatingSlider } from '../components/RatingSlider';
import { SegmentedControl } from '../components/SegmentedControl';

const STEPS = ['Обзор дня', 'Рефлексия'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function EveningPage() {
  const navigate = useNavigate();
  const { getOrCreateToday, saveDay } = useDays();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [day, setDay] = useState<DayLog>(() => {
    const today = getOrCreateToday();
    return { ...today };
  });

  const detectedArch = detectArchetype(day);
  const archInfo = ARCHETYPES.find((a) => a.id === detectedArch);

  const update = (partial: Partial<DayLog>) => {
    setDay((prev) => ({ ...prev, ...partial }));
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSave = () => {
    saveDay({
      ...day,
      status: 'complete',
      detectedArchetype: detectedArch,
    });
    toast.success('День сохранён! ✨');
    navigate('/');
  };

  // Timeline for display
  const timelineActivities = day.activities.filter((a) => a.endTime);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-accent cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-foreground">Вечерний ритуал</h2>
          <p className="text-xs text-muted-foreground">Подведи итоги дня</p>
        </div>
      </div>

      {/* Step dots */}
      <div className="px-5 pb-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-indigo-500' : 'bg-accent'}`} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-4 pb-4"
          >
            {step === 0 && (
              <StepReview
                day={day}
                update={update}
                timelineActivities={timelineActivities}
                archInfo={archInfo}
                detectedArch={detectedArch}
              />
            )}
            {step === 1 && (
              <StepReflection day={day} update={update} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 flex gap-3">
        {step > 0 && (
          <button
            onClick={prev}
            className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-indigo-500 text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Далее
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Сохранить день
          </button>
        )}
      </div>
    </div>
  );
}

function StepReview({ day, update, timelineActivities, archInfo, detectedArch }: {
  day: DayLog;
  update: (p: Partial<DayLog>) => void;
  timelineActivities: DayLog['activities'];
  archInfo: typeof ARCHETYPES[number] | undefined;
  detectedArch: string;
}) {
  return (
    <>
      {/* Activity Timeline Summary */}
      {timelineActivities.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Твой день</span>
          </div>
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
                  className="rounded-xl p-2.5 flex items-center gap-2.5"
                  style={{ backgroundColor: `${act.color}12` }}
                >
                  <span className="text-lg">{act.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: act.color }}>{act.label}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.startTime} – {entry.endTime}</p>
                  </div>
                  <span className="text-xs tabular-nums" style={{ color: act.color }}>{durationStr}</span>
                </div>
              );
            })}
          </div>
          {/* Summary */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-border/50">
            {Array.from(new Set(timelineActivities.map((a) => a.activityId))).map((id) => {
              const act = ACTIVITIES.find((a) => a.id === id);
              if (!act) return null;
              const totalMin = timelineActivities
                .filter((e) => e.activityId === id && e.endTime)
                .reduce((sum, e) => {
                  const [sh, sm] = e.startTime.split(':').map(Number);
                  const [eh, em] = e.endTime!.split(':').map(Number);
                  return sum + (eh * 60 + em) - (sh * 60 + sm);
                }, 0);
              const hours = Math.floor(totalMin / 60);
              const mins = totalMin % 60;
              return (
                <div key={id} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: act.color }} />
                  <span className="text-[10px] text-muted-foreground">
                    {act.label} {hours > 0 ? `${hours}ч` : ''}{mins > 0 ? `${mins}м` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected Archetype */}
      {archInfo && (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <p className="text-xs text-indigo-400 mb-1">Система определила</p>
          <p className="text-sm text-indigo-700">
            Сегодня ты был <span className="text-indigo-800">{archInfo.name}</span> — {archInfo.traits.join(', ')}
          </p>
        </div>
      )}

      {/* Sleep */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm">Сколько спал?</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => update({ sleep: { ...day.sleep, hours: Math.max(0, day.sleep.hours - 0.5) } })}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center cursor-pointer hover:bg-accent/80"
            >
              −
            </button>
            <span className="w-12 text-center text-lg">{day.sleep.hours}ч</span>
            <button
              type="button"
              onClick={() => update({ sleep: { ...day.sleep, hours: Math.min(14, day.sleep.hours + 0.5) } })}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center cursor-pointer hover:bg-accent/80"
            >
              +
            </button>
          </div>
        </div>
        <RatingSlider
          value={day.sleep.quality}
          onChange={(q) => update({ sleep: { ...day.sleep, quality: q } })}
          label="Качество сна"
          showLabels={false}
          color="#6366f1"
        />
      </div>

      {/* Final mood & energy */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <RatingSlider
          value={day.mood}
          onChange={(v) => update({ mood: v })}
          label="Итоговое настроение"
          icon={<Smile className="w-5 h-5 text-amber-500" />}
          showLabels={true}
        />
        <RatingSlider
          value={day.energy}
          onChange={(v) => update({ energy: v })}
          label="Итоговая энергия"
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
          showLabels={false}
          color="#eab308"
        />
      </div>

      {/* Work & Training */}
      <SegmentedControl
        value={day.work}
        onChange={(v) => update({ work: v as any })}
        options={[
          { value: 'minus', label: 'Work−' },
          { value: 'normal', label: 'Work' },
          { value: 'plus', label: 'Work+' },
        ]}
        label="Работа"
        icon={<Briefcase className="w-5 h-5 text-blue-500" />}
      />

      <SegmentedControl
        value={day.training}
        onChange={(v) => update({ training: v as any })}
        options={[
          { value: 'minus', label: 'TR−' },
          { value: 'normal', label: 'TR' },
          { value: 'plus', label: 'TR+' },
        ]}
        label="Тренировка"
        icon={<Dumbbell className="w-5 h-5 text-emerald-500" />}
      />

      {/* Steps & Nutrition (compact) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-3 border border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Footprints className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Шаги</span>
          </div>
          <input
            type="number"
            value={day.steps || ''}
            onChange={(e) => update({ steps: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg bg-input-background border-0 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <UtensilsCrossed className="w-4 h-4 text-rose-500" />
            <span className="text-xs text-muted-foreground">Ккал</span>
          </div>
          <input
            type="number"
            value={day.nutrition.calories || ''}
            onChange={(e) => update({ nutrition: { ...day.nutrition, calories: parseInt(e.target.value) || 0 } })}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg bg-input-background border-0 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </>
  );
}

function StepReflection({ day, update }: { day: DayLog; update: (p: Partial<DayLog>) => void }) {
  return (
    <>
      {/* Virtue */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <BookHeart className="w-5 h-5 text-teal-500" />
          <span className="text-sm text-muted-foreground">Добродетель дня</span>
          <span className="text-[10px] text-muted-foreground ml-auto">необязательно</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VIRTUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ virtue: day.virtue === v ? null : v })}
              className={`px-3 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                day.virtue === v
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-background text-muted-foreground border-border hover:border-teal-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {day.virtue && (
          <input
            type="text"
            value={day.virtueNote}
            onChange={(e) => update({ virtueNote: e.target.value })}
            placeholder="Как проявлялась?"
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border-0 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />
        )}
      </div>

      {/* Reflection */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <span className="text-sm text-muted-foreground">Почему день был таким?</span>
        <textarea
          value={day.reflection}
          onChange={(e) => update({ reflection: e.target.value })}
          placeholder="Опиши ключевые события, мысли, выводы…"
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-input-background border-0 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Можешь пропустить — но рефлексия даёт лучшие инсайты.
        </p>
      </div>
    </>
  );
}