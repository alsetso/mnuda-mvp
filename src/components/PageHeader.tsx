'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  secondaryName?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, secondaryName, actions }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex-shrink-0 border-b border-gray-300 bg-gold-100 py-3">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[10px] font-mono text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeftIcon className="w-3 h-3 mr-0.5" />
          </button>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {item.href ? (
                  <button
                    onClick={() => item.href && router.push(item.href)}
                    className="text-[10px] font-mono text-gray-600 hover:text-black transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={`text-[10px] font-mono ${isLast ? 'text-black' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                )}
                {!isLast && <span className="text-gray-400 text-[10px]">/</span>}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-black font-mono">{title}</h1>
          {secondaryName && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-mono text-gray-700">{secondaryName}</span>
            </>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

