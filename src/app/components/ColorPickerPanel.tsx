import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#78716c', '#94a3b8', '#d946ef', '#e879f9',
];

interface Props {
  color: string;
  onChange: (color: string) => void;
  compact?: boolean;
}

export function ColorPickerPanel({ color, onChange, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external color changes to local
  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  // Debounce: propagate local color to parent
  useEffect(() => {
    if (localColor === color) return;
    const t = setTimeout(() => onChangeRef.current(localColor), 50);
    return () => clearTimeout(t);
  }, [localColor, color]);

  return (
    <div className="space-y-2.5">
      {/* Presets row */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { setLocalColor(c); onChange(c); }}
            className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0"
            style={{
              backgroundColor: c,
              boxShadow: color === c
                ? `0 0 0 2.5px white, 0 0 0 4.5px ${c}`
                : 'none',
              transform: color === c ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}

        {/* Custom color preview */}
        {!PRESET_COLORS.includes(color) && (
          <div
            className="w-7 h-7 rounded-full shrink-0"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 0 2.5px white, 0 0 0 4.5px ${color}`,
              transform: 'scale(1.15)',
            }}
          />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Скрыть палитру' : 'Свой цвет'}
      </button>

      {/* Full color picker */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              <div className="color-picker-wrapper">
                <HexColorPicker
                  color={localColor}
                  onChange={setLocalColor}
                  style={{ width: '100%', height: 160 }}
                />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 border border-border"
                  style={{ backgroundColor: localColor }}
                />
                <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg bg-accent/50">
                  <span className="text-xs text-muted-foreground">#</span>
                  <HexColorInput
                    color={localColor}
                    onChange={setLocalColor}
                    className="flex-1 text-sm bg-transparent border-0 outline-none uppercase tracking-wider"
                    prefixed={false}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
