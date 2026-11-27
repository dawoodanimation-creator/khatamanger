import {
  ShoppingBag,
  Zap,
  Wifi,
  Home,
  Car,
  HeartPulse,
  GraduationCap,
  Shirt,
  Sofa,
  Gift,
  HandHeart,
  Users,
  Landmark,
  Store,
  Film,
  Wallet,
  Banknote,
  CircleDot,
} from 'lucide-react';
import type { ExpenseCategoryIcon as IconName } from '../models/expense';

export function ExpenseCategoryIcon({
  name,
  size = 18,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const props = { size, color, 'aria-hidden': true as const };
  switch (name) {
    case 'shopping-bag':
      return <ShoppingBag {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'wifi':
      return <Wifi {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'car':
      return <Car {...props} />;
    case 'heart-pulse':
      return <HeartPulse {...props} />;
    case 'graduation-cap':
      return <GraduationCap {...props} />;
    case 'shirt':
      return <Shirt {...props} />;
    case 'sofa':
      return <Sofa {...props} />;
    case 'gift':
      return <Gift {...props} />;
    case 'hand-heart':
      return <HandHeart {...props} />;
    case 'users':
      return <Users {...props} />;
    case 'landmark':
      return <Landmark {...props} />;
    case 'store':
      return <Store {...props} />;
    case 'film':
      return <Film {...props} />;
    case 'wallet':
      return <Wallet {...props} />;
    case 'banknote':
      return <Banknote {...props} />;
    default:
      return <CircleDot {...props} />;
  }
}
