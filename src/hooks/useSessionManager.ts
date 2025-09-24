'use client';

import { useState, useEffect, useCallback } from 'react';
import { sessionStorageService, SessionData, NodeData } from '@/lib/sessionStorage';

export function useSessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh sessions list
  const refreshSessions = useCallback(() => {
    const allSessions = sessionStorageService.getSessions();
    const current = sessionStorageService.getCurrentSession();
    setSessions(allSessions);
    setCurrentSession(current);
  }, []);

  // Trigger refresh (increment counter to force re-render)
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Initialize sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Refresh sessions when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshSessions();
    }
  }, [refreshTrigger, refreshSessions]);

  // Add node and trigger refresh
  const addNode = useCallback((node: NodeData) => {
    try {
      sessionStorageService.addNode(node);
      triggerRefresh();
    } catch (error) {
      console.error('Error adding node to session:', error);
    }
  }, [triggerRefresh]);

  // Create new session and trigger refresh
  const createNewSession = useCallback((name?: string) => {
    const newSession = sessionStorageService.createSession(name);
    triggerRefresh();
    return newSession;
  }, [triggerRefresh]);

  // Switch session and trigger refresh
  const switchSession = useCallback((sessionId: string) => {
    const nodes = sessionStorageService.loadSession(sessionId);
    const session = sessionStorageService.getCurrentSession();
    setCurrentSession(session);
    triggerRefresh();
    return nodes;
  }, [triggerRefresh]);

  // Rename session and trigger refresh
  const renameSession = useCallback((sessionId: string, newName: string) => {
    sessionStorageService.renameSession(sessionId, newName);
    triggerRefresh();
  }, [triggerRefresh]);

  // Delete session and trigger refresh
  const deleteSession = useCallback((sessionId: string) => {
    sessionStorageService.deleteSession(sessionId);
    triggerRefresh();
  }, [triggerRefresh]);

  // Get current session nodes
  const getCurrentNodes = useCallback(() => {
    return sessionStorageService.getNodes();
  }, []);

  return {
    // State
    sessions,
    currentSession,
    
    // Actions
    addNode,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    
    // Utilities
    refreshSessions,
    triggerRefresh,
    getCurrentNodes,
  };
}
