'use client';

import { useState } from 'react';
import { PersonRecord } from '@/lib/peopleParse';
import { apiService } from '@/lib/apiService';
import { useToast } from '@/hooks/useToast';

interface PersonListNodeProps {
  records: PersonRecord[];
  onPersonTrace?: (personId: string, personData: any, apiName: string) => void;
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
    <div className="px-6 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800">Person List</h4>
        <div className="text-xs text-gray-400">
          {records.length} total record{records.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {records.map((person, index) => (
          <PersonCard key={`person-${index}`} person={person} onPersonTrace={onPersonTrace} />
        ))}
      </div>
    </div>
  );
}

// Individual person card component
function PersonCard({ person, onPersonTrace }: { person: PersonRecord; onPersonTrace?: (personId: string, personData: any, apiName: string) => void }) {
  const { withApiToast } = useToast();

  const handleTrace = async () => {
    if (!person.person_id || !onPersonTrace) {
      console.log('No person ID or callback available');
      return;
    }

    try {
      console.log('Tracing person:', person.name, 'with ID:', person.person_id);
      const personData = await withApiToast(
        'Person Details Lookup',
        () => apiService.callPersonAPI(person.person_id!),
        {
          loadingMessage: `Tracing person: ${person.name}`,
          successMessage: 'Person details retrieved successfully',
          errorMessage: 'Failed to retrieve person details'
        }
      );
      onPersonTrace(person.person_id, personData, 'Person Details');
    } catch (error) {
      console.error('Error tracing person:', error);
    }
  };

  return (
    <div className="w-full bg-transparent p-3 rounded border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h6 className="text-sm font-semibold text-gray-800 mb-1.5">{person.name}</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5 text-xs text-gray-500">
            {person.age && (
              <div>
                <span className="font-medium text-gray-400">Age:</span> <span className="text-gray-600">{person.age}</span>
              </div>
            )}
            {person.lives_in && (
              <div>
                <span className="font-medium text-gray-400">Lives in:</span> <span className="text-gray-600">{person.lives_in}</span>
              </div>
            )}
            {person.used_to_live_in && (
              <div>
                <span className="font-medium text-gray-400">Used to live in:</span> <span className="text-gray-600">{person.used_to_live_in}</span>
              </div>
            )}
            {person.related_to && (
              <div>
                <span className="font-medium text-gray-400">Related to:</span> <span className="text-gray-600">{person.related_to}</span>
              </div>
            )}
            {person.person_id && (
              <div>
                <span className="font-medium text-gray-400">ID:</span> 
                <span className="font-mono ml-1 text-gray-600">{person.person_id}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {person.person_link && (
            <a
              href={person.person_link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
              title="View person details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
                  <button
                    onClick={handleTrace}
                    disabled={!person.person_id}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trace
                  </button>
        </div>
      </div>
    </div>
  );
}
