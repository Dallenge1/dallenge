
'use client';

import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/placeholder-data';
import { SidebarTrigger } from '../ui/sidebar';
import UserNav from './user-nav';
import { useAuth } from '../providers/auth-provider';

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  let currentPageLabel = 'Dallenge';

  const activeLink = NAV_LINKS.find(link => {
    // Special handling for profile link
    if (link.isProfile) {
        // Match /users/[any_id]
        return pathname.startsWith('/users/');
    }
    return pathname.startsWith(link.href) && link.href !== '/dashboard';
  });

  if (pathname === '/dashboard') {
    currentPageLabel = 'Dashboard';
  } else if (activeLink) {
    currentPageLabel = activeLink.label;
     if (activeLink.isProfile && pathname !== `/users/${user?.uid}`) {
        currentPageLabel = "User Profile";
    }
    if (activeLink.href === '/users/all' && pathname.startsWith('/users/') && pathname !== '/users/all') {
         currentPageLabel = "User Profile";
    }
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
        <UserNav />
      </div>
    </header>
  );
}
