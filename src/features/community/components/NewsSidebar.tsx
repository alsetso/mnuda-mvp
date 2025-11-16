'use client';

import Link from 'next/link';
import { NewspaperIcon, MegaphoneIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  type: 'news' | 'announcement' | 'event';
  href?: string;
}

interface NewsSidebarProps {
  items?: NewsItem[];
}

const defaultItems: NewsItem[] = [
  {
    id: '1',
    title: 'Q1 2025 Market Update: Minnesota Real Estate Trends',
    excerpt: 'Key insights into distressed property opportunities across the Twin Cities metro area.',
    date: '2025-01-15',
    type: 'news',
  },
  {
    id: '2',
    title: 'New Property Acquisition Tools Available',
    excerpt: 'Enhanced skip trace and property research features now live.',
    date: '2025-01-12',
    type: 'announcement',
  },
  {
    id: '3',
    title: 'Community Meetup - January 2025',
    excerpt: 'Join us for networking and property discussion at our monthly meetup.',
    date: '2025-01-25',
    type: 'event',
  },
  {
    id: '4',
    title: 'Hennepin County Foreclosure Opportunities',
    excerpt: 'Early insights on upcoming foreclosure properties in Minneapolis.',
    date: '2025-01-10',
    type: 'news',
  },
];

export default function NewsSidebar({ items = defaultItems }: NewsSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news':
        return <NewspaperIcon className="w-4 h-4" />;
      case 'announcement':
        return <MegaphoneIcon className="w-4 h-4" />;
      case 'event':
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <NewspaperIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'news':
        return 'bg-blue-100 text-blue-800';
      case 'announcement':
        return 'bg-gold-200 text-gold-800';
      case 'event':
        return 'bg-black text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* News Section */}
      <div>
        <h2 className="text-lg font-black text-black mb-4">News & Updates</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href || '#'}
              className="group block bg-white border border-gold-200 rounded-lg p-4 hover:border-black hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                  <span className="capitalize">{item.type}</span>
                </span>
                <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
              </div>
              <h3 className="font-bold text-black text-sm mb-1.5 group-hover:text-black line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2">{item.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gold-100 border border-gold-200 rounded-xl p-4">
        <h3 className="text-sm font-black text-black mb-3">Quick Links</h3>
        <div className="space-y-2">
          <Link
            href="/map"
            className="flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-black transition-colors group"
          >
            <span>Community Forum</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/events"
            className="flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-black transition-colors group"
          >
            <span>Upcoming Events</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/resources"
            className="flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-black transition-colors group"
          >
            <span>Resources</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

