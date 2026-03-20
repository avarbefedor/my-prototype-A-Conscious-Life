import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import type { ActivityType } from '../data/types';
import { EmojiPickerSheet } from './EmojiPickerSheet';
import { ColorPickerPanel } from './ColorPickerPanel';

interface Props {
  open: boolean;
  activity?: ActivityType | null; // null = add mode
  onClose: () => void;
  onSave: (data: { label: string; emoji: string; color: string }) => void;
  onDelete?: () => void;
}

export function ActivityBottomSheet({ open, activity, onClose, onSave, onDelete }: Props) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState('#3b82f6');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (open) {
      if (activity) {
        setLabel(activity.label);
        setEmoji(activity.emoji);
        setColor(activity.color);
      } else {
        setLabel('');
        setEmoji('🎯');
        setColor('#3b82f6');
      }
      setShowEmojiPicker(false);
    }
  }, [open, activity]);

  const isEdit = !!activity;
  const canSave = label.trim().length > 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border max-h-[85vh] overflow-y-auto"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>

              <div className="px-5 pb-8 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground">{isEdit ? 'Редактировать' : 'Новая активность'}</h2>
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent cursor-pointer transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Preview */}
                <div className="flex justify-center">
                  <div
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl w-24"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="text-xs text-center" style={{ color }}>{label || '...'}</span>
                  </div>
                </div>

                {/* Emoji button + Name */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-2 transition-colors text-2xl hover:scale-105"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                  >
                    {emoji}
                  </button>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Название активности..."
                    className="flex-1 text-sm px-4 py-3 rounded-xl bg-accent/50 border-0 outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus={!isEdit}
                  />
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Цвет</p>
                  <ColorPickerPanel color={color} onChange={setColor} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { if (canSave) onSave({ label: label.trim(), emoji, color }); }}
                    disabled={!canSave}
                    className="flex-1 py-3 rounded-xl text-sm text-white cursor-pointer transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: color }}
                  >
                    {isEdit ? 'Сохранить' : 'Добавить'}
                  </button>
                  {isEdit && onDelete && (
                    <button
                      onClick={onDelete}
                      className="px-5 py-3 rounded-xl text-sm text-red-500 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Emoji picker overlay (above the bottom sheet) */}
      <EmojiPickerSheet
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={setEmoji}
        current={emoji}
      />
    </>
  );
}
