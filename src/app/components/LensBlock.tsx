import { Lens, LensValue } from '../data/types';
import { RatingSlider } from './RatingSlider';

interface LensBlockProps {
  lens: Lens;
  value?: LensValue;
  onChange?: (value: LensValue) => void;
  /** If true, renders in read-only mode (for detect-type in Step 1) */
  readOnly?: boolean;
}

export function LensBlock({ lens, value, onChange, readOnly = false }: LensBlockProps) {
  if (lens.anchorType === 'detect') {
    const anchorId = value?.type === 'detect' ? value.anchorId : null;
    const anchor = lens.anchors.find((a) => a.id === anchorId);
    return (
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: `${lens.color}10`, borderColor: `${lens.color}30` }}
      >
        <p className="text-xs mb-1" style={{ color: `${lens.color}99` }}>
          {lens.name} — определено автоматически
        </p>
        {anchor ? (
          <div className="flex items-center gap-2">
            {anchor.emoji && <span className="text-xl">{anchor.emoji}</span>}
            <div>
              <p className="text-sm font-medium" style={{ color: lens.color }}>
                Сегодня ты был <span style={{ color: lens.color }}>{anchor.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{anchor.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Недостаточно данных для определения</p>
        )}
      </div>
    );
  }

  if (lens.anchorType === 'select') {
    const selectValue = value?.type === 'select' ? value : { type: 'select' as const, anchorId: null };
    const selectedId = selectValue.anchorId;
    const note = selectValue.note ?? '';

    return (
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{lens.anchors[0]?.emoji ?? '🔮'}</span>
          <span className="text-sm text-muted-foreground">{lens.name}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">необязательно</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {lens.anchors.map((anchor) => (
            <button
              key={anchor.id}
              type="button"
              disabled={readOnly}
              onClick={() =>
                onChange?.({
                  type: 'select',
                  anchorId: selectedId === anchor.id ? null : anchor.id,
                  note,
                })
              }
              className={`px-3 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                selectedId === anchor.id
                  ? 'border-2'
                  : 'bg-background text-muted-foreground border-border hover:border-opacity-50'
              }`}
              style={
                selectedId === anchor.id
                  ? {
                      backgroundColor: `${anchor.color ?? lens.color}15`,
                      color: anchor.color ?? lens.color,
                      borderColor: anchor.color ?? lens.color,
                    }
                  : {}
              }
            >
              {anchor.emoji && <span className="mr-1">{anchor.emoji}</span>}
              {anchor.name}
            </button>
          ))}
        </div>
        {selectedId && !readOnly && (
          <input
            type="text"
            value={note}
            onChange={(e) =>
              onChange?.({ type: 'select', anchorId: selectedId, note: e.target.value })
            }
            placeholder={lens.eveningQuestion.replace('{{anchor}}', '')}
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border-0 text-sm outline-none focus:ring-2"
            style={{ '--tw-ring-color': `${lens.color}40` } as React.CSSProperties}
          />
        )}
        {selectedId && readOnly && (
          <p className="text-xs text-muted-foreground">
            {lens.anchors.find((a) => a.id === selectedId)?.description}
          </p>
        )}
      </div>
    );
  }

  if (lens.anchorType === 'rate') {
    const rateValue = value?.type === 'rate' ? value : { type: 'rate' as const, scores: {} };
    const scores = rateValue.scores ?? {};

    return (
      <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{lens.name}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">0–10 по каждому</span>
        </div>
        {lens.anchors.map((anchor) => (
          <RatingSlider
            key={anchor.id}
            value={scores[anchor.id] ?? 5}
            onChange={(val) =>
              onChange?.({
                type: 'rate',
                scores: { ...scores, [anchor.id]: val },
                note: rateValue.note,
              })
            }
            label={`${anchor.emoji ?? ''} ${anchor.name}`}
            color={anchor.color ?? lens.color}
            showLabels={false}
          />
        ))}
      </div>
    );
  }

  return null;
}
