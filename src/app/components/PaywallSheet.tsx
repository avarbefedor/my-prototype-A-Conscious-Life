import { useState } from 'react';
import { Drawer } from 'vaul';
import { Lock, Brain, Zap, Layers, X, Check } from 'lucide-react';
import { toast } from 'sonner';

type LayerId = 'patterns' | 'energy' | 'lenses';

const LAYER_INFO: Record<LayerId, {
  name: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}> = {
  patterns: {
    name: 'Паттерны',
    icon: <Brain className="w-6 h-6" />,
    color: '#3b82f6',
    benefits: [
      'Реальные корреляции из твоих данных',
      'Цепочки событий: что вызывает что',
      'Предупреждения о рисковых днях',
    ],
  },
  energy: {
    name: 'Энергия',
    icon: <Zap className="w-6 h-6" />,
    color: '#f97316',
    benefits: [
      'Кривая энергии и хронотип',
      'Recovery Score и пиковые часы',
      'ROI активностей на энергию',
    ],
  },
  lenses: {
    name: 'Линзы',
    icon: <Layers className="w-6 h-6" />,
    color: '#8b5cf6',
    benefits: [
      '5 философских фреймов интерпретации',
      'Вечерний ритуал адаптирован под тебя',
      'Инсайты через твой язык смысла',
    ],
  },
};

interface PaywallSheetProps {
  layerId: LayerId;
  open: boolean;
  onClose: () => void;
}

export function PaywallSheet({ layerId, open, onClose }: PaywallSheetProps) {
  const info = LAYER_INFO[layerId];

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-3xl max-h-[85vh] max-w-[448px] mx-auto">
          <div className="w-12 h-1.5 rounded-full bg-border mx-auto mt-3 mb-1 shrink-0" />

          <div className="px-5 pt-4 pb-8 overflow-y-auto space-y-5">
            {/* Close */}
            <div className="flex items-center justify-between">
              <div />
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${info.color}15`, color: info.color }}
              >
                {info.icon}
              </div>
              <div>
                <h3 className="text-lg">Слой «{info.name}»</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Разблокируй более глубокий взгляд на свои данные
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              {info.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/40">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${info.color}20`, color: info.color }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  toast.success('Скоро! Оплата ещё не подключена 🚧');
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl text-white font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: info.color }}
              >
                <Lock className="w-4 h-4" />
                Подключить слой
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
              >
                Посмотреть все слои
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
