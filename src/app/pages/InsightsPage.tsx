import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Zap, Layers, Menu } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
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
  { id: 'productivity', label: 'Продукт.' },
  { id: 'relations', label: 'Отношения' },
] as const;

const LAYER_FILTERS = [
  { id: 'all', label: 'Все', icon: null },
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

const COVER_SHAPES = ['circles', 'stripes', 'arc', 'circles'] as const;
type ShapeType = typeof COVER_SHAPES[number];

function CoverShape({ type, color, emoji }: { type: ShapeType; color: string; emoji?: string }) {
  const s: React.CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' };
  if (type === 'circles') return (
    <div style={s}>
      <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: `${color}35`, right: -30, bottom: -30 }} />
      <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: `${color}55`, right: -5, bottom: -5 }} />
      {emoji && <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}>{emoji}</div>}
    </div>
  );
  if (type === 'stripes') return (
    <div style={s}>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${color}25 0 12px, transparent 12px 28px)` }} />
      {emoji && <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 36 }}>{emoji}</div>}
    </div>
  );
  return (
    <div style={s}>
      <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `20px solid ${color}45`, right: -80, top: -50 }} />
      {emoji && <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 38 }}>{emoji}</div>}
    </div>
  );
}

export function InsightsPage() {
  const [filter, setFilter] = useState('all');
  const [layerFilter, setLayerFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState<string | null>(null);
  useDevUnlock();

  let filtered = filter === 'all'
    ? mockInsights
    : mockInsights.filter((i) => i.category === filter);

  if (layerFilter !== 'all') {
    filtered = filtered.filter((i) => i.layer === layerFilter);
  }

  const isLocked = (i: Insight) => i.layer !== 'base' && !isLayerUnlocked(i.layer as 'patterns' | 'energy' | 'lenses');
  const lockedCount = mockInsights.filter(isLocked).length;
  const { openDrawer } = useDrawer();

  const hero = filtered.find((i) => !isLocked(i));
  const rest = filtered.filter((i) => i !== hero);
  const lockedInRest = rest.filter(isLocked);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bento-bg)' }}>

      {/* ─── Header ─── */}
      <div className="px-4 pt-5 pb-0 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 12, color: '#78716C', marginBottom: 2 }}>За месяц</p>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: '#1C1917', lineHeight: 1.1 }}>Инсайты</p>
        </div>
        <button
          onClick={openDrawer}
          style={{ width: 38, height: 38, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ─── Category filters (pill style, black = active) ─── */}
      <div className="px-4 pt-3 pb-0 flex gap-1.5 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 100,
              border: 'none',
              background: filter === cat.id ? '#1C1917' : 'white',
              color: filter === cat.id ? 'white' : '#1C1917',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Layer filters ─── */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {LAYER_FILTERS.map((lf) => {
          const Icon = lf.icon;
          const isActive = layerFilter === lf.id;
          const color = 'color' in lf ? lf.color : '#6b7280';
          return (
            <button
              key={lf.id}
              onClick={() => setLayerFilter(lf.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                background: isActive && lf.id !== 'all' ? `${color}15` : isActive ? 'white' : 'transparent',
                color: isActive && lf.id !== 'all' ? color : '#78716C',
                outline: isActive ? `1.5px solid ${isActive && lf.id !== 'all' ? color : '#78716C'}` : 'none',
              }}
            >
              {Icon && <Icon style={{ width: 12, height: 12 }} />}
              {lf.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">

        {/* ─── Hero insight tile ─── */}
        {hero && !isLocked(hero) && (
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ height: 140, background: `${CATEGORY_COLORS[hero.category] || '#6b7280'}15`, position: 'relative', overflow: 'hidden' }}>
              <CoverShape type="circles" color={CATEGORY_COLORS[hero.category] || '#6b7280'} emoji={hero.emoji} />
              <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 10, padding: '4px 10px', borderRadius: 100, background: '#1C1917', color: 'white', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {LAYER_LABELS[hero.layer]}
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 10, color: '#1C1917', opacity: 0.6, fontWeight: 500 }}>
                {hero.observationCount} наблюдений · {Math.round(hero.strength * 100)}%
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#1C1917', lineHeight: 1.3, marginBottom: 6, fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic' }}>
                {hero.title}
              </p>
              <p style={{ fontSize: 13, color: '#78716C', marginBottom: 12, lineHeight: 1.5 }}>{hero.description}</p>
              <div style={{ height: 120, borderRadius: 12, overflow: 'hidden', background: `${CATEGORY_COLORS[hero.category] || '#6b7280'}08`, padding: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {hero.chartData[0]?.value2 !== undefined ? (
                    <BarChart data={hero.chartData} barGap={2}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value1" fill={CATEGORY_COLORS[hero.category] || '#6b7280'} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="value2" fill={`${CATEGORY_COLORS[hero.category] || '#6b7280'}55`} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={hero.chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value1" fill={CATEGORY_COLORS[hero.category] || '#6b7280'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              {hero.advice && (
                <button
                  onClick={() => setShowAdvice(showAdvice === hero.id ? null : hero.id)}
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: CATEGORY_COLORS[hero.category] || '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 10, width: '100%' }}
                >
                  💡 Что с этим делать?
                  {showAdvice === hero.id ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto' }} /> : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
                </button>
              )}
              <AnimatePresence>
                {showAdvice === hero.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div style={{ padding: '12px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: `${CATEGORY_COLORS[hero.category] || '#6b7280'}10`, color: CATEGORY_COLORS[hero.category] || '#6b7280' }}>
                      {hero.advice}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ─── Locked banner ─── */}
        {lockedCount > 0 && (
          <div style={{ background: '#1C1917', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#C2692A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{lockedCount} инсайта ждут</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Открой слои Паттерны, Энергия и Линзы</div>
            </div>
            <span style={{ color: '#C2692A', fontSize: 20, fontWeight: 700 }}>›</span>
          </div>
        )}

        {/* ─── 2-col grid for rest ─── */}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {rest.map((insight, i) => {
              const locked = isLocked(insight);
              const color = CATEGORY_COLORS[insight.category] || '#6b7280';
              const shape = COVER_SHAPES[i % COVER_SHAPES.length];
              return (
                <div
                  key={insight.id}
                  style={{ background: 'white', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 170, cursor: locked ? 'default' : 'pointer' }}
                  onClick={() => !locked && setExpandedId(expandedId === insight.id ? null : insight.id)}
                >
                  <div style={{ height: 78, background: `${color}12`, position: 'relative', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
                    <CoverShape type={shape} color={color} emoji={insight.emoji} />
                    {locked && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1917', lineHeight: 1.25, filter: locked ? 'blur(2px)' : 'none' }}>
                      {insight.title}
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${LAYER_COLORS[insight.layer] || color}18`, color: LAYER_COLORS[insight.layer] || color, fontWeight: 600 }}>
                        {LAYER_LABELS[insight.layer]}
                      </span>
                      <span style={{ fontSize: 10, color: '#78716C', marginLeft: 'auto' }}>{Math.round(insight.strength * 100)}%</span>
                    </div>
                  </div>
                  {/* Expanded detail inline */}
                  <AnimatePresence>
                    {expandedId === insight.id && !locked && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${color}15` }}>
                          <p style={{ fontSize: 11, color: '#78716C', lineHeight: 1.4, marginBottom: 8 }}>{insight.description}</p>
                          {insight.advice && (
                            <div style={{ padding: '8px 10px', borderRadius: 10, fontSize: 11, lineHeight: 1.4, background: `${color}10`, color }}>
                              💡 {insight.advice}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Пока нет инсайтов в этой категории</p>
          </div>
        )}

      </div>
    </div>
  );
}
