import { 
  generateNodeTitle, 
  getAddressPrimaryValue, 
  getPersonPrimaryValue, 
  getSearchQueryPrimaryValue,
  shouldAutoUpdateTitle 
} from '../nodeTitleUtils';
import { NodeData } from '@/features/session/services/sessionStorage';

describe('nodeTitleUtils', () => {
  describe('getAddressPrimaryValue', () => {
    it('should format address correctly', () => {
      const address = {
        street: '123 Main St',
        city: 'Minneapolis',
        state: 'MN',
        zip: '55401'
      };
      
      const result = getAddressPrimaryValue(address);
      expect(result).toBe('123 Main St, Minneapolis, MN, 55401');
    });

    it('should handle partial address data', () => {
      const address = {
        street: '123 Main St',
        city: 'Minneapolis',
        state: 'MN',
        zip: ''
      };
      
      const result = getAddressPrimaryValue(address);
      expect(result).toBe('123 Main St, Minneapolis, MN');
    });

    it('should return empty string for undefined address', () => {
      const result = getAddressPrimaryValue(undefined);
      expect(result).toBe('');
    });
  });

  describe('getPersonPrimaryValue', () => {
    it('should extract name from person data', () => {
      const personData = {
        name: 'John Doe',
        age: 30
      };
      
      const result = getPersonPrimaryValue(personData);
      expect(result).toBe('John Doe');
    });

    it('should construct name from firstName and lastName', () => {
      const personData = {
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      };
      
      const result = getPersonPrimaryValue(personData);
      expect(result).toBe('John Doe');
    });

    it('should handle middle initial', () => {
      const personData = {
        firstName: 'John',
        middleInitial: 'A',
        lastName: 'Doe'
      };
      
      const result = getPersonPrimaryValue(personData);
      expect(result).toBe('John A Doe');
    });
  });

  describe('getSearchQueryPrimaryValue', () => {
    it('should extract name from search data', () => {
      const searchData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };
      
      const result = getSearchQueryPrimaryValue(searchData);
      expect(result).toBe('Jane Smith');
    });

    it('should extract email from search data', () => {
      const searchData = {
        email: 'jane@example.com'
      };
      
      const result = getSearchQueryPrimaryValue(searchData);
      expect(result).toBe('jane@example.com');
    });

    it('should extract phone from search data', () => {
      const searchData = {
        phone: '555-123-4567'
      };
      
      const result = getSearchQueryPrimaryValue(searchData);
      expect(result).toBe('555-123-4567');
    });
  });

  describe('generateNodeTitle', () => {
    it('should use custom title if available', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'start',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        customTitle: 'Custom Title'
      };
      
      const result = generateNodeTitle(nodeData);
      expect(result).toBe('Custom Title');
    });

    it('should generate title for userFound node with address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'userFound',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        payload: {
          coords: { lat: 44.9778, lng: -93.2650 },
          address: {
            street: '123 Main St',
            city: 'Minneapolis',
            state: 'MN',
            zip: '55401'
          }
        }
      };
      
      const result = generateNodeTitle(nodeData);
      expect(result).toBe('123 Main St, Minneapolis, MN, 55401');
    });

    it('should generate title for start node with address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'start',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        address: {
          street: '456 Oak Ave',
          city: 'St Paul',
          state: 'MN',
          zip: '55101'
        }
      };
      
      const result = generateNodeTitle(nodeData);
      expect(result).toBe('456 Oak Ave, St Paul, MN, 55101');
    });

    it('should fallback to default for start node without address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'start',
        timestamp: Date.now(),
        mnNodeId: 'test-id'
      };
      
      const result = generateNodeTitle(nodeData);
      expect(result).toBe('Search Node');
    });

    it('should generate title for api-result node with address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'api-result',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        apiName: 'Skip Trace',
        address: {
          street: '789 Pine St',
          city: 'Duluth',
          state: 'MN',
          zip: '55801'
        },
        response: { people: [{ name: 'Jane Smith' }] }
      };
      
      const result = generateNodeTitle(nodeData);
      expect(result).toBe('789 Pine St, Duluth, MN, 55801');
    });
  });

  describe('shouldAutoUpdateTitle', () => {
    it('should not auto-update if custom title exists', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'start',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        customTitle: 'Custom Title'
      };
      
      const result = shouldAutoUpdateTitle(nodeData);
      expect(result).toBe(false);
    });

    it('should auto-update completed nodes with data', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'api-result',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        hasCompleted: true,
        response: { people: [{ name: 'John Doe' }] }
      };
      
      const result = shouldAutoUpdateTitle(nodeData);
      expect(result).toBe(true);
    });

    it('should auto-update api-result nodes with address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'api-result',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        address: {
          street: '123 Main St',
          city: 'Minneapolis',
          state: 'MN',
          zip: '55401'
        }
      };
      
      const result = shouldAutoUpdateTitle(nodeData);
      expect(result).toBe(true);
    });

    it('should auto-update userFound nodes with address', () => {
      const nodeData: NodeData = {
        id: 'test-node',
        type: 'userFound',
        timestamp: Date.now(),
        mnNodeId: 'test-id',
        payload: {
          coords: { lat: 44.9778, lng: -93.2650 },
          address: {
            street: '123 Main St',
            city: 'Minneapolis',
            state: 'MN',
            zip: '55401'
          }
        }
      };
      
      const result = shouldAutoUpdateTitle(nodeData);
      expect(result).toBe(true);
    });
  });
});
