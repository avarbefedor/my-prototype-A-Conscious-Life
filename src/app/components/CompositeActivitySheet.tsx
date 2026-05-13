import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, CheckCircle2, Archive } from 'lucide-react';
import type { ActivityType, ActivityVariant, ProgressObject } from '../data/types';
import { useObjects } from '../data/store';

interface Props {
  open: boolean;
  activity: ActivityType | null;
  onClose: () => void;
  onSelect: (opts: { variantId?: string; objectId?: string }) => void;
}

export function CompositeActivitySheet({ open, activity, onClose, onSelect }: Props) {
  const { getObjectsFor, addObject, updateObject } = useObjects();
  const [showCompleted, setShowCompleted] = useState(false);
  const [addingObject, setAddingObject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariantLabel, setNewVariantLabel] = useState('');

  useEffect(() => {
    if (open) {
      setShowCompleted(false);
      setAddingObject(false);
      setNewTitle('');
      setNewTotal('');
      setAddingVariant(false);
      setNewVariantLabel('');
    }
  }, [open]);

  const composite = activity?.composite;
  const isVariants = composite?.kind === 'variants';
  const isObjects = composite?.kind === 'objects';

  const objects = useMemo(() => {
    if (!isObjects || !activity) return { active: [] as ProgressObject[], done: [] as ProgressObject[] };
    return {
      active: getObjectsFor(activity.id, 'active'),
      done: getObjectsFor(activity.id, 'completed'),
    };
  }, [isObjects, activity, getObjectsFor]);

  const handleVariantPick = (variant: ActivityVariant) => {
    onSelect({ variantId: variant.id });
    onClose();
  };

  const handleObjectPick = (obj: ProgressObject) => {
    onSelect({ objectId: obj.id });
    onClose();
  };

  const handleAddObject = () => {
    if (!activity || !newTitle.trim()) return;
    const total = Number(newTotal);
    const created = addObject({
      activityTypeId: activity.id,
      title: newTitle.trim(),
      emoji: composite?.objectKind === 'show' ? '🎬' : composite?.objectKind === 'project' ? '🗂️' : '📖',
      total: Number.isFinite(total) && total > 0 ? total : undefined,
      unit: composite?.unitLabel,
    });
    onSelect({ objectId: created.id });
    onClose();
  };

  const handleAddVariant = () => {
    if (!newVariantLabel.trim()) return;
    // Variants are stored on the activity template — but we don't expose a mutator here.
    // Simpler MVP: just start the activity with a synthetic comment-style variant id.
    const id = newVariantLabel.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 24);
    onSelect({ variantId: id });
    onClose();
  };

  const completeObject = (obj: ProgressObject) => {
    updateObject(obj.id, { status: 'completed' });
  };

  if (!activity || !composite) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: 'var(--color-bento-bg)', maxHeight: '85vh' }}
          >
            <div style={{ padding: '8px 0 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
            </div>

            <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{activity.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isVariants ? 'Какой тип' : composite.objectKindLabel ?? 'Объект'}
                </div>
                <div style={{ fontSize: 20, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 600, color: '#1C1917', lineHeight: 1.1 }}>
                  {activity.label}
                </div>
              </div>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16, color: '#1C1917' }} />
              </button>
            </div>

            <div style={{ padding: '12px 16px 24px', overflowY: 'auto', maxHeight: 'calc(85vh - 92px)' }}>
              {/* Variants */}
              {isVariants && composite.variants && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {composite.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVariantPick(v)}
                      style={{
                        background: '#FFFFFF', border: 'none', borderRadius: 18, padding: 14, minHeight: 96,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        gap: 6, position: 'relative', overflow: 'hidden', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{v.emoji ?? activity.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{v.label}</span>
                      <div style={{ position: 'absolute', right: -20, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: (v.color ?? activity.color) + '20' }} />
                    </button>
                  ))}

                  {!addingVariant ? (
                    <button
                      onClick={() => setAddingVariant(true)}
                      style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 18, padding: 14, minHeight: 96, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#78716C' }}
                    >
                      <Plus style={{ width: 18, height: 18 }} />
                      <span style={{ fontSize: 12 }}>Добавить</span>
                    </button>
                  ) : (
                    <div style={{ gridColumn: 'span 2', background: '#FFFFFF', borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        autoFocus
                        value={newVariantLabel}
                        onChange={(e) => setNewVariantLabel(e.target.value)}
                        placeholder="Например, кроссфит"
                        style={{ background: 'var(--color-bento-bg)', border: 'none', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setAddingVariant(false)} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 13, color: '#78716C' }}>Отмена</button>
                        <button onClick={handleAddVariant} disabled={!newVariantLabel.trim()} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: newVariantLabel.trim() ? '#1C1917' : 'rgba(0,0,0,0.15)', border: 'none', cursor: newVariantLabel.trim() ? 'pointer' : 'default', color: 'white', fontSize: 13, fontWeight: 600 }}>Начать</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Objects */}
              {isObjects && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {objects.active.length === 0 && !addingObject && (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#78716C', fontSize: 13 }}>
                      Пока ничего нет. Добавь первую {composite.objectKindLabel?.toLowerCase() ?? 'запись'}.
                    </div>
                  )}

                  {objects.active.map((obj) => {
                    const pct = obj.total && obj.current ? Math.min(100, Math.round((obj.current / obj.total) * 100)) : null;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => handleObjectPick(obj)}
                        style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: activity.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                          {obj.emoji ?? '📖'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obj.title}</div>
                          {obj.total && obj.current !== undefined ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#78716C' }}>
                                  {obj.current}/{obj.total} {obj.unit ?? ''}
                                </span>
                                {pct !== null && <span style={{ fontSize: 11, color: activity.color, fontWeight: 600 }}>{pct}%</span>}
                              </div>
                              {pct !== null && (
                                <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: activity.color, borderRadius: 2 }} />
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: 11, color: '#78716C', marginTop: 2 }}>В процессе</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); completeObject(obj); }}
                          aria-label="Завершить"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716C' }}
                        >
                          <CheckCircle2 style={{ width: 18, height: 18 }} />
                        </button>
                      </div>
                    );
                  })}

                  {!addingObject ? (
                    <button
                      onClick={() => setAddingObject(true)}
                      style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 16, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#78716C', fontSize: 13 }}
                    >
                      <Plus style={{ width: 16, height: 16 }} />
                      Новая {composite.objectKindLabel?.toLowerCase() ?? 'запись'}
                    </button>
                  ) : (
                    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={composite.objectKind === 'show' ? 'Severance' : composite.objectKind === 'project' ? 'Название проекта' : 'Дюна'}
                        style={{ background: 'var(--color-bento-bg)', border: 'none', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newTotal}
                        onChange={(e) => setNewTotal(e.target.value)}
                        placeholder={`Всего ${composite.unitLabel ?? '—'} (необязательно)`}
                        style={{ background: 'var(--color-bento-bg)', border: 'none', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setAddingObject(false)} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 13, color: '#78716C' }}>Отмена</button>
                        <button
                          onClick={handleAddObject}
                          disabled={!newTitle.trim()}
                          style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: newTitle.trim() ? '#1C1917' : 'rgba(0,0,0,0.15)', border: 'none', cursor: newTitle.trim() ? 'pointer' : 'default', color: 'white', fontSize: 13, fontWeight: 600 }}
                        >
                          Создать и начать
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick action: start without object */}
                  <button
                    onClick={() => { onSelect({}); onClose(); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 0', fontSize: 13, color: '#78716C', textAlign: 'center' }}
                  >
                    Начать без привязки
                  </button>

                  {/* Completed (collapsible) */}
                  {objects.done.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => setShowCompleted((s) => !s)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px', color: '#78716C', fontSize: 12 }}
                      >
                        <Archive style={{ width: 14, height: 14 }} />
                        Завершено · {objects.done.length}
                        <span style={{ marginLeft: 'auto', fontSize: 11 }}>{showCompleted ? '−' : '+'}</span>
                      </button>
                      {showCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          {objects.done.map((obj) => (
                            <div key={obj.id} style={{ padding: '8px 12px', fontSize: 13, color: '#78716C', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{obj.emoji ?? '📖'}</span>
                              <span style={{ flex: 1, textDecoration: 'line-through' }}>{obj.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
