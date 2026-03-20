import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { X as XIcon, Plus } from 'lucide-react';
import type { ActivityType } from '../data/types';

const DRAG_THRESHOLD = 8;
const COLS = 4;

interface Props {
  activities: ActivityType[];
  activeActivities: string[];
  editMode: boolean;
  onToggle: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
  onEdit: (act: ActivityType) => void;
  onAdd: () => void;
}

export function DraggableActivityGrid({
  activities, activeActivities, editMode, onToggle, onReorder, onDelete, onEdit, onAdd,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragItemRef = useRef<number | null>(null);
  const cellPositions = useRef<DOMRect[]>([]);

  // Cache cell positions
  const cacheCells = useCallback(() => {
    if (!gridRef.current) return;
    const cells = gridRef.current.querySelectorAll('[data-grid-cell]');
    cellPositions.current = Array.from(cells).map(el => el.getBoundingClientRect());
  }, []);

  const findCellAtPoint = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < cellPositions.current.length; i++) {
      const r = cellPositions.current[i];
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    if (!editMode) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;
    dragItemRef.current = index;
  }, [editMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!editMode || pointerStart.current === null || dragItemRef.current === null) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (!isDragging.current) {
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        isDragging.current = true;
        cacheCells();
        setDragIndex(dragItemRef.current);
        setOverIndex(dragItemRef.current);
        // Capture pointer for smooth tracking
        (e.target as HTMLElement).closest('[data-grid-cell]')?.setPointerCapture?.(e.pointerId);
      }
      return;
    }

    e.preventDefault();
    const target = findCellAtPoint(e.clientX, e.clientY);
    if (target !== null && target < activities.length && target !== overIndex) {
      setOverIndex(target);
      try { navigator.vibrate?.(10); } catch (_) {}
    }
  }, [editMode, activities.length, overIndex, cacheCells, findCellAtPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (editMode && !isDragging.current && dragItemRef.current !== null && dragItemRef.current < activities.length) {
      // It was a tap, not a drag — open editor
      onEdit(activities[dragItemRef.current]);
    }

    if (isDragging.current && dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorder(dragIndex, overIndex);
    }

    pointerStart.current = null;
    isDragging.current = false;
    dragItemRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, [editMode, activities, dragIndex, overIndex, onReorder, onEdit]);

  // Compute display order (preview reorder while dragging)
  const displayOrder = (() => {
    const order = activities.map((_, i) => i);
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const item = order.splice(dragIndex, 1)[0];
      order.splice(overIndex, 0, item);
    }
    return order;
  })();

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-4 gap-2"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: editMode ? 'none' : 'auto' }}
    >
      {displayOrder.map((origIdx) => {
        const act = activities[origIdx];
        const isActive = activeActivities.includes(act.id);
        const isBeingDragged = dragIndex === origIdx && isDragging.current;

        return (
          <div
            key={act.id}
            data-grid-cell
            onPointerDown={(e) => handlePointerDown(e, origIdx)}
            onClick={() => { if (!editMode) onToggle(act.id); }}
            className="relative select-none"
            style={{ zIndex: isBeingDragged ? 50 : 1 }}
          >
            <motion.div
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer relative overflow-hidden ${editMode ? 'jiggle' : ''}`}
              style={{
                backgroundColor: isActive && !editMode ? act.color : `${act.color}12`,
                boxShadow: isBeingDragged
                  ? `0 8px 24px ${act.color}50`
                  : isActive && !editMode
                    ? `0 4px 12px ${act.color}40`
                    : 'none',
                transform: isActive && !editMode ? 'scale(1.05)' : isBeingDragged ? 'scale(1.12)' : 'scale(1)',
                opacity: isBeingDragged ? 0.9 : 1,
                transition: isDragging.current ? 'none' : 'all 200ms ease',
              }}
              layout={!isDragging.current}
              layoutId={editMode ? act.id : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <span className="text-xl relative z-10">{act.emoji}</span>
              <span
                className="text-[10px] leading-tight text-center relative z-10"
                style={{ color: isActive && !editMode ? 'white' : act.color }}
              >
                {act.label}
              </span>
            </motion.div>

            {/* Delete badge */}
            {editMode && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(act.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer z-20 shadow-sm hover:bg-red-600 transition-colors"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add card */}
      {editMode && (
        <div data-grid-cell>
          <button
            onClick={onAdd}
            className="w-full flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-2 border-dashed border-border hover:border-primary/30 hover:bg-accent/30 transition-colors"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Добавить</span>
          </button>
        </div>
      )}
    </div>
  );
}
