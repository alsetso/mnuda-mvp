import {
  HomeIcon,
  MapIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category?: string;
}

export const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    description: 'Connect with real estate professionals and discover development opportunities',
    category: 'Main',
  },
  {
    name: 'Map',
    href: '/map',
    icon: MapIcon,
    description: 'Interactive map of Minnesota showing development opportunities and property acquisitions',
    category: 'Map',
  },
  {
    name: 'Credit',
    href: '/credit',
    icon: CreditCardIcon,
    description: 'Step-by-step credit restoration system to repair your credit profile',
    category: 'Services',
  },
  {
    name: 'Articles',
    href: '/articles',
    icon: DocumentTextIcon,
    description: 'Read articles about Minnesota real estate development and acquisition',
    category: 'Resources',
  },
  {
    name: 'Settings',
    href: '/account/settings',
    icon: Cog6ToothIcon,
    description: 'Manage your account settings and preferences',
    category: 'Account',
  },
];

export const getNavItemsByCategory = () => {
  const categories = new Map<string, NavItem[]>();
  navItems.forEach((item) => {
    const category = item.category || 'Other';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    const categoryItems = categories.get(category);
    if (categoryItems) {
      categoryItems.push(item);
    }
  });
  return categories;
};

