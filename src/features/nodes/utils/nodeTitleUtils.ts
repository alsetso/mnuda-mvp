import { NodeData } from '@/features/session/services/sessionStorage';
import { peopleParseService } from '@/features/api/services/peopleParse';
import { personDetailParseService } from '@/features/api/services/personDetailParse';

/**
 * Utility functions for automatically generating node titles based on primary data values
 */

/**
 * Extract primary value from address data
 */
export function getAddressPrimaryValue(address?: { street: string; city: string; state: string; zip: string }): string {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Extract primary value from person data (name)
 */
export function getPersonPrimaryValue(personData: unknown): string {
  if (!personData || typeof personData !== 'object') return '';
  
  const data = personData as Record<string, unknown>;
  
  // Try to get name from various possible fields
  if (data.name && typeof data.name === 'string') {
    return data.name;
  }
  
  if (data.firstName || data.lastName) {
    const firstName = data.firstName as string || '';
    const middleInitial = data.middleInitial as string || '';
    const lastName = data.lastName as string || '';
    
    const nameParts = [firstName, middleInitial, lastName].filter(Boolean);
    return nameParts.join(' ');
  }
  
  return '';
}

/**
 * Extract primary value from search query data
 */
export function getSearchQueryPrimaryValue(searchData: unknown): string {
  if (!searchData || typeof searchData !== 'object') return '';
  
  const data = searchData as Record<string, unknown>;
  
  // For name searches
  if (data.firstName || data.lastName) {
    const firstName = data.firstName as string || '';
    const middleInitial = data.middleInitial as string || '';
    const lastName = data.lastName as string || '';
    
    const nameParts = [firstName, middleInitial, lastName].filter(Boolean);
    return nameParts.join(' ');
  }
  
  // For email searches
  if (data.email && typeof data.email === 'string') {
    return data.email;
  }
  
  // For phone searches
  if (data.phone && typeof data.phone === 'string') {
    return data.phone;
  }
  
  // For address searches
  if (data.street || data.city || data.state || data.zip) {
    return getAddressPrimaryValue({
      street: data.street as string || '',
      city: data.city as string || '',
      state: data.state as string || '',
      zip: data.zip as string || ''
    });
  }
  
  return '';
}

/**
 * Extract primary value from API response data
 */
export function getApiResponsePrimaryValue(nodeData: NodeData): string {
  if (!nodeData.response) return '';
  
  try {
    // For SkipTrace API results, try to get the first person's name
    if (nodeData.apiName === 'Skip Trace') {
      const parsedData = peopleParseService.parsePeopleResponse(
        nodeData.response as Record<string, unknown>, 
        nodeData.mnNodeId
      );
      
      if (parsedData.people && parsedData.people.length > 0) {
        const firstPerson = parsedData.people[0];
        return getPersonPrimaryValue(firstPerson);
      }
    }
    
    // For Zillow API results, use the address
    if (nodeData.apiName === 'Zillow Search') {
      return getAddressPrimaryValue(nodeData.address);
    }
    
    // For other API results, try to extract from raw response
    const response = nodeData.response as Record<string, unknown>;
    
    // Look for common name fields in the response
    if (response.name && typeof response.name === 'string') {
      return response.name;
    }
    
    if (response.firstName || response.lastName) {
      const firstName = response.firstName as string || '';
      const lastName = response.lastName as string || '';
      return [firstName, lastName].filter(Boolean).join(' ');
    }
    
    // Look for address in response
    if (response.address && typeof response.address === 'string') {
      return response.address;
    }
    
    if (response.street || response.city || response.state) {
      return getAddressPrimaryValue({
        street: response.street as string || '',
        city: response.city as string || '',
        state: response.state as string || '',
        zip: response.zip as string || ''
      });
    }
    
  } catch (error) {
    console.warn('Error extracting primary value from API response:', error);
  }
  
  return '';
}

/**
 * Extract primary value from person detail data
 */
export function getPersonDetailPrimaryValue(nodeData: NodeData): string {
  if (!nodeData.personData) return '';
  
  try {
    let parsedData: { entities?: Array<{ type: string; name?: string }>; rawResponse?: unknown };
    
    // Check if personData is already parsed (has entities array)
    if (nodeData.personData && typeof nodeData.personData === 'object' && 'entities' in nodeData.personData) {
      parsedData = nodeData.personData as { entities?: Array<{ type: string; name?: string }>; rawResponse?: unknown };
    } else {
      // Parse the raw person data
      parsedData = personDetailParseService.parsePersonDetailResponse(
        nodeData.personData as Record<string, unknown>, 
        nodeData.mnNodeId
      );
    }
    
    // Look for the main person entity
    const personEntity = parsedData.entities?.find((entity: { type: string; name?: string }) => entity.type === 'person');
    if (personEntity && personEntity.name) {
      return personEntity.name;
    }
    
    // Fallback: look for name in raw response
    const rawResponse = parsedData.rawResponse || nodeData.personData;
    if (rawResponse && typeof rawResponse === 'object') {
      const data = rawResponse as Record<string, unknown>;
      
      // Look for person details
      if (data['Person Details'] && Array.isArray(data['Person Details']) && data['Person Details'].length > 0) {
        const personDetails = data['Person Details'] as Record<string, unknown>[];
        const firstPerson = personDetails[0];
        
        if (firstPerson.name && typeof firstPerson.name === 'string') {
          return firstPerson.name;
        }
        
        if (firstPerson.firstName || firstPerson.lastName) {
          const firstName = firstPerson.firstName as string || '';
          const lastName = firstPerson.lastName as string || '';
          return [firstName, lastName].filter(Boolean).join(' ');
        }
      }
    }
    
  } catch (error) {
    console.warn('Error extracting primary value from person detail data:', error);
  }
  
  return '';
}

/**
 * Generate automatic title for a node based on its data
 */
export function generateNodeTitle(nodeData: NodeData): string {
  // If custom title is already set, use it
  if (nodeData.customTitle) {
    return nodeData.customTitle;
  }
  
  let primaryValue = '';
  
  switch (nodeData.type) {
    case 'userFound':
      // For user location nodes, use the address if available
      if (nodeData.payload?.address) {
        primaryValue = getAddressPrimaryValue(nodeData.payload.address);
      }
      return primaryValue || 'User Location';
      
    case 'start':
      // For start nodes, try to get the search query or address
      if (nodeData.address) {
        primaryValue = getAddressPrimaryValue(nodeData.address);
      }
      
      // If no address, try to get from customTitle (which might contain search type)
      if (!primaryValue && nodeData.customTitle) {
        return nodeData.customTitle;
      }
      
      return primaryValue || 'Search Node';
      
    case 'api-result':
      // For API result nodes, prioritize the address that was searched
      if (nodeData.address) {
        primaryValue = getAddressPrimaryValue(nodeData.address);
      }
      
      // Fallback to extracting from response if no address
      if (!primaryValue) {
        primaryValue = getApiResponsePrimaryValue(nodeData);
      }
      
      return primaryValue || `${nodeData.apiName || 'API'} Result`;
      
    case 'people-result':
      // For person detail nodes, try to extract person name
      primaryValue = getPersonDetailPrimaryValue(nodeData);
      return primaryValue || 'Person Details';
      
    default:
      return 'Unknown Node';
  }
}

/**
 * Check if a node should have its title automatically updated
 */
export function shouldAutoUpdateTitle(nodeData: NodeData): boolean {
  // Don't auto-update if user has set a custom title
  if (nodeData.customTitle) {
    return false;
  }
  
  // Auto-update for completed nodes with data
  if (nodeData.hasCompleted) {
    return true;
  }
  
  // Auto-update for nodes with meaningful data
  switch (nodeData.type) {
    case 'userFound':
      return !!(nodeData.payload?.address);
    case 'start':
      return !!(nodeData.address);
    case 'api-result':
      return !!(nodeData.response || nodeData.address);
    case 'people-result':
      return !!(nodeData.personData);
    default:
      return false;
  }
}
