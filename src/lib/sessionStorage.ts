// Simple session storage system for evergreen data capture

export interface SessionData {
  id: string;
  name: string;
  createdAt: number;
  lastAccessed: number;
  nodes: NodeData[];
}

export interface NodeData {
  id: string;
  type: 'api-result' | 'people-result';
  address?: { street: string; city: string; state: string; zip: string };
  apiName: string;
  response?: unknown;
  personId?: string;
  personData?: unknown;
  timestamp: number;
}

export interface EntitySummary {
  total: number;
  addresses: number;
  persons: number;
  properties: number;
  phones: number;
  emails: number;
}

class SessionStorageService {
  private readonly STORAGE_KEY = 'freemap_sessions';
  private readonly CURRENT_SESSION_KEY = 'freemap_current_session';

  // Get all sessions
  getSessions(): SessionData[] {
    try {
      const sessions = localStorage.getItem(this.STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return localStorage.getItem(this.CURRENT_SESSION_KEY);
  }

  // Get current session
  getCurrentSession(): SessionData | null {
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) return null;
    
    const sessions = this.getSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Create new session
  createSession(name?: string): SessionData {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: SessionData = {
      id: sessionId,
      name: name || `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      nodes: [] // Explicitly initialize as empty array
    };

    const sessions = this.getSessions();
    sessions.push(session);
    this.saveSessions(sessions);
    this.setCurrentSession(sessionId);

    return session;
  }

  // Set current session
  setCurrentSession(sessionId: string): void {
    localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
    
    // Update last accessed time
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.lastAccessed = Date.now();
      this.saveSessions(sessions);
    }
  }

  // Add node to current session
  addNode(node: NodeData): void {
    const session = this.getCurrentSession();
    if (!session) return;

    // Ensure nodes is an array
    if (!Array.isArray(session.nodes)) {
      session.nodes = [];
    }

    session.nodes.push(node);
    session.lastAccessed = Date.now();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
  }

  // Get nodes from current session
  getNodes(): NodeData[] {
    const session = this.getCurrentSession();
    if (!session) return [];
    
    // Ensure nodes is an array
    if (!Array.isArray(session.nodes)) {
      session.nodes = [];
    }
    
    return session.nodes;
  }

  // Load session nodes
  loadSession(sessionId: string): NodeData[] {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      this.setCurrentSession(sessionId);
      
      // Ensure nodes is an array
      if (!Array.isArray(session.nodes)) {
        session.nodes = [];
      }
      
      return session.nodes;
    }
    return [];
  }

  // Rename session
  renameSession(sessionId: string, newName: string): void {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].name = newName;
      sessions[sessionIndex].lastAccessed = Date.now();
      this.saveSessions(sessions);
    }
  }

  // Delete session
  deleteSession(sessionId: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    this.saveSessions(filteredSessions);

    // If deleting current session, create a new one
    if (this.getCurrentSessionId() === sessionId) {
      this.createSession();
    }
  }

  // Get entity summary from current session
  getEntitySummary(): EntitySummary {
    const nodes = this.getNodes();
    let total = 0;
    let addresses = 0;
    let persons = 0;
    let properties = 0;
    let phones = 0;
    let emails = 0;

    nodes.forEach(node => {
      if (node.type === 'api-result' && node.response) {
        // Count entities from API responses
        if (node.apiName === 'Skip Trace' && (node.response as { people?: unknown[] }).people) {
          const people = (node.response as { people: unknown[] }).people;
          persons += people.length || 0;
          total += people.length || 0;
        }
        if (node.apiName === 'Zillow Search') {
          properties += 1;
          total += 1;
        }
      } else if (node.type === 'people-result' && node.personData) {
        // Count entities from person detail responses
        const data = node.personData as Record<string, unknown[]>;
        if (data['Current Address Details List']) addresses += data['Current Address Details List'].length;
        if (data['Previous Address Details']) addresses += data['Previous Address Details'].length;
        if (data['All Phone Details']) phones += data['All Phone Details'].length;
        if (data['Email Addresses']) emails += data['Email Addresses'].length;
        if (data['Person Details']) persons += data['Person Details'].length;
        if (data['All Relatives']) persons += data['All Relatives'].length;
        if (data['All Associates']) persons += data['All Associates'].length;
        
        total += (data['Current Address Details List']?.length || 0) +
                (data['Previous Address Details']?.length || 0) +
                (data['All Phone Details']?.length || 0) +
                (data['Email Addresses']?.length || 0) +
                (data['Person Details']?.length || 0) +
                (data['All Relatives']?.length || 0) +
                (data['All Associates']?.length || 0);
      }
    });

    return { total, addresses, persons, properties, phones, emails };
  }

  // Get actionable entities (addresses and persons that can be traced)
  getActionableEntities(): { addresses: number; persons: number } {
    const nodes = this.getNodes();
    let addresses = 0;
    let persons = 0;

    nodes.forEach(node => {
      if (node.type === 'people-result' && node.personData) {
        const data = node.personData as Record<string, unknown[]>;
        if (data['Current Address Details List']) addresses += data['Current Address Details List'].length;
        if (data['Previous Address Details']) addresses += data['Previous Address Details'].length;
        if (data['All Relatives']) persons += data['All Relatives'].length;
        if (data['All Associates']) persons += data['All Associates'].length;
      }
    });

    return { addresses, persons };
  }

  // Clear corrupted session data
  clearCorruptedData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
      console.log('Cleared corrupted session data');
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }

  // Save sessions to localStorage
  private saveSessions(sessions: SessionData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }
}

export const sessionStorageService = new SessionStorageService();
