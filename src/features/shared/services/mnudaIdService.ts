// MNuda ID Service for generating unique identifiers and managing relationships
// This service provides a foundation for tracking nodes and parsed data with unique IDs

export class MnudaIdService {
  private static counter = 0;
  private static entityIdCache = new Map<string, string>(); // Cache for deterministic entity IDs

  // Generate a deterministic ID based on content hash
  static generateDeterministicId(prefix: 'MN' | 'MNSESSION' | 'MNENTITY', content: string): string {
    // Create a simple hash from the content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive 10-digit string
    const idDigits = Math.abs(hash).toString().padStart(10, '0');
    return `${prefix}${idDigits}`;
  }

  // Generate a 10-digit ID with specific prefix (for non-deterministic cases)
  static generateId(prefix: 'MN' | 'MNSESSION' | 'MNENTITY'): string {
    this.counter++;
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const counter = this.counter.toString().padStart(4, '0');
    return `${prefix}${timestamp}${counter}`;
  }

  // Generate ID for a specific type
  static generateTypedId(type: 'node' | 'entity' | 'session' | 'data'): string {
    switch (type) {
      case 'node': return this.generateId('MN');
      case 'entity': return this.generateId('MNENTITY');
      case 'session': return this.generateId('MNSESSION');
      case 'data': return this.generateId('MN');
      default: return this.generateId('MN');
    }
  }

  // Generate deterministic entity ID based on entity content
  static generateEntityId(entityData: Record<string, unknown>, parentNodeId: string): string {
    // Create a content string that uniquely identifies this entity
    const contentString = JSON.stringify({
      type: entityData.type,
      name: entityData.name || entityData.street || entityData.number || entityData.email,
      parentNodeId: parentNodeId,
      // Include key identifying fields
      ...(entityData.apiPersonId ? { apiPersonId: entityData.apiPersonId } : {}),
      ...(entityData.street ? { street: entityData.street } : {}),
      ...(entityData.city ? { city: entityData.city } : {}),
      ...(entityData.state ? { state: entityData.state } : {}),
    });
    
    // Check cache first
    if (this.entityIdCache.has(contentString)) {
      return this.entityIdCache.get(contentString)!;
    }
    
    // Generate deterministic ID
    const entityId = this.generateDeterministicId('MNENTITY', contentString);
    
    // Cache it
    this.entityIdCache.set(contentString, entityId);
    
    return entityId;
  }

  // Extract type from MNuda ID
  static getTypeFromId(mnudaId: string): string | null {
    if (mnudaId.startsWith('MNSESSION')) return 'session';
    if (mnudaId.startsWith('MNENTITY')) return 'entity';
    if (mnudaId.startsWith('MN')) return 'node';
    return null;
  }

  // Check if an ID is a MNuda ID
  static isMnudaId(id: string): boolean {
    return id.startsWith('MN');
  }

  // Create parent-child relationship
  static createRelationship(parentId: string, childId: string): {
    parentMnudaId: string;
    childMnudaId: string;
  } {
    return {
      parentMnudaId: parentId,
      childMnudaId: childId,
    };
  }

  // Build relationship chain from entities
  static buildRelationshipChain(entities: Array<{ mnudaId: string; parentMnudaId?: string }>): Map<string, string[]> {
    const relationships = new Map<string, string[]>();
    
    entities.forEach(entity => {
      if (entity.parentMnudaId) {
        if (!relationships.has(entity.parentMnudaId)) {
          relationships.set(entity.parentMnudaId, []);
        }
        relationships.get(entity.parentMnudaId)!.push(entity.mnudaId);
      }
    });
    
    return relationships;
  }

  // Find all children of a parent
  static findChildren(parentId: string, entities: Array<{ mnudaId: string; parentMnudaId?: string }>): string[] {
    return entities
      .filter(entity => entity.parentMnudaId === parentId)
      .map(entity => entity.mnudaId);
  }

  // Find all parents of a child (traces up the hierarchy)
  static findParents(childId: string, entities: Array<{ mnudaId: string; parentMnudaId?: string }>): string[] {
    const child = entities.find(entity => entity.mnudaId === childId);
    if (!child || !child.parentMnudaId) return [];
    
    return [child.parentMnudaId, ...this.findParents(child.parentMnudaId, entities)];
  }

  // Get relationship depth (how many levels deep)
  static getDepth(mnudaId: string, entities: Array<{ mnudaId: string; parentMnudaId?: string }>): number {
    const parents = this.findParents(mnudaId, entities);
    return parents.length;
  }

  // Validate relationship chain (check for circular references, missing parents, etc.)
  static validateRelationships(entities: Array<{ mnudaId: string; parentMnudaId?: string }>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const ids = new Set(entities.map(e => e.mnudaId));

    entities.forEach(entity => {
      if (entity.parentMnudaId && !ids.has(entity.parentMnudaId)) {
        errors.push(`Entity ${entity.mnudaId} references non-existent parent ${entity.parentMnudaId}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Generate a batch of IDs (useful for bulk operations)
  static generateBatch(count: number, type: 'node' | 'entity' | 'session' | 'data' = 'data'): string[] {
    return Array.from({ length: count }, () => this.generateTypedId(type));
  }

  // Parse MNuda ID to get components
  static parseId(mnudaId: string): {
    prefix: string;
    id: string;
    type: string;
  } | null {
    if (!this.isMnudaId(mnudaId)) return null;
    
    let prefix = '';
    let type = '';
    
    if (mnudaId.startsWith('MNSESSION')) {
      prefix = 'MNSESSION';
      type = 'session';
    } else if (mnudaId.startsWith('MNENTITY')) {
      prefix = 'MNENTITY';
      type = 'entity';
    } else if (mnudaId.startsWith('MN')) {
      prefix = 'MN';
      type = 'node';
    }
    
    const id = mnudaId.substring(prefix.length);
    
    return {
      prefix,
      id,
      type,
    };
  }
}
