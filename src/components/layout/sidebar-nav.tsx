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

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <SidebarMenu>
      {NAV_LINKS.map((link) => {
        const href = link.isProfile ? (user ? `/users/${user.uid}` : '/login') : link.href;
        
        const isActive =
          link.href === '/dashboard'
            ? pathname === href
            : pathname.startsWith(href) && href !== '/dashboard';
        
        if(link.isProfile && !user) return null;

        return (
          <SidebarMenuItem key={link.label}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={link.label}
            >
              <Link href={href}>
                <link.icon />
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
