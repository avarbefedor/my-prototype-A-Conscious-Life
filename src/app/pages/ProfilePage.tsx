import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Target, Shield, Bell, Smartphone, Moon as MoonIcon, Settings, Sliders, Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check, GripVertical } from 'lucide-react';
import { ARCHETYPES, VIRTUES, ACTIVITIES } from '../data/types';
import { useDays, detectArchetype, useActivities } from '../data/store';
import { toast } from 'sonner';

const VIRTUE_DESCRIPTIONS: Record<string, { desc: string; example: string }> = {
  'Мудрость': { desc: 'Способность видеть суть вещей', example: 'Замедлился и подумал перед решением' },
  'Умеренность': { desc: 'Контроль желаний и эмоций', example: 'Отказался от лишнего бокала, лёг вовремя' },
  'Мужество': { desc: 'Действие вопреки страху и лени', example: 'Пошёл на тренировку, хотя не хотелось' },
  'Справедливость': { desc: 'Честность и забота о других', example: 'Помог коллеге, признал свою ошибку' },
};

const GOALS = [
  { id: 'weight', label: 'Вес' },
  { id: 'mood', label: 'Настроение' },
  { id: 'productivity', label: 'Продуктивность' },
  { id: 'relations', label: 'Отношения' },
  { id: 'habits', label: 'Курение/алкоголь' },
];

const ARCHETYPE_COLORS: Record<string, string> = {
  sage: '#6366f1',
  ruler: '#f59e0b',
  hero: '#ef4444',
  explorer: '#10b981',
};

const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899',
  '#f97316', '#6366f1', '#14b8a6', '#22c55e', '#94a3b8', '#a78bfa',
  '#78716c', '#e879f9', '#ef4444', '#06b6d4', '#84cc16', '#d946ef',
];

const EMOJI_OPTIONS = [
  '💼', '🏋️', '📚', '📱', '👥', '🏠', '🍳', '🎓', '🎨', '🚶',
  '😴', '🧘', '🚗', '🎮', '🎵', '📝', '💻', '🎯', '🧹', '🛒',
  '📞', '🎬', '🏃', '🚴', '🏊', '⚽', '🎸', '📸', '🌱', '🐕',
  '✈️', '🍕', '☕', '🎤', '🧩', '🎲',
];

export function ProfilePage() {
  const { days } = useDays();
  const { activities, addActivity, updateActivity, deleteActivity, reorderActivities } = useActivities();
  const [name, setName] = useState('Пользователь');
  const [selectedGoals, setSelectedGoals] = useState(['mood', 'productivity']);
  const [showVirtues, setShowVirtues] = useState(true);
  const [remindTime, setRemindTime] = useState(true);

  // Activity editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const archetypePercents = useMemo(() => {
    const completeDays = days.filter((d) => d.status === 'complete');
    if (completeDays.length === 0) return { sage: 25, ruler: 25, hero: 25, explorer: 25 };
    const counts: Record<string, number> = { sage: 0, ruler: 0, hero: 0, explorer: 0 };
    completeDays.forEach((d) => {
      const arch = d.detectedArchetype || detectArchetype(d);
      if (counts[arch] !== undefined) counts[arch]++;
    });
    const total = completeDays.length;
    return {
      sage: Math.round((counts.sage / total) * 100),
      ruler: Math.round((counts.ruler / total) * 100),
      hero: Math.round((counts.hero / total) * 100),
      explorer: Math.round((counts.explorer / total) * 100),
    };
  }, [days]);

  const topActivities = useMemo(() => {
    const minutes: Record<string, number> = {};
    days.forEach((d) => {
      (d.activities || []).filter((a) => a.endTime).forEach((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime!.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        minutes[entry.activityId] = (minutes[entry.activityId] || 0) + mins;
      });
    });
    return Object.entries(minutes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [days]);

  const completeDays = days.filter((d) => d.status === 'complete').length;

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  // Activity editing
  const startEditing = (act: typeof activities[0]) => {
    setEditingId(act.id);
    setEditLabel(act.label);
    setEditEmoji(act.emoji);
    setEditColor(act.color);
    setIsAdding(false);
    setShowEmojiPicker(false);
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditLabel('');
    setEditEmoji('🆕');
    setEditColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setShowEmojiPicker(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsAdding(false);
    setShowEmojiPicker(false);
  };

  const saveEditing = () => {
    if (!editLabel.trim()) return;
    if (isAdding) {
      addActivity({ label: editLabel.trim(), emoji: editEmoji, color: editColor });
      toast.success('Активность добавлена');
    } else if (editingId) {
      updateActivity(editingId, { label: editLabel.trim(), emoji: editEmoji, color: editColor });
      toast.success('Активность обновлена');
    }
    cancelEditing();
  };

  const handleDelete = (id: string) => {
    deleteActivity(id);
    if (editingId === id) cancelEditing();
    toast.success('Активность удалена');
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activities.length) return;
    reorderActivities(index, newIndex);
  };

  // Touch drag reorder
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderActivities(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-foreground">Профиль</h1>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* User info */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent outline-none text-lg w-full"
                placeholder="Имя"
              />
              <p className="text-xs text-muted-foreground">{completeDays} дней заполнено</p>
            </div>
          </div>
        </div>

        {/* My Activities */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-500" />
              <span className="text-sm">Мои активности</span>
            </div>
            <button
              onClick={startAdding}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer hover:bg-accent transition-colors"
              style={{ color: '#8B7355' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          </div>

          {/* Add/Edit form */}
          <AnimatePresence>
            {(isAdding || editingId) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl border border-border space-y-3" style={{ borderColor: editColor }}>
                  <div className="flex items-center gap-2">
                    {/* Emoji selector */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl cursor-pointer shrink-0 transition-colors"
                      style={{ backgroundColor: `${editColor}15` }}
                    >
                      {editEmoji}
                    </button>
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Название активности"
                      className="flex-1 px-3 py-2.5 rounded-lg bg-input-background border-0 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                  </div>

                  {/* Emoji picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-9 gap-1 p-2 bg-accent/30 rounded-xl">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => { setEditEmoji(emoji); setShowEmojiPicker(false); }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-all ${editEmoji === emoji ? 'bg-primary/10 scale-110' : 'hover:bg-accent'}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Color picker */}
                  <div>
                    <span className="text-[10px] text-muted-foreground mb-1.5 block">Цвет</span>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className="w-7 h-7 rounded-lg cursor-pointer transition-all"
                          style={{
                            backgroundColor: color,
                            transform: editColor === color ? 'scale(1.2)' : 'scale(1)',
                            boxShadow: editColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Превью:</span>
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: `${editColor}15` }}
                    >
                      <span>{editEmoji}</span>
                      <span className="text-sm" style={{ color: editColor }}>{editLabel || 'Название'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={saveEditing}
                      disabled={!editLabel.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: editColor }}
                    >
                      <Check className="w-4 h-4" />
                      {isAdding ? 'Добавить' : 'Сохранить'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 rounded-xl bg-accent text-sm text-muted-foreground cursor-pointer hover:bg-accent/80 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity list with reorder */}
          <div className="space-y-1">
            {activities.map((act, index) => {
              const isBeingEdited = editingId === act.id;
              return (
                <div
                  key={act.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                    dragIndex === index ? 'opacity-50 scale-95' : ''
                  } ${isBeingEdited ? '' : 'hover:bg-accent/30'}`}
                  style={isBeingEdited ? { backgroundColor: `${act.color}10` } : undefined}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Activity preview */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${act.color}15` }}
                  >
                    {act.emoji}
                  </div>
                  <span className="text-sm flex-1" style={{ color: act.color }}>{act.label}</span>

                  {/* Reorder buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveActivity(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded cursor-pointer text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveActivity(index, 'down')}
                      disabled={index === activities.length - 1}
                      className="p-1 rounded cursor-pointer text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => startEditing(act)}
                    className="p-1.5 rounded-lg cursor-pointer text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-1.5 rounded-lg cursor-pointer text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Перетащите для изменения порядка или используйте стрелки
          </p>
        </div>

        {/* Goals */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm">Мои цели</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-all ${
                  selectedGoals.includes(g.id)
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-background text-muted-foreground border-border hover:border-blue-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Archetypes */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Архетипы</span>
            <span className="text-[10px] text-muted-foreground">определены автоматически</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return ARCHETYPES.map((a) => {
                    const pct = archetypePercents[a.id as keyof typeof archetypePercents] || 0;
                    const circumference = 2 * Math.PI * 40;
                    const dashLength = (pct / 100) * circumference;
                    const dashOffset = -(offset / 100) * circumference;
                    offset += pct;
                    return (
                      <circle key={a.id} cx="50" cy="50" r="40" fill="none" stroke={ARCHETYPE_COLORS[a.id]} strokeWidth="12" strokeDasharray={`${dashLength} ${circumference - dashLength}`} strokeDashoffset={dashOffset} strokeLinecap="round" />
                    );
                  });
                })()}
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              {ARCHETYPES.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCHETYPE_COLORS[a.id] }} />
                  <span className="text-xs flex-1">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{archetypePercents[a.id as keyof typeof archetypePercents]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ARCHETYPES.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-border" style={{ borderLeftColor: ARCHETYPE_COLORS[a.id], borderLeftWidth: 3 }}>
                <p className="text-sm">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.nameEn}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{a.traits.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Activities */}
        {topActivities.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-500" />
              <span className="text-sm">На что уходит время</span>
            </div>
            <div className="space-y-2">
              {topActivities.map(([id, mins]) => {
                const act = activities.find((a) => a.id === id) || ACTIVITIES.find((a) => a.id === id);
                if (!act) return null;
                const hours = Math.floor(mins / 60);
                const m = mins % 60;
                const maxMins = topActivities[0][1];
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{act.emoji}</span>
                    <span className="text-xs w-20">{act.label}</span>
                    <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(mins / maxMins) * 100}%`, backgroundColor: act.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-12 text-right">
                      {hours > 0 ? `${hours}ч` : ''}{m > 0 ? ` ${m}м` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Virtues */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" />
              <span className="text-sm">Добродетели</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-muted-foreground">В ритуале</span>
              <div
                onClick={() => setShowVirtues(!showVirtues)}
                className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${showVirtues ? 'bg-teal-500' : 'bg-switch-background'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${showVirtues ? 'translate-x-4' : ''}`} />
              </div>
            </label>
          </div>
          {VIRTUES.map((v) => {
            const info = VIRTUE_DESCRIPTIONS[v];
            return (
              <div key={v} className="p-3 rounded-xl bg-accent/30">
                <p className="text-sm">{v}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{info?.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">Пример: {info?.example}</p>
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="text-sm">Настройки</span>
          </div>
          <SettingRow icon={<Smartphone className="w-4 h-4" />} label="Подключить трекер шагов" />
          <SettingRow icon={<MoonIcon className="w-4 h-4" />} label="Подключить трекер сна" />
          <SettingRow icon={<Bell className="w-4 h-4" />} label="Напоминание в 21:00" enabled={remindTime} onToggle={() => setRemindTime(!remindTime)} />
        </div>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, enabled, onToggle }: {
  icon: React.ReactNode;
  label: string;
  enabled?: boolean;
  onToggle?: () => void;
}) {
  const [localEnabled, setLocalEnabled] = useState(enabled ?? false);
  const isOn = enabled !== undefined ? enabled : localEnabled;
  const toggle = onToggle || (() => setLocalEnabled(!localEnabled));

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div
        onClick={toggle}
        className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${isOn ? 'bg-primary' : 'bg-switch-background'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${isOn ? 'translate-x-4' : ''}`} />
      </div>
    </div>
  );
}
