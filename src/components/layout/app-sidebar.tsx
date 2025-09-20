import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import SidebarNav from './sidebar-nav';

export default function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex w-full items-center gap-2 p-2">
          <Image
            src="/dallenge.jpeg"
            alt="Dallenge Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md"
          />
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            Dallenge
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
    </Sidebar>
  );
}
