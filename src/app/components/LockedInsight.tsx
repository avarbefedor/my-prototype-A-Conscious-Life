import { useState } from 'react';
import { Lock, Brain, Zap, Layers } from 'lucide-react';
import { Insight } from '../data/types';
import { PaywallSheet } from './PaywallSheet';

const LAYER_COLORS: Record<string, string> = {
  patterns: '#3b82f6',
  energy: '#f97316',
  lenses: '#8b5cf6',
};

const LAYER_NAMES: Record<string, string> = {
  patterns: 'Паттерны',
  energy: 'Энергия',
  lenses: 'Линзы',
};

const LAYER_ICONS: Record<string, React.ReactNode> = {
  patterns: <Brain className="w-4 h-4" />,
  energy: <Zap className="w-4 h-4" />,
  lenses: <Layers className="w-4 h-4" />,
};

interface LockedInsightProps {
  insight: Insight;
}

export function LockedInsight({ insight }: LockedInsightProps) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const layer = insight.layer as 'patterns' | 'energy' | 'lenses';
  const color = LAYER_COLORS[layer] ?? '#6b7280';
  const name = LAYER_NAMES[layer] ?? layer;

  return (
    <>
      <div className="relative rounded-2xl border border-border overflow-hidden">
        {/* Blurred content */}
        <div
          className="p-4 space-y-2 select-none"
          style={{ filter: 'blur(4px)', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl shrink-0"
              style={{ backgroundColor: `${color}15` }}
            />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-accent rounded-lg w-3/4" />
              <div className="h-3 bg-accent/70 rounded-lg w-full" />
              <div className="h-3 bg-accent/70 rounded-lg w-2/3" />
            </div>
          </div>
          <div className="h-20 bg-accent/40 rounded-xl" />
        </div>

        {/* Lock overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setPaywallOpen(true)}
          style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="rounded-2xl border px-4 py-3 flex items-center gap-3 bg-white shadow-md"
            style={{ borderColor: `${color}30` }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {LAYER_ICONS[layer] ?? <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Слой</p>
              <p className="text-sm font-medium" style={{ color }}>«{name}»</p>
            </div>
            <div
              className="ml-2 px-2.5 py-1 rounded-lg text-xs text-white cursor-pointer"
              style={{ backgroundColor: color }}
            >
              Открыть →
            </div>
          </div>
        </div>
      </div>

      <PaywallSheet
        layerId={layer}
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  );
}
