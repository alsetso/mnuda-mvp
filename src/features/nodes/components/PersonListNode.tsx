'use client';

import { useState } from 'react';
import { PersonRecord } from '@/features/api/services/peopleParse';
import { apiService } from '@/features/api/services/apiService';
import { useToast } from '@/features/ui/hooks/useToast';

interface PersonListNodeProps {
  records: PersonRecord[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
}

export default function PersonListNode({ records, onPersonTrace }: PersonListNodeProps) {
  if (!records || records.length === 0) {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No person records found</p>
        </div>
      </div>
    );
  }

  return (
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-sm font-semibold text-gray-800">Person List</h4>
          <div className="text-xs text-gray-400">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-1.5">
        {records.map((person, index) => (
          <PersonCard key={`person-${index}`} person={person} onPersonTrace={onPersonTrace} />
        ))}
      </div>
    </div>
  );
}

// Individual person card component
function PersonCard({ person, onPersonTrace }: { person: PersonRecord; onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void }) {
  const { withApiToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTrace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!person.apiPersonId || !onPersonTrace) {
      console.log('No API person ID or callback available');
      return;
    }

    try {
      console.log('Tracing person:', person.name, 'with API ID:', person.apiPersonId);
      const personData = await withApiToast(
        'Person Details Lookup',
        () => apiService.callPersonAPI(person.apiPersonId!),
        {
          loadingMessage: `Tracing person: ${person.name}`,
          successMessage: 'Person details retrieved successfully',
          errorMessage: 'Failed to retrieve person details'
        }
      );
      console.log('PersonListNode calling onPersonTrace with:', {
        personId: person.apiPersonId,
        apiName: 'Person Details',
        parentNodeId: person.parentNodeId,
        entityId: person.mnEntityId,
        entityData: person,
        source: 'PersonListNode'
      });
      onPersonTrace(person.apiPersonId, personData, 'Person Details', person.parentNodeId, person.mnEntityId, person);
    } catch (error) {
      console.error('Error tracing person:', error);
    }
  };

  return (
    <>
      <div 
        className="group relative px-2 sm:px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Horizontal single-row layout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {/* Person type badge */}
            <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium flex-shrink-0 bg-blue-100 text-blue-800">
              <span className="hidden sm:inline">Person</span>
              <span className="sm:hidden">P</span>
            </span>
            
            {/* Primary value - person name */}
            <div className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1">
              {person.name}
            </div>
            
            {/* Entity ID for traceable entities - hidden on mobile */}
            {person.mnEntityId && (
              <div className="text-xs text-purple-600 font-mono flex-shrink-0 hidden sm:block">
                {person.mnEntityId}
              </div>
            )}
          </div>
          
          {/* External Link Button (keep this one) */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3 flex-shrink-0">
            {person.person_link && (
              <a
                href={person.person_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                title="View person details"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Modal with all details */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm px-3 py-1 rounded font-medium bg-blue-100 text-blue-800">
                    Person
                  </span>
                  <span className="text-sm text-gray-500">{person.source}</span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Primary value */}
              <div className="text-lg font-semibold text-gray-800 mb-4">
                {person.name}
              </div>

              {/* Entity ID */}
              {person.mnEntityId && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-1">Entity ID</div>
                  <div className="text-sm font-mono text-purple-700">{person.mnEntityId}</div>
                </div>
              )}

              {/* All person data */}
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-800">Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {person.age && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Age</span>
                      <span className="text-gray-800 mt-1">{person.age}</span>
                    </div>
                  )}
                  {person.lives_in && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Lives In</span>
                      <span className="text-gray-800 mt-1">{person.lives_in}</span>
                    </div>
                  )}
                  {person.used_to_live_in && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Used To Live In</span>
                      <span className="text-gray-800 mt-1">{person.used_to_live_in}</span>
                    </div>
                  )}
                  {person.related_to && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Related To</span>
                      <span className="text-gray-800 mt-1">{person.related_to}</span>
                    </div>
                  )}
                  {person.apiPersonId && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">API Person ID</span>
                      <span className="text-gray-800 mt-1 font-mono">{person.apiPersonId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Entity context for traceable entities */}
              {person.mnEntityId && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 mb-2">🔗 Entity Context</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Parent Node:</span>
                      <span className="ml-2 font-mono text-gray-800">{person.parentNodeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Source:</span>
                      <span className="ml-2 text-gray-800">{person.source}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                {person.person_link && (
                  <a
                    href={person.person_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors"
                  >
                    View External
                  </a>
                )}
                <button
                  onClick={handleTrace}
                  disabled={!person.apiPersonId}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trace Person
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
