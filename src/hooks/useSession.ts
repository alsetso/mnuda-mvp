'use client';

import { useState, useEffect } from 'react';
import { sessionStorageService, SessionData, NodeData, EntitySummary } from '@/lib/sessionStorage';

export function useSession() {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    loadSessions();
    const session = sessionStorageService.getCurrentSession();
    if (session) {
      setCurrentSession(session);
      setNodes(session.nodes);
    } else {
      // Create a new session if none exists
      const newSession = sessionStorageService.createSession();
      setCurrentSession(newSession);
      setNodes([]);
    }
  }, []);

  const loadSessions = () => {
    const allSessions = sessionStorageService.getSessions();
    setSessions(allSessions);
  };

  const addNode = (node: NodeData) => {
    setNodes(prev => [...prev, node]);
    sessionStorageService.addNode(node);
    loadSessions(); // Refresh sessions list
  };

  const switchSession = (sessionId: string) => {
    const nodes = sessionStorageService.loadSession(sessionId);
    const session = sessionStorageService.getCurrentSession();
    setCurrentSession(session);
    setNodes(nodes);
  };

  const createNewSession = (name?: string) => {
    const newSession = sessionStorageService.createSession(name);
    setCurrentSession(newSession);
    setNodes([]);
    loadSessions();
  };

  const deleteSession = (sessionId: string) => {
    sessionStorageService.deleteSession(sessionId);
    loadSessions();
    
    // If deleting current session, create a new one
    if (currentSession?.id === sessionId) {
      createNewSession();
    }
  };

  const getEntitySummary = (): EntitySummary => {
    return sessionStorageService.getEntitySummary();
  };

  const getActionableEntities = () => {
    return sessionStorageService.getActionableEntities();
  };

  return {
    // State
    currentSession,
    nodes,
    sessions,
    
    // Actions
    addNode,
    switchSession,
    createNewSession,
    deleteSession,
    
    // Utilities
    getEntitySummary,
    getActionableEntities,
    loadSessions,
  };
}
