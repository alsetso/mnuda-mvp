'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeToTextClass: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const textClass = sizeToTextClass[size];
  return (
    <span className={`${textClass} font-semibold tracking-tight ${className}`}>
      <span className="text-[#014463]">MN</span>
      <span className="text-[#1dd1f5]">UDA</span>
    </span>
  );
}


