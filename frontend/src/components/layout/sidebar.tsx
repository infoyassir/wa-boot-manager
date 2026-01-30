'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Users,
  Calendar,
  Zap,
  FileText,
  Settings,
  Smartphone,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: Smartphone },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Auto-Réponses', href: '/auto-responders', icon: Zap },
  { name: 'Messages Planifiés', href: '/scheduled', icon: Calendar },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sessions, activeSessionId } = useAppStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Smartphone className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg">WA Bot Manager</h1>
              <p className="text-xs text-muted-foreground">whatsapp-web.js</p>
            </div>
          </div>

          {/* Active session indicator */}
          {activeSession && (
            <div className="mx-4 mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Session active</p>
              <p className="font-medium truncate">
                {activeSession.info?.pushname || activeSession.id.slice(0, 12)}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeSession.info?.phone || 'Non connecté'}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  sessions.some((s) => s.status === 'connected')
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                )}
              />
              <span>
                {sessions.filter((s) => s.status === 'connected').length} session(s) connectée(s)
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
