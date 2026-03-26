import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { DrawerProvider } from '../context/DrawerContext';
import { AppDrawer } from './AppDrawer';

export function Layout() {
  return (
    <DrawerProvider>
      <div className="flex justify-center w-full h-full bg-accent/30">
        <div className="w-full max-w-md bg-background flex flex-col h-full relative shadow-xl">
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
          <AppDrawer />
          <Toaster position="top-center" richColors />
        </div>
      </div>
    </DrawerProvider>
  );
}
