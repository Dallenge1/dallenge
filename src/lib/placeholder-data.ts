import {
  LayoutDashboard,
  Users,
  User,
  Trophy,
  MessageCircle,
  Settings,
} from 'lucide-react';

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: "Get an overview of your activity." },
  { href: '/feed', label: 'Social Feed', icon: Users, description: "Connect with the community." },
  { href: '/chat', label: 'Messages', icon: MessageCircle, description: 'Chat with other users.'},
  { href: '/users/all', label: 'All Users', icon: Users, description: "Browse all users in the community."},
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: "See who's at the top." },
  { href: '/profile', label: 'Profile', icon: User, description: 'View your public profile.', isProfile: true },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Manage your account settings.'},
];
