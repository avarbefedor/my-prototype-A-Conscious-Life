import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 px-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                i <= current ? 'bg-primary' : 'bg-accent'
              }`}
            />
            <span
              className={`text-[10px] mt-1 transition-colors ${
                i === current ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
