
import { Star } from 'lucide-react';

export type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'badge' | 'frame';
  icon?: React.ComponentType<{ className?: string }>;
};

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'premium-badge',
    name: 'Premium Member Badge',
    description: 'Show your support with a premium badge next to your name.',
    price: 5000,
    type: 'badge',
    icon: Star,
  },
];
