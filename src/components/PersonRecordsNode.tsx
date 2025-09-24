'use client';

import { useState } from 'react';
import { PersonRecord } from '@/lib/peopleParse';
import { apiService } from '@/lib/apiService';

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
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Person List</h4>
        <div className="text-xs text-gray-500">
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
  const [isLoading, setIsLoading] = useState(false);

  const handleTrace = async () => {
    if (!person.person_id || !onPersonTrace) {
      console.log('No person ID or callback available');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Tracing person:', person.name, 'with ID:', person.person_id);
      const personData = await apiService.callPersonAPI(person.person_id);
      onPersonTrace(person.person_id, personData, 'Person Details');
    } catch (error) {
      console.error('Error tracing person:', error);
      // You could add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h6 className="text-sm font-medium text-gray-900 mb-2">{person.name}</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600">
            {person.age && (
              <div>
                <span className="font-medium">Age:</span> {person.age}
              </div>
            )}
            {person.lives_in && (
              <div>
                <span className="font-medium">Lives in:</span> {person.lives_in}
              </div>
            )}
            {person.used_to_live_in && (
              <div>
                <span className="font-medium">Used to live in:</span> {person.used_to_live_in}
              </div>
            )}
            {person.related_to && (
              <div>
                <span className="font-medium">Related to:</span> {person.related_to}
              </div>
            )}
            {person.person_id && (
              <div>
                <span className="font-medium">ID:</span> 
                <span className="font-mono ml-1">{person.person_id}</span>
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
            disabled={!person.person_id || isLoading}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Tracing...' : 'Trace'}
          </button>
        </div>
      </div>
    </div>
  );
}
