
'use client';

import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/placeholder-data';
import { SidebarTrigger } from '../ui/sidebar';
import UserNav from './user-nav';
import { useAuth } from '../providers/auth-provider';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <UserNav />
      </div>
    </header>
  );
}
