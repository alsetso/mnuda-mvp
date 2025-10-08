import React, { useState } from 'react';

interface Person {
  name: string;
  age?: number;
  relationship?: string;
  id: string;
}

interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zip?: string;
  ownerCount: number;
  acreage?: string;
  people: Person[];
}

interface PropertyPanelProps {
  property: PropertyDetails | null;
  isVisible: boolean;
  onClose: () => void;
  onPersonClick: (person: Person) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  property,
  isVisible,
  onClose,
  onPersonClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFull, setIsFull] = useState(false);

  if (!property || !isVisible) return null;

  const handlePersonClick = (person: Person) => {
    onPersonClick(person);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (isFull) setIsFull(false);
  };

  const toggleFull = () => {
    setIsFull(!isFull);
  };

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      bg-white border-t border-gray-200 shadow-lg
      transition-all duration-300 ease-in-out
      ${isExpanded ? (isFull ? 'h-3/4' : 'h-96') : 'h-16'}
    `}>
      {/* Property Summary Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {property.address}, {property.city}, {property.state}
            </h3>
            <p className="text-xs text-gray-500">
              {property.ownerCount} property owner{property.ownerCount !== 1 ? 's' : ''}
              {property.acreage && ` • ${property.acreage}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-gray-200 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* People List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 text-sm">Property Owners</h4>
              {property.people.length > 3 && (
                <button
                  onClick={toggleFull}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {isFull ? 'Show Less' : 'Show All'}
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {property.people.slice(0, isFull ? property.people.length : 3).map((person) => (
                <div
                  key={person.id}
                  onClick={() => handlePersonClick(person)}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 text-sm truncate">
                      {person.name}
                    </h5>
                    <p className="text-xs text-gray-500 truncate">
                      {person.age && `${person.age} years old`}
                      {person.relationship && ` • ${person.relationship}`}
                    </p>
                  </div>
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
              
              {!isFull && property.people.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-500">
                    +{property.people.length - 3} more owner{property.people.length - 3 !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
