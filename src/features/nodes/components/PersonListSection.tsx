'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import EntityCard from './EntityCard';

interface PersonListSectionProps {
  records: PersonRecord[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
}

export default function PersonListSection({ records, onPersonTrace }: PersonListSectionProps) {
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
          <div key={`person-${index}`} className="flex items-center space-x-2">
            <div className="flex-1">
              <EntityCard entity={person} onPersonTrace={onPersonTrace} />
            </div>
            <div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
              {person.mnEntityId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

