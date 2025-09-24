'use client';

import { sessionStorageService, SessionData } from './sessionStorage';

export interface StorageUsage {
  total: number;
  sessions: SessionUsage[];
  other: number;
}

export interface SessionUsage {
  session: SessionData;
  size: number;
  percentage: number;
}

export function calculateStorageUsage(): StorageUsage {
  // Get all sessions
  const sessions = sessionStorageService.getSessions();
  
  // Calculate total localStorage usage
  let totalSize = 0;
  const sessionUsages: SessionUsage[] = [];
  
  // Calculate size for each session
  sessions.forEach(session => {
    const sessionData = JSON.stringify(session);
    const sessionSize = new Blob([sessionData]).size;
    sessionUsages.push({
      session,
      size: sessionSize,
      percentage: 0 // Will be calculated after we know total
    });
    totalSize += sessionSize;
  });
  
  // Calculate other localStorage usage (non-session data)
  let otherSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.startsWith('freemap_session_')) {
      const value = localStorage.getItem(key);
      if (value) {
        otherSize += new Blob([value]).size;
      }
    }
  }
  
  totalSize += otherSize;
  
  // Calculate percentages
  sessionUsages.forEach(usage => {
    usage.percentage = totalSize > 0 ? (usage.size / totalSize) * 100 : 0;
  });
  
  return {
    total: totalSize,
    sessions: sessionUsages.sort((a, b) => b.size - a.size), // Sort by size descending
    other: otherSize
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStorageQuota(): Promise<{ quota: number; usage: number }> {
  return new Promise((resolve) => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        resolve({
          quota: estimate.quota || 0,
          usage: estimate.usage || 0
        });
      });
    } else {
      // Fallback for browsers that don't support storage estimate
      resolve({
        quota: 0,
        usage: 0
      });
    }
  });
}

export function clearEmptySessions(): { deletedCount: number; deletedSessions: string[] } {
  const sessions = sessionStorageService.getSessions();
  const emptySessions = sessions.filter(session => session.nodes.length === 0);
  const deletedSessions: string[] = [];
  
  emptySessions.forEach(session => {
    sessionStorageService.deleteSession(session.id);
    deletedSessions.push(session.name);
  });
  
  return {
    deletedCount: emptySessions.length,
    deletedSessions
  };
}
