
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NAV_LINKS } from '@/lib/placeholder-data';
import { useAuth } from '../providers/auth-provider';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { cn } from '@/lib/utils';

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const hasUnreadMessages = useUnreadMessages();

  return (
    <SidebarMenu>
      {NAV_LINKS.map((link) => {
        const href = link.isProfile ? (user ? `/users/${user.uid}` : '/login') : link.href;
        
        const isActive =
          link.href === '/dashboard'
            ? pathname === href
            : pathname.startsWith(href) && href !== '/dashboard';
        
        if(link.isProfile && !user) return null;

        const isMessagesLink = link.href === '/chat';

        return (
          <SidebarMenuItem key={link.label}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={link.label}
              className="relative"
            >
              <Link href={href}>
                <link.icon />
                <span>{link.label}</span>
                 {isMessagesLink && hasUnreadMessages && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-destructive group-data-[collapsible=icon]:right-1.5" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
