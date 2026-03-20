import { Outlet, useLocation, useNavigate } from 'react-router';
import { CalendarDays, Lightbulb, User, Activity } from 'lucide-react';
import { Toaster } from 'sonner';

const TABS = [
  { path: '/', icon: Activity, label: 'Сейчас' },
  { path: '/feed', icon: CalendarDays, label: 'Лента' },
  { path: '/insights', icon: Lightbulb, label: 'Инсайты' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on day detail page
  const showNav = !location.pathname.startsWith('/day/') && location.pathname !== '/evening';

  return (
    <div className="flex justify-center w-full h-full bg-accent/30">
      <div className="w-full max-w-md bg-background flex flex-col h-full relative shadow-xl">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>

        {showNav && (
          <nav className="flex border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)]">
            {TABS.map((tab) => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors cursor-pointer ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}