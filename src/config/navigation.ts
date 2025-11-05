import {
  HomeIcon,
  MapIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  RectangleStackIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PrinterIcon,
  ArrowPathIcon,
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
    description: 'Search properties and navigate to all features',
    category: 'Main',
  },
  {
    name: 'Skip Tracing',
    href: '/skip-tracing',
    icon: MagnifyingGlassIcon,
    description: 'Find people by name, email, phone, or address',
    category: 'Search',
  },
  {
    name: 'Community',
    href: '/community',
    icon: MapIcon,
    description: 'Interactive map with community pins and property search',
    category: 'Map',
  },
  {
    name: 'Directory',
    href: '/directory',
    icon: RectangleStackIcon,
    description: 'Browse Minnesota counties and location data',
    category: 'Data',
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: BriefcaseIcon,
    description: 'Manage your real estate assets and properties',
    category: 'Management',
  },
  {
    name: 'Workflow',
    href: '/workflow',
    icon: ArrowPathIcon,
    description: 'Transform and process bulk data lists',
    category: 'Tools',
  },
  {
    name: 'Advertising',
    href: '/advertising',
    icon: MegaphoneIcon,
    description: 'Create and manage Facebook and Instagram ads',
    category: 'Marketing',
  },
  {
    name: 'Print',
    href: '/print',
    icon: PrinterIcon,
    description: 'Print documents and reports',
    category: 'Tools',
  },
  {
    name: 'Settings',
    href: '/settings',
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

