import { EVENT_TAGS } from '../data/types';

interface EventChipsProps {
  selected: string[];
  onChange: (events: string[]) => void;
}

export function EventChips({ selected, onChange }: EventChipsProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((e) => e !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {EVENT_TAGS.map((tag) => {
        const isActive = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm transition-all duration-200 cursor-pointer
              border
              ${isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-accent'
              }
            `}
          >
            <span className="mr-1">{tag.emoji}</span>
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
