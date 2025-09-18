'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NAV_LINKS } from '@/lib/placeholder-data';

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {NAV_LINKS.map((link) => {
        const isActive =
          link.href === '/dashboard'
            ? pathname === link.href
            : pathname.startsWith(link.href);

        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={link.label}
            >
              <Link href={link.href}>
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
