import { useLocation, useNavigate } from 'react-router';
import { Activity, CalendarDays, Lightbulb, User, Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrawer } from '../context/DrawerContext';
import { getStreak } from '../data/store';

const NAV_ITEMS = [
  { path: '/', icon: Activity, label: 'Сейчас' },
  { path: '/feed', icon: CalendarDays, label: 'Лента' },
  { path: '/insights', icon: Lightbulb, label: 'Инсайты' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export function AppDrawer() {
  const { open, closeDrawer } = useDrawer();
  const navigate = useNavigate();
  const location = useLocation();
  const streak = getStreak();

  const handleNav = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <motion.div
            key="panel"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 flex flex-col shadow-2xl"
            style={{ maxWidth: '80vw' }}
          >
            {/* Header */}
            <div className="px-5 pt-8 pb-6 flex items-center justify-between border-b border-border">
              <div>
                <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-0.5">Осознанная</p>
                <p className="text-lg font-medium text-foreground" style={{ fontFamily: 'var(--font-display)' }}>жизнь</p>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-accent cursor-pointer text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all text-left ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            {streak > 0 && (
              <div className="px-5 pb-8 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Не прерывай серию</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
