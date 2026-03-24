import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, HelpCircle, Brain, Zap, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { mockInsights } from '../data/mockData';
import { Insight } from '../data/types';
import { isLayerUnlocked, useDevUnlock } from '../data/store';
import { LockedInsight } from '../components/LockedInsight';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'sleep', label: 'Сон' },
  { id: 'body', label: 'Тело' },
  { id: 'psyche', label: 'Психика' },
  { id: 'productivity', label: 'Продуктивность' },
  { id: 'relations', label: 'Отношения' },
] as const;

const LAYER_FILTERS = [
  { id: 'all', label: 'Все', icon: null, color: '#6b7280' },
  { id: 'patterns', label: 'Паттерны', icon: Brain, color: '#3b82f6' },
  { id: 'energy', label: 'Энергия', icon: Zap, color: '#f97316' },
  { id: 'lenses', label: 'Линзы', icon: Layers, color: '#8b5cf6' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  sleep: '#6366f1',
  body: '#10b981',
  psyche: '#a855f7',
  productivity: '#3b82f6',
  relations: '#f43f5e',
};

const LAYER_COLORS: Record<string, string> = {
  base: '#6b7280',
  patterns: '#3b82f6',
  energy: '#f97316',
  lenses: '#8b5cf6',
};

const LAYER_LABELS: Record<string, string> = {
  base: 'База',
  patterns: 'Паттерны',
  energy: 'Энергия',
  lenses: 'Линзы',
};

export function InsightsPage() {
  const [filter, setFilter] = useState('all');
  const [layerFilter, setLayerFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState<string | null>(null);
  useDevUnlock(); // subscribe to layer unlock changes

  let filtered = filter === 'all'
    ? mockInsights
    : mockInsights.filter((i) => i.category === filter);

  if (layerFilter !== 'all') {
    filtered = filtered.filter((i) => i.layer === layerFilter);
  }

  const isLocked = (i: Insight) => i.layer !== 'base' && !isLayerUnlocked(i.layer as 'patterns' | 'energy' | 'lenses');
  const lockedCount = mockInsights.filter(isLocked).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-1">
        <h1 className="text-foreground">Инсайты</h1>
        <p className="text-sm text-muted-foreground mt-1">Что система заметила за последний месяц</p>
        {lockedCount > 0 && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 text-xs text-violet-600">
            🔒 {lockedCount} инсайта ждут тебя в платных слоях
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all cursor-pointer border ${
              filter === cat.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Layer Filters */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {LAYER_FILTERS.map((lf) => {
          const Icon = lf.icon;
          const isActive = layerFilter === lf.id;
          return (
            <button
              key={lf.id}
              onClick={() => setLayerFilter(lf.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'border-current'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/30'
              }`}
              style={isActive && lf.id !== 'all'
                ? { color: lf.color, borderColor: lf.color, backgroundColor: `${lf.color}10` }
                : undefined
              }
            >
              {Icon && <Icon className="w-3 h-3" />}
              {lf.label}
            </button>
          );
        })}
      </div>

      {/* Insights list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {filtered.map((insight) =>
          isLocked(insight) ? (
            <LockedInsight key={insight.id} insight={insight} />
          ) : (
            <InsightCard
              key={insight.id}
              insight={insight}
              isExpanded={expandedId === insight.id}
              onToggle={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
              showAdvice={showAdvice === insight.id}
              onToggleAdvice={() => setShowAdvice(showAdvice === insight.id ? null : insight.id)}
            />
          )
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Пока нет инсайтов в этой категории</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight, isExpanded, onToggle, showAdvice, onToggleAdvice }: {
  insight: Insight;
  isExpanded: boolean;
  onToggle: () => void;
  showAdvice: boolean;
  onToggleAdvice: () => void;
}) {
  const color = CATEGORY_COLORS[insight.category] || '#6b7280';
  const layerColor = LAYER_COLORS[insight.layer] ?? color;
  const layerLabel = LAYER_LABELS[insight.layer];

  return (
    <div
      className="bg-card rounded-2xl border border-border overflow-hidden"
      style={{ borderLeftColor: layerColor, borderLeftWidth: 3 }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 text-left cursor-pointer flex items-start gap-3"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}15` }}
        >
          <TrendingUp className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{insight.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
          {/* Layer badge + strength */}
          <div className="flex items-center gap-2 mt-2">
            {layerLabel && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: `${layerColor}15`, color: layerColor }}
              >
                {layerLabel}
              </span>
            )}
            {insight.observationCount && (
              <span className="text-[10px] text-muted-foreground">{insight.observationCount} дн.</span>
            )}
            <div className="h-1.5 flex-1 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${insight.strength * 100}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round(insight.strength * 100)}%</span>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="bg-accent/30 rounded-xl p-3" style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {insight.chartData[0]?.value2 !== undefined ? (
                    <BarChart data={insight.chartData} barGap={2}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value1" fill={color} radius={[4, 4, 0, 0]} name="Настроение" />
                      <Bar dataKey="value2" fill={`${color}50`} radius={[4, 4, 0, 0]} name="Энергия" />
                    </BarChart>
                  ) : (
                    <BarChart data={insight.chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value1" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleAdvice(); }}
                className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-xl hover:bg-accent/50 transition-colors"
                style={{ color }}
              >
                <HelpCircle className="w-4 h-4" />
                Что с этим делать?
              </button>

              <AnimatePresence>
                {showAdvice && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-3 rounded-xl text-sm"
                      style={{ backgroundColor: `${color}10`, color }}
                    >
                      {insight.advice}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
