'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import EntityCard from './EntityCard';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';

interface PersonListSectionProps {
  records: PersonRecord[];
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onEntityClick?: (entity: PersonRecord | PersonDetailEntity) => void;
}

export default function PersonListSection({ records, onPersonTrace, onEntityClick }: PersonListSectionProps) {
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
          <h4 className="text-sm font-semibold text-gray-900">Person List</h4>
          <div className="text-xs text-gray-500">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-1.5">
        {records.map((person, index) => (
          <EntityCard key={`person-${index}`} entity={person} onPersonTrace={onPersonTrace} onEntityClick={onEntityClick} />
        ))}
      </div>
    </div>
  );
}

