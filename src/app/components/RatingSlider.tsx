import { useState } from 'react';
import { MOOD_LABELS } from '../data/types';

interface RatingSliderProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  icon?: React.ReactNode;
  showLabels?: boolean;
  color?: string;
}

const COLORS: Record<number, string> = {
  0: '#ef4444',
  1: '#ef4444',
  2: '#f97316',
  3: '#f97316',
  4: '#eab308',
  5: '#eab308',
  6: '#84cc16',
  7: '#22c55e',
  8: '#22c55e',
  9: '#10b981',
  10: '#059669',
};

export function RatingSlider({ value, onChange, label, icon, showLabels = true, color }: RatingSliderProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const displayValue = hoveredValue !== null ? hoveredValue : value;
  const activeColor = color || COLORS[displayValue] || '#6b7280';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ color: activeColor }}>{displayValue}</span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoveredValue(i)}
            onMouseLeave={() => setHoveredValue(null)}
            onClick={() => onChange(i)}
            className="flex-1 rounded-md transition-all duration-150 cursor-pointer"
            style={{
              height: `${12 + i * 2}px`,
              backgroundColor: i <= displayValue ? (color || COLORS[i]) : '#e5e7eb',
              opacity: i <= displayValue ? 1 : 0.4,
              transform: hoveredValue === i ? 'scaleY(1.3)' : 'scaleY(1)',
            }}
          />
        ))}
      </div>

      {showLabels && (
        <p className="text-xs text-muted-foreground text-center">
          {MOOD_LABELS[displayValue] || ''}
        </p>
      )}
    </div>
  );
}
