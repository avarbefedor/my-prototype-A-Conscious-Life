interface SegmentedControlProps {
  value: string | null;
  onChange: (val: string | null) => void;
  options: { value: string; label: string; color?: string }[];
  label: string;
  icon?: React.ReactNode;
  nullable?: boolean;
}

export function SegmentedControl({ value, onChange, options, label, icon, nullable = true }: SegmentedControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex gap-1 bg-accent/50 rounded-lg p-1">
        {nullable && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all cursor-pointer ${
              value === null
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Нет
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all cursor-pointer ${
              value === opt.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
