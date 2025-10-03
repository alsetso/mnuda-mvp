'use client';

import { useState, useRef, useEffect } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';
import { useApiUsageContext } from '@/features/session/contexts/ApiUsageContext';

interface AddNodeProps {
  onAddNode: (node: NodeData) => void;
  onNodeCreated?: (nodeId: string) => void; // Callback to handle scrolling to newly created node
  disabled?: boolean;
}

interface NodeTypeOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: 'name' | 'email' | 'phone' | 'address' | 'zillow';
}

const NODE_TYPE_OPTIONS: NodeTypeOption[] = [
  {
    id: 'name',
    label: 'Name Search',
    description: 'Search by first name, middle initial, last name',
    icon: '👤',
    type: 'name'
  },
  {
    id: 'email',
    label: 'Email Search',
    description: 'Search by email address',
    icon: '📧',
    type: 'email'
  },
  {
    id: 'phone',
    label: 'Phone Search',
    description: 'Search by phone number',
    icon: '📞',
    type: 'phone'
  },
  {
    id: 'address',
    label: 'Address Search',
    description: 'Search by street, city, state, zip',
    icon: '🏠',
    type: 'address'
  },
  {
    id: 'zillow',
    label: 'Zillow Search',
    description: 'Search property by address',
    icon: '🏘️',
    type: 'zillow'
  }
];

export default function AddNode({ onAddNode, onNodeCreated, disabled = false }: AddNodeProps) {
  const { apiUsage, showCreditsModal } = useApiUsageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if credits are exhausted
  const isCreditsExhausted = apiUsage?.isLimitReached || false;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger shake animation when credits are exhausted
  useEffect(() => {
    if (isCreditsExhausted) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 600); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isCreditsExhausted]);

  const handleButtonClick = () => {
    if (isCreditsExhausted) {
      showCreditsModal();
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = async (option: NodeTypeOption) => {
    // Check credits before creating node
    if (isCreditsExhausted) {
      showCreditsModal();
      setIsOpen(false);
      return;
    }

    try {
      const nodeId = `${option.type}-${Date.now()}`;
      
      // Create the appropriate node based on type
      const newNode: NodeData = {
        id: nodeId,
        type: 'start', // All input nodes start as 'start' type
        timestamp: Date.now(),
        hasCompleted: false,
        mnNodeId: MnudaIdService.generateTypedId('node'),
        customTitle: option.label,
        // Store node type in customTitle for the input component to use
        // Note: payload is reserved for UserFoundNode coordinates
      };

      // Add empty address structure for address-based searches
      if (option.type === 'address' || option.type === 'zillow') {
        newNode.address = {
          street: '',
          city: '',
          state: '',
          zip: ''
        };
      }

      // Create the node
      onAddNode(newNode);
      
      // Notify parent to scroll to the new node
      if (onNodeCreated) {
        onNodeCreated(nodeId);
      }
      
      // Close dropdown
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };


  return (
    <div className="relative">
      {/* Add Node Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={disabled}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-200
          ${isShaking ? 'credit-shake' : ''}
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : isCreditsExhausted
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-md ring-2 ring-red-300'
              : 'bg-[#1dd1f5] hover:bg-[#014463] text-white shadow-md'
          }
        `}
        title={isCreditsExhausted ? "Credits exhausted - click to view options" : "Add new search node"}
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-14 left-0 w-72 bg-white rounded-md shadow-lg border border-gray-100 z-50"
        >
          <div className="py-2">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Add Search Node</h3>
            </div>
            <div className="py-1">
              {NODE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
