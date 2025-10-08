'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';
import { NodeData } from '../services/sessionStorage';

export interface ActionButton {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export interface ActionFrameworkConfig {
  entity: PersonRecord | PersonDetailEntity;
  node?: NodeData;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onCopyData?: (data: unknown) => void;
  onDeleteNode?: (nodeId: string) => void;
  onRerunSearch?: (node: NodeData) => void;
  isCreditsExhausted?: boolean;
}

export class EntityActionFramework {
  static getActions(config: ActionFrameworkConfig): ActionButton[] {
    const { entity, node, isCreditsExhausted = false } = config;
    const actions: ActionButton[] = [];
    
    // Base actions for all entities
    actions.push({
      id: 'copy',
      label: 'Copy',
      icon: '',
      variant: 'secondary',
      onClick: () => config.onCopyData?.(entity),
      tooltip: 'Copy entity data to clipboard'
    });
    
    // Entity-specific actions
    if (this.isPersonEntity(entity)) {
      if (this.hasApiPersonId(entity)) {
        actions.push({
          id: 'trace',
          label: 'Trace',
          icon: '',
          variant: 'primary',
          onClick: () => this.handlePersonTrace(entity, config),
          disabled: isCreditsExhausted,
          tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Trace this person for detailed information'
        });
      }
    }
    
    if (this.isAddressEntity(entity)) {
      actions.push({
        id: 'intel',
        label: 'Intel',
        icon: '',
        variant: 'primary',
        onClick: () => this.handleAddressIntel(entity, config),
        disabled: isCreditsExhausted,
        tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Get detailed address information'
      });
      
      actions.push({
        id: 'map',
        label: 'Map',
        icon: '',
        variant: 'secondary',
        onClick: () => this.handleViewOnMap(entity),
        tooltip: 'Open address in map view'
      });
    }
    
    if (this.isPropertyEntity(entity)) {
      actions.push({
        id: 'zillow',
        label: 'Zillow',
        icon: '',
        variant: 'primary',
        onClick: () => this.handleZillowSearch(entity, config),
        disabled: isCreditsExhausted,
        tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Get detailed property information'
      });
      
      actions.push({
        id: 'owner',
        label: 'Owner',
        icon: '',
        variant: 'secondary',
        onClick: () => this.handleFindOwner(entity, config),
        disabled: isCreditsExhausted,
        tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Search for property owner information'
      });
    }
    
    if (this.isPhoneEntity(entity)) {
      actions.push({
        id: 'reverse',
        label: 'Reverse',
        icon: '',
        variant: 'primary',
        onClick: () => this.handleReverseLookup(entity, config),
        disabled: isCreditsExhausted,
        tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Perform reverse phone number lookup'
      });
    }
    
    if (this.isEmailEntity(entity)) {
      actions.push({
        id: 'verify',
        label: 'Verify',
        icon: '',
        variant: 'primary',
        onClick: () => this.handleEmailVerify(entity, config),
        disabled: isCreditsExhausted,
        tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Verify email address validity'
      });
    }
    
    // Node context actions
    if (node) {
      if (node.type === 'api-result' || node.type === 'start') {
        actions.push({
          id: 'rerun',
          label: 'Rerun',
          icon: '',
          variant: 'secondary',
          onClick: () => config.onRerunSearch?.(node),
          disabled: isCreditsExhausted,
          tooltip: isCreditsExhausted ? 'Credits exhausted' : 'Re-run this search'
        });
      }
      
      if (config.onDeleteNode) {
        actions.push({
          id: 'delete',
          label: 'Delete',
          icon: '',
          variant: 'danger',
          onClick: () => config.onDeleteNode?.(node.id),
          tooltip: 'Delete this node and all its data'
        });
      }
    }
    
    return actions;
  }
  
  // Entity type checking methods
  private static isPersonEntity(entity: PersonRecord | PersonDetailEntity): boolean {
    return !('type' in entity) || entity.type === 'person';
  }
  
  private static isAddressEntity(entity: PersonRecord | PersonDetailEntity): boolean {
    return 'type' in entity && entity.type === 'address';
  }
  
  private static isPropertyEntity(entity: PersonRecord | PersonDetailEntity): boolean {
    return 'type' in entity && entity.type === 'property';
  }
  
  private static isPhoneEntity(entity: PersonRecord | PersonDetailEntity): boolean {
    return 'type' in entity && entity.type === 'phone';
  }
  
  private static isEmailEntity(entity: PersonRecord | PersonDetailEntity): boolean {
    return 'type' in entity && entity.type === 'email';
  }
  
  private static hasApiPersonId(entity: PersonRecord | PersonDetailEntity): boolean {
    if (!('type' in entity)) {
      return !!(entity as PersonRecord).apiPersonId;
    }
    return entity.type === 'person' && !!(entity as PersonDetailEntity).apiPersonId;
  }
  
  // Action handlers
  private static handlePersonTrace(entity: PersonRecord | PersonDetailEntity, config: ActionFrameworkConfig) {
    if (!config.onPersonTrace) return;
    
    const personRecord = entity as PersonRecord;
    if (!personRecord.apiPersonId) return;
    
    config.onPersonTrace(
      personRecord.apiPersonId,
      personRecord,
      'Skip Trace',
      undefined,
      personRecord.mnEntityId,
      personRecord
    );
  }
  
  private static handleAddressIntel(entity: PersonRecord | PersonDetailEntity, config: ActionFrameworkConfig) {
    if (!config.onAddressIntel) return;
    
    const addressEntity = entity as PersonDetailEntity & { street?: string; city?: string; state?: string; postal?: string; mnEntityId?: string };
    if (addressEntity.street && addressEntity.city && addressEntity.state) {
      config.onAddressIntel({
        street: addressEntity.street,
        city: addressEntity.city,
        state: addressEntity.state,
        zip: addressEntity.postal || ''
      }, addressEntity.mnEntityId);
    }
  }
  
  private static handleViewOnMap(entity: PersonRecord | PersonDetailEntity) {
    // TODO: Implement map view functionality
    console.log('View on map:', entity);
  }
  
  private static handleZillowSearch(entity: PersonRecord | PersonDetailEntity, _config: ActionFrameworkConfig) {
    // TODO: Implement Zillow search functionality
    console.log('Zillow search:', entity);
  }
  
  private static handleFindOwner(entity: PersonRecord | PersonDetailEntity, _config: ActionFrameworkConfig) {
    // TODO: Implement owner search functionality
    console.log('Find owner:', entity);
  }
  
  private static handleReverseLookup(entity: PersonRecord | PersonDetailEntity, _config: ActionFrameworkConfig) {
    // TODO: Implement reverse lookup functionality
    console.log('Reverse lookup:', entity);
  }
  
  private static handleEmailVerify(entity: PersonRecord | PersonDetailEntity, _config: ActionFrameworkConfig) {
    // TODO: Implement email verification functionality
    console.log('Email verify:', entity);
  }
}
