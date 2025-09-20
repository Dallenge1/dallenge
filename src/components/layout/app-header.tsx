'use client';

import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/placeholder-data';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';
import UserNav from './user-nav';
import { useAuth } from '../providers/auth-provider';

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  let currentPageLabel = 'DAWION';

  const activeLink = NAV_LINKS.find(link => {
    const href = link.isProfile ? (user ? `/users/${user.uid}` : '/login') : link.href;
    return pathname.startsWith(href) && href !== '/dashboard';
  });

  if (pathname === '/dashboard') {
    currentPageLabel = 'Dashboard';
  } else if (activeLink) {
    currentPageLabel = activeLink.label;
  }
  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold md:text-xl">
          {currentPageLabel}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
