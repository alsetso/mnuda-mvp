'use client';

import { PersonRecord } from '@/lib/peopleParse';
import { apiService } from '@/lib/apiService';
import { useToast } from '@/hooks/useToast';

interface PersonListNodeProps {
  records: PersonRecord[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string) => void;
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
    <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h4 className="text-sm font-semibold text-gray-800">Person List</h4>
        <div className="text-xs text-gray-400">
          {records.length} record{records.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {records.map((person, index) => (
          <PersonCard key={`person-${index}`} person={person} onPersonTrace={onPersonTrace} />
        ))}
      </div>
    </div>
  );
}

// Individual person card component
function PersonCard({ person, onPersonTrace }: { person: PersonRecord; onPersonTrace?: (personId: string, personData: unknown, apiName: string) => void }) {
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
    <div className="w-full bg-gray-50 p-2.5 sm:p-3 rounded border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex-1 min-w-0">
          <h6 className="text-sm font-semibold text-gray-800 mb-1 truncate">{person.name}</h6>
          <div className="space-y-0.5">
            {person.age && (
              <div className="text-xs text-gray-600">
                <span className="text-gray-500">Age:</span> {person.age}
              </div>
            )}
            {person.lives_in && (
              <div className="text-xs text-gray-600 truncate">
                <span className="text-gray-500">Lives in:</span> {person.lives_in}
              </div>
            )}
            {person.used_to_live_in && (
              <div className="text-xs text-gray-600 truncate">
                <span className="text-gray-500">Used to live in:</span> {person.used_to_live_in}
              </div>
            )}
            {person.related_to && (
              <div className="text-xs text-gray-600 truncate">
                <span className="text-gray-500">Related to:</span> {person.related_to}
              </div>
            )}
            {person.person_id && (
              <div className="text-xs text-gray-500 font-mono truncate">
                ID: {person.person_id}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {person.person_link && (
            <a
              href={person.person_link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors touch-manipulation"
              title="View person details"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          <button
            onClick={handleTrace}
            disabled={!person.person_id}
            className="px-3 py-1.5 text-xs font-medium text-[#1dd1f5] bg-white border border-[#1dd1f5]/30 rounded hover:bg-[#1dd1f5]/10 focus:outline-none focus:ring-1 focus:ring-[#1dd1f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[32px]"
          >
            Trace
          </button>
        </div>
      </div>
    </div>
  );
}
