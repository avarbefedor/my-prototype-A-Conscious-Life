import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  current?: string;
}

export function EmojiPickerSheet({ open, onClose, onSelect, current }: Props) {
  const handleSelect = useCallback((emojiData: any) => {
    onSelect(emojiData.native);
    onClose();
  }, [onSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-2xl border-t border-border"
            style={{ maxHeight: '55vh' }}
          >
            {/* Handle + header */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-1 bg-border rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-2">
                {current && <span className="text-xl">{current}</span>}
                <span className="text-sm text-muted-foreground">Выберите эмодзи</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Emoji Mart picker */}
            <div className="emoji-picker-container overflow-hidden">
              <Picker
                data={data}
                onEmojiSelect={handleSelect}
                locale="ru"
                theme="light"
                previewPosition="none"
                skinTonePosition="search"
                perLine={8}
                maxFrequentRows={2}
                navPosition="bottom"
                searchPosition="sticky"
                set="native"
                dynamicWidth={true}
                emojiSize={28}
                emojiButtonSize={38}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
