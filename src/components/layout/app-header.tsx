'use client';

import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/placeholder-data';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';
import UserNav from './user-nav';

export default function AppHeader() {
  const pathname = usePathname();
  let currentPageLabel = 'DAWION';

  const activeLink = NAV_LINKS.find(link => pathname.startsWith(link.href) && link.href !== '/dashboard');
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
