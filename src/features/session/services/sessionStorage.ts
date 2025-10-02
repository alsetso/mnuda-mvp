// Simple session storage system for evergreen data capture

import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { peopleParseService } from '@/features/api/services/peopleParse';
import { personDetailParseService, ParsedPersonDetailData } from '@/features/api/services/personDetailParse';

export interface SessionData {
  id: string;
  name: string;
  createdAt: number;
  lastAccessed: number;
  nodes: NodeData[];
  mnudaId?: string; // MNSESSION ID
  activeUserFoundNodeId?: string; // Track which UserFoundNode is currently active
  locationTrackingActive: boolean; // Prevent multiple GPS tracking sessions
}

export interface NodeData {
  id: string;
  type: 'userFound' | 'start' | 'api-result' | 'people-result';
  address?: { 
    street: string; 
    city: string; 
    state: string; 
    zip: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  apiName?: string;
  response?: unknown;
  personId?: string;
  personData?: unknown;
  timestamp: number;
  hasCompleted?: boolean;
  
  // UserFoundNode specific fields
  status?: 'pending' | 'ready';
  payload?: {
    coords: { lat: number; lng: number };
    address?: { 
      street: string; 
      city: string; 
      state: string; 
      zip: string;
      coordinates?: { latitude: number; longitude: number };
    };
    locationHistory?: Array<{
      coords: { lat: number; lng: number };
      address?: { 
        street: string; 
        city: string; 
        state: string; 
        zip: string;
        coordinates?: { latitude: number; longitude: number };
      };
      timestamp: number;
    }>;
  };
  
  // Simplified 3-ID structure
  mnNodeId: string;                    // Internal node ID (replaces mnudaId)
  parentNodeId?: string;               // Parent node ID (replaces parentMnudaId)
  clickedEntityId?: string;            // Which entity triggered this node
  clickedEntityData?: unknown;         // The actual entity data that triggered this node
  
  // Custom title support
  customTitle?: string;                // User-defined custom title
  
  // Legacy fields for compatibility
  childMnudaIds?: string[];            // Child node IDs
  entityCount?: number;                // Number of entities
  relationshipType?: string;           // Type of relationship (e.g., 'parent', 'child')
}

// Simplified entity structure - only traceable entities get IDs
export interface EntityData {
  mnEntityId?: string;        // Only for traceable entities (has Trace/Intel button)
  parentNodeId: string;       // The node that created this entity
  type: 'person' | 'address' | 'phone' | 'email' | 'property';
  category?: string;
  data: Record<string, unknown>;
  source: string;
  timestamp: number;
  isTraceable: boolean;       // Whether this entity has action buttons
}

export interface EntitySummary {
  total: number;
  addresses: number;
  persons: number;
  properties: number;
  phones: number;
  emails: number;
  images: number;
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
    
    // Create UserFoundNode as the first node in every session
    const userFoundNode: NodeData = {
      id: 'user-found-node',
      type: 'userFound',
      status: 'pending',
      timestamp: Date.now(),
      hasCompleted: false,
      mnNodeId: MnudaIdService.generateTypedId('node'),
    };
    
    const session: SessionData = {
      id: sessionId,
      name: name || (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `Session ${year}-${month}-${day} ${hours}:${minutes}`;
      })(),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      nodes: [userFoundNode], // Start with UserFoundNode
      mnudaId: MnudaIdService.generateTypedId('session'),
      activeUserFoundNodeId: userFoundNode.id, // Set as active
      locationTrackingActive: false, // Not tracking yet
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

    // Ensure node has MNuda ID
    const nodeWithId = {
      ...node,
      mnNodeId: node.mnNodeId || MnudaIdService.generateTypedId('node')
    };

    session.nodes.push(nodeWithId);
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

    // If deleting current session, clear the current session
    if (this.getCurrentSessionId() === sessionId) {
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
    }
  }

  // Update node title
  updateNodeTitle(nodeId: string, customTitle: string): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const nodeIndex = session.nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1) {
      session.nodes[nodeIndex].customTitle = customTitle;
      session.lastAccessed = Date.now();
      
      const sessions = this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = session;
        this.saveSessions(sessions);
      }
    }
  }

  // Update UserFoundNode with location data
  updateUserFoundNode(nodeId: string, coords: { lat: number; lng: number }, address?: { street: string; city: string; state: string; zip: string; coordinates?: { latitude: number; longitude: number } }): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const nodeIndex = session.nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1 && session.nodes[nodeIndex].type === 'userFound') {
      const node = session.nodes[nodeIndex];
      
      // Initialize location history if it doesn't exist
      if (!node.payload) {
        node.payload = { coords, address, locationHistory: [] };
      }
      
      // Add current location to history (only if coordinates changed significantly)
      const lastEntry = node.payload.locationHistory?.[node.payload.locationHistory.length - 1];
      const shouldAddToHistory = !lastEntry || 
        Math.abs(lastEntry.coords.lat - coords.lat) > 0.0001 || 
        Math.abs(lastEntry.coords.lng - coords.lng) > 0.0001;
      
      if (shouldAddToHistory) {
        const locationEntry = {
          coords,
          address: address || lastEntry?.address, // Keep previous address if not provided
          timestamp: Date.now()
        };
        
        // Add to history (keep last 100 entries to prevent memory issues)
        if (!node.payload.locationHistory) {
          node.payload.locationHistory = [];
        }
        node.payload.locationHistory.push(locationEntry);
        if (node.payload.locationHistory.length > 100) {
          node.payload.locationHistory = node.payload.locationHistory.slice(-100);
        }
      }
      
      // Always update current location coordinates
      node.payload.coords = coords;
      
      // Only update address if provided (to avoid overwriting with undefined)
      if (address) {
        node.payload.address = address;
      }
      
      node.status = 'ready';
      
      session.lastAccessed = Date.now();
      
      const sessions = this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = session;
        this.saveSessions(sessions);
        
        // Trigger a custom event to notify React components of the update
        window.dispatchEvent(new CustomEvent('sessionUpdated', { 
          detail: { sessionId: session.id, nodeId } 
        }));
      }
    }
  }

  // Mark UserFoundNode as complete when tracking stops
  completeUserFoundNode(nodeId: string): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const nodeIndex = session.nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex !== -1 && session.nodes[nodeIndex].type === 'userFound') {
      session.nodes[nodeIndex].hasCompleted = true;
      session.lastAccessed = Date.now();
      
      const sessions = this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = session;
        this.saveSessions(sessions);
      }
    }
  }

  // Create a new UserFoundNode for additional tracking sessions
  // Only allows one active UserFoundNode per session
  createNewUserFoundNode(): NodeData | null {
    const session = this.getCurrentSession();
    if (!session) return null;
    
    // Check if there's already an active UserFoundNode
    const hasActiveNode = session.nodes.some(node => 
      node.type === 'userFound' && 
      !node.hasCompleted
    );
    
    if (hasActiveNode) {
      console.warn('Cannot create new UserFoundNode: session already has an active UserFoundNode');
      return null; // Don't create new one
    }
    
    // Create new UserFoundNode
    const newUserFoundNode: NodeData = {
      id: `user-found-node-${Date.now()}`,
      type: 'userFound',
      status: 'pending',
      timestamp: Date.now(),
      hasCompleted: false,
      mnNodeId: MnudaIdService.generateTypedId('node'),
    };
    
    // Update session to track this as active
    session.activeUserFoundNodeId = newUserFoundNode.id;
    session.locationTrackingActive = false;
    session.lastAccessed = Date.now();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
    
    return newUserFoundNode;
  }

  // Start location tracking for the active UserFoundNode
  startLocationTracking(): boolean {
    const session = this.getCurrentSession();
    if (!session || session.locationTrackingActive) return false;
    
    session.locationTrackingActive = true;
    session.lastAccessed = Date.now();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
    
    return true;
  }
  
  // Stop location tracking
  stopLocationTracking(): void {
    const session = this.getCurrentSession();
    if (!session) return;
    
    session.locationTrackingActive = false;
    session.lastAccessed = Date.now();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
  }
  
  // Get the currently active UserFoundNode
  getActiveUserFoundNode(): NodeData | null {
    const session = this.getCurrentSession();
    if (!session || !session.activeUserFoundNodeId) return null;
    
    return session.nodes.find(node => node.id === session.activeUserFoundNodeId) || null;
  }

  // Delete node from current session
  deleteNode(nodeId: string): void {
    const session = this.getCurrentSession();
    if (!session) return;

    // Remove the node
    session.nodes = session.nodes.filter(node => node.id !== nodeId);
    session.lastAccessed = Date.now();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
  }

  // Get entity summary from current session using parsed entity data
  getEntitySummary(): EntitySummary {
    const nodes = this.getNodes();
    let total = 0;
    let addresses = 0;
    let persons = 0;
    let properties = 0;
    let phones = 0;
    let emails = 0;
    let images = 0;

    nodes.forEach(node => {
      if (node.type === 'api-result' && node.response) {
        // For SkipTrace API results, use the parsed people data
        if (node.apiName === 'Skip Trace') {
          // Use the people parse service to get parsed entities
          try {
            const parsedData = peopleParseService.parsePeopleResponse(node.response as Record<string, unknown>, node.mnNodeId);
            
            // Count from parsed people data
            persons += parsedData.people.length;
            total += parsedData.people.length;
          } catch (error) {
            console.warn('Could not parse people data for entity counting:', error);
            // Fallback to raw response counting
            const people = (node.response as { people?: unknown[] }).people;
            if (people) {
              persons += people.length || 0;
              total += people.length || 0;
            }
          }
        }
        if (node.apiName === 'Zillow Search') {
          properties += 1;
          total += 1;
        }
      } else if (node.type === 'people-result' && node.personData) {
        // For person detail results, use the parsed entity data
        try {
          let parsedData;
          
          // Check if personData is already parsed (has entities array)
          if (node.personData && typeof node.personData === 'object' && 'entities' in node.personData) {
            parsedData = node.personData as ParsedPersonDetailData;
            
            // Check if any entities are missing mnEntityId and regenerate them
            const needsRegeneration = parsedData.entities.some(entity => !entity.mnEntityId);
            if (needsRegeneration) {
              // Re-parse the raw data to get updated entities with mnEntityId
              parsedData = personDetailParseService.parsePersonDetailResponse(parsedData.rawResponse, node.mnNodeId);
            }
          } else {
            // Parse the raw person data
            parsedData = personDetailParseService.parsePersonDetailResponse(node.personData as Record<string, unknown>, node.mnNodeId);
          }
          
          // Count from parsed entities
          parsedData.entities.forEach(entity => {
            total += 1;
            switch (entity.type) {
              case 'address':
                addresses += 1;
                break;
              case 'person':
                persons += 1;
                break;
              case 'property':
                properties += 1;
                break;
              case 'phone':
                phones += 1;
                break;
              case 'email':
                emails += 1;
                break;
              case 'image':
                images += 1;
                break;
            }
          });
        } catch (error) {
          console.warn('Could not parse person detail data for entity counting:', error);
          // Fallback to raw response counting
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
      }
    });

    return { total, addresses, persons, properties, phones, emails, images };
  }

  // Get all entities with their mnEntityId from current session
  getAllEntities(): Array<{ mnEntityId: string; type: string; parentNodeId: string; data: Record<string, unknown> }> {
    const nodes = this.getNodes();
    const allEntities: Array<{ mnEntityId: string; type: string; parentNodeId: string; data: Record<string, unknown> }> = [];

    nodes.forEach(node => {
      if (node.type === 'api-result' && node.response) {
        // For SkipTrace API results, get parsed people entities
        if (node.apiName === 'Skip Trace') {
          try {
            const parsedData = peopleParseService.parsePeopleResponse(node.response as Record<string, unknown>, node.mnNodeId);
            
            // Add all people entities
            parsedData.people.forEach(person => {
              allEntities.push({
                mnEntityId: person.mnEntityId || `fallback-${Date.now()}-${Math.random()}`,
                type: 'person',
                parentNodeId: node.mnNodeId,
                data: person as unknown as Record<string, unknown>
              });
            });
          } catch (error) {
            console.warn('Could not parse people data for entity tracking:', error);
          }
        }
      } else if (node.type === 'people-result' && node.personData) {
        // For person detail results, get parsed entities
        try {
          let parsedData;
          
          // Check if personData is already parsed (has entities array)
          if (node.personData && typeof node.personData === 'object' && 'entities' in node.personData) {
            parsedData = node.personData as ParsedPersonDetailData;
            
            // Check if any entities are missing mnEntityId and regenerate them
            const needsRegeneration = parsedData.entities.some(entity => !entity.mnEntityId);
            if (needsRegeneration) {
              // Re-parse the raw data to get updated entities with mnEntityId
              parsedData = personDetailParseService.parsePersonDetailResponse(parsedData.rawResponse, node.mnNodeId);
            }
          } else {
            // Parse the raw person data
            parsedData = personDetailParseService.parsePersonDetailResponse(node.personData as Record<string, unknown>, node.mnNodeId);
          }
          
          // Add all parsed entities
          parsedData.entities.forEach(entity => {
            allEntities.push({
              mnEntityId: entity.mnEntityId || `fallback-${Date.now()}-${Math.random()}`,
              type: entity.type,
              parentNodeId: node.mnNodeId,
              data: entity
            });
          });
        } catch (error) {
          console.warn('Could not parse person detail data for entity tracking:', error);
        }
      }
    });

    return allEntities;
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
