"use client";

import React from 'react';
import { PropertiesProvider } from '@/features/workspaces/contexts/PropertiesContext';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <PropertiesProvider>
      {children}
    </PropertiesProvider>
  );
}
