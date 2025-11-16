'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CreditBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function CreditBreadcrumbs({ items }: CreditBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`text-sm font-medium ${isLast ? 'text-black' : 'text-gray-600'}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

