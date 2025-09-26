'use client';

import { useState, useEffect, useCallback } from 'react';
import { sessionStorageService, SessionData, NodeData } from '../services/sessionStorage';

export function useSessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);

  // Initialize sessions on mount
  useEffect(() => {
    const allSessions = sessionStorageService.getSessions();
    const current = sessionStorageService.getCurrentSession();
    setSessions(allSessions);
    setCurrentSession(current);
  }, []); // Only run on mount

  // Force refresh sessions list
  const refreshSessions = useCallback(() => {
    const allSessions = sessionStorageService.getSessions();
    const current = sessionStorageService.getCurrentSession();
    setSessions(allSessions);
    setCurrentSession(current);
  }, []);

  // Add node and trigger refresh
  const addNode = useCallback((node: NodeData) => {
    try {
      sessionStorageService.addNode(node);
      refreshSessions();
    } catch (error) {
      console.error('Error adding node to session:', error);
    }
  }, [refreshSessions]);

  // Create new session and trigger refresh
  const createNewSession = useCallback((name?: string) => {
    const newSession = sessionStorageService.createSession(name);
    refreshSessions();
    return newSession;
  }, [refreshSessions]);

  // Switch session and trigger refresh
  const switchSession = useCallback((sessionId: string) => {
    const nodes = sessionStorageService.loadSession(sessionId);
    refreshSessions();
    return nodes;
  }, [refreshSessions]);

  // Rename session and trigger refresh
  const renameSession = useCallback((sessionId: string, newName: string) => {
    sessionStorageService.renameSession(sessionId, newName);
    refreshSessions();
  }, [refreshSessions]);

  // Delete session and trigger refresh
  const deleteSession = useCallback((sessionId: string) => {
    sessionStorageService.deleteSession(sessionId);
    refreshSessions();
  }, [refreshSessions]);

  // Delete node and trigger refresh
  const deleteNode = useCallback((nodeId: string) => {
    try {
      sessionStorageService.deleteNode(nodeId);
      refreshSessions();
    } catch (error) {
      console.error('Error deleting node from session:', error);
    }
  }, [refreshSessions]);

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
    deleteNode,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    
    // Utilities
    refreshSessions,
    getCurrentNodes,
  };
}
