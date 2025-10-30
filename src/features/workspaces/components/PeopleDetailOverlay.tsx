'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, PhoneIcon, EnvelopeIcon, UserGroupIcon, MapPinIcon, HomeIcon, UserIcon } from '@heroicons/react/24/outline';
import { PeopleRecord } from '../services/peopleRecordsService';
import { propertiesService, Property } from '../services/propertiesService';
import { apiService } from '@/features/api/services/apiService';
import { skipTracePersonParser } from '@/features/api/services/skipTracePersonParser';
import { peopleRecordsService } from '../services/peopleRecordsService';

interface PeopleDetailOverlayProps {
  peopleRecord: PeopleRecord | null;
  onClose: () => void;
  onSave?: (id: string, data: Partial<PeopleRecord>) => Promise<void>;
  isOpen: boolean;
}

type TabType = 'details';

export function PeopleDetailOverlay({ peopleRecord, onClose, onSave, isOpen }: PeopleDetailOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [formData, setFormData] = useState<Partial<PeopleRecord>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [tracingRecordId, setTracingRecordId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [currentRecord, setCurrentRecord] = useState<PeopleRecord | null>(null);

  // Initialize form data when people record changes
  useEffect(() => {
    if (peopleRecord) {
      setCurrentRecord(peopleRecord);
      setFormData({
        full_name: peopleRecord.full_name || '',
        email: peopleRecord.email || '',
        phone: peopleRecord.phone || '',
        relationship_to_property: peopleRecord.relationship_to_property || '',
        data_source: peopleRecord.data_source || '',
        person_id: peopleRecord.person_id || '',
        person_link: peopleRecord.person_link || '',
        age: peopleRecord.age || null,
        lives_in: peopleRecord.lives_in || '',
        used_to_live_in: peopleRecord.used_to_live_in || '',
        related_to: peopleRecord.related_to || ''
      });
      setHasChanges(false);

      // Load associated property
      if (peopleRecord.property_id) {
        loadProperty(peopleRecord.property_id);
      }
    }
  }, [peopleRecord]);

  const loadProperty = async (propertyId: string) => {
    setIsLoadingProperty(true);
    try {
      const loadedProperty = await propertiesService.getProperty(propertyId);
      setProperty(loadedProperty);
    } catch (error) {
      console.error('Error loading property:', error);
      setProperty(null);
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const handleInputChange = (field: keyof PeopleRecord, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentRecord || !onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      await onSave(currentRecord.id, formData);
      setHasChanges(false);
      // Update current record after save
      if (currentRecord) {
        setCurrentRecord({ ...currentRecord, ...formData } as PeopleRecord);
      }
    } catch (error) {
      console.error('Error saving people record:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to format phone numbers
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Helper function to copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSkipTrace = async () => {
    if (!currentRecord?.person_id) return;
    
    setTracingRecordId(currentRecord.id);
    try {
      const raw = await apiService.callPersonAPI(currentRecord.person_id);
      // Persist raw person details
      const updated = await peopleRecordsService.saveSkipTracePersonDetails(currentRecord.id, raw as Record<string, unknown>);
      // Update current record
      setCurrentRecord({ ...currentRecord, raw_skip_trace_response: updated.raw_skip_trace_response });
      // Trigger parent refresh by calling onSave if available
      if (onSave) {
        await onSave(currentRecord.id, { raw_skip_trace_response: updated.raw_skip_trace_response });
      }
    } catch (error) {
      console.error('Error running skip trace:', error);
      alert('Failed to run skip trace for this person');
    } finally {
      setTracingRecordId(null);
    }
  };

  if (!isOpen || !currentRecord) return null;

  const parsedData = currentRecord.raw_skip_trace_response 
    ? skipTracePersonParser.parsePersonResponse(currentRecord.raw_skip_trace_response)
    : null;
  
  const hasSkipTraceDetails = parsedData && (
    parsedData.personDetails.length > 0 ||
    parsedData.relatives.length > 0 ||
    parsedData.associates.length > 0 ||
    parsedData.emails.length > 0 ||
    parsedData.phones.length > 0 ||
    parsedData.currentAddresses.length > 0 ||
    parsedData.previousAddresses.length > 0
  );

  return (
    <>
      {/* Backdrop - Only on mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Overlay Panel */}
      <div className={`
        absolute top-0 right-0 bottom-10 z-50 bg-white border-l border-gray-200
        w-full md:w-1/2
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">People Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'details'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Details
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollable-hidden">
          {activeTab === 'details' && (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }} id="people-detail-form">
              {/* Personal Information */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 35"
                  />
                </div>
              </div>

              {/* Property Relationship */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Property Relationship</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship to Property</label>
                  <select
                    value={formData.relationship_to_property || ''}
                    onChange={(e) => handleInputChange('relationship_to_property', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select relationship...</option>
                    <option value="owner">Owner</option>
                    <option value="resident">Resident</option>
                    <option value="tenant">Tenant</option>
                    <option value="relative">Relative</option>
                    <option value="contact">Contact</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {currentRecord.property_id && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Associated Property</label>
                    {isLoadingProperty ? (
                      <div className="text-xs text-gray-500 py-1">Loading property...</div>
                    ) : property ? (
                      <div className="px-2 py-1.5 border border-gray-300 rounded bg-gray-50 text-xs text-gray-900">
                        {property.full_address}
                      </div>
                    ) : (
                      <div className="px-2 py-1.5 border border-gray-300 rounded bg-gray-50 text-xs text-gray-500">
                        Property ID: {currentRecord.property_id}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location Information */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Location Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lives In</label>
                  <input
                    type="text"
                    value={formData.lives_in || ''}
                    onChange={(e) => handleInputChange('lives_in', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Minneapolis, MN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Used to Live In</label>
                  <input
                    type="text"
                    value={formData.used_to_live_in || ''}
                    onChange={(e) => handleInputChange('used_to_live_in', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Saint Paul, MN"
                  />
                </div>
              </div>

              {/* Related Information */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Related Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Related To</label>
                  <input
                    type="text"
                    value={formData.related_to || ''}
                    onChange={(e) => handleInputChange('related_to', e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              {/* API Information */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">API Information</h3>
                
                {currentRecord.person_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Person ID</label>
                    <input
                      type="text"
                      value={currentRecord.person_id || ''}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                )}

                {currentRecord.person_link && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Person Link</label>
                    <a
                      href={currentRecord.person_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}

                {currentRecord.data_source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Source</label>
                    <div className="text-sm text-gray-900 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50">
                      {currentRecord.data_source}
                    </div>
                  </div>
                )}
              </div>

              {/* Skip Trace Section */}
              {currentRecord.person_id && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    {currentRecord.raw_skip_trace_response ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        ✓ Skip trace completed
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No skip trace data</span>
                    )}
                    <button
                      type="button"
                      onClick={handleSkipTrace}
                      disabled={!!tracingRecordId}
                      className="px-2 py-1 text-xs font-medium text-white bg-[#014463] rounded hover:bg-[#013347] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={currentRecord.raw_skip_trace_response ? 'Re-trace to update data' : 'Run skip trace'}
                    >
                      {tracingRecordId ? 'Tracing...' : currentRecord.raw_skip_trace_response ? 'Re-trace' : 'Skip Trace'}
                    </button>
                  </div>

                  {/* Skip Trace Response Dropdown */}
                  {currentRecord.raw_skip_trace_response && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleSection('skip-trace')}
                        className="w-full flex items-center justify-between px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <span className="text-xs font-semibold text-[#014463] flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" />
                          Skip Trace Details
                          {hasSkipTraceDetails && <span className="text-green-600">({
                            (parsedData?.personDetails.length || 0) +
                            (parsedData?.relatives.length || 0) +
                            (parsedData?.associates.length || 0) +
                            (parsedData?.emails.length || 0) +
                            (parsedData?.phones.length || 0) +
                            (parsedData?.currentAddresses.length || 0) +
                            (parsedData?.previousAddresses.length || 0)
                          } items)</span>}
                        </span>
                        {expandedSections.has('skip-trace') ? (
                          <ChevronUpIcon className="w-3.5 h-3.5 text-[#014463]" />
                        ) : (
                          <ChevronDownIcon className="w-3.5 h-3.5 text-[#014463]" />
                        )}
                      </button>

                      {expandedSections.has('skip-trace') && parsedData && (
                        <div className="mt-2 space-y-2">
                          {!hasSkipTraceDetails ? (
                            <div className="text-center py-3 text-xs text-gray-500 bg-white rounded border border-gray-200">
                              No additional details available
                            </div>
                          ) : (
                            <>
                              {/* Person Details */}
                              {parsedData.personDetails.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('person-details')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                                      Person Details ({parsedData.personDetails.length})
                                    </span>
                                    {expandedSections.has('person-details') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('person-details') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.personDetails.map((detail, idx) => (
                                        <div key={idx} className="text-xs space-y-1 border-b border-gray-200 pb-1.5 last:border-b-0 last:pb-0">
                                          {detail.personName && <div><span className="font-medium">Name:</span> {detail.personName}</div>}
                                          {detail.age && <div><span className="font-medium">Age:</span> {detail.age}</div>}
                                          {detail.born && <div><span className="font-medium">Born:</span> {detail.born}</div>}
                                          {detail.livesIn && <div><span className="font-medium">Lives in:</span> {detail.livesIn}</div>}
                                          {detail.telephone && (
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <span className="font-medium">Phone:</span>{' '}
                                                <a href={`tel:${detail.telephone}`} className="text-blue-600 hover:underline">
                                                  {formatPhoneNumber(detail.telephone)}
                                                </a>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => copyToClipboard(detail.telephone, 'Phone')}
                                                className="p-0.5 text-gray-400 hover:text-gray-600"
                                                title="Copy phone"
                                              >
                                                <ClipboardDocumentIcon className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Email Addresses */}
                              {parsedData.emails.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('emails')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <EnvelopeIcon className="w-3.5 h-3.5 text-green-600" />
                                      Email Addresses ({parsedData.emails.length})
                                    </span>
                                    {expandedSections.has('emails') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('emails') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-1">
                                      {parsedData.emails.map((email, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(email, 'Email')}
                                            className="p-0.5 text-gray-400 hover:text-gray-600"
                                            title="Copy email"
                                          >
                                            <ClipboardDocumentIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Phone Numbers */}
                              {parsedData.phones.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('phones')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <PhoneIcon className="w-3.5 h-3.5 text-purple-600" />
                                      Phone Numbers ({parsedData.phones.length})
                                    </span>
                                    {expandedSections.has('phones') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('phones') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.phones.map((phone, idx) => (
                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <a href={`tel:${phone.phoneNumber}`} className="font-medium text-blue-600 hover:underline">
                                              {formatPhoneNumber(phone.phoneNumber)}
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => copyToClipboard(phone.phoneNumber, 'Phone')}
                                              className="p-0.5 text-gray-400 hover:text-gray-600"
                                              title="Copy phone"
                                            >
                                              <ClipboardDocumentIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div className="text-gray-600 space-y-0.5">
                                            {phone.phoneType && <div>Type: {phone.phoneType}</div>}
                                            {phone.provider && <div>Provider: {phone.provider}</div>}
                                            {phone.lastReported && <div>Last Reported: {phone.lastReported}</div>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Relatives */}
                              {parsedData.relatives.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('relatives')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <UserGroupIcon className="w-3.5 h-3.5 text-orange-600" />
                                      Relatives ({parsedData.relatives.length})
                                    </span>
                                    {expandedSections.has('relatives') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('relatives') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.relatives.map((relative, idx) => (
                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0">
                                          <div className="font-medium">{relative.name}</div>
                                          <div className="text-gray-600 space-y-0.5">
                                            {relative.age && <div>Age: {relative.age}</div>}
                                            {relative.personId && <div>ID: {relative.personId}</div>}
                                            {relative.personLink && (
                                              <div>
                                                <a href={relative.personLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                  View Details
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Associates */}
                              {parsedData.associates.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('associates')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <UserGroupIcon className="w-3.5 h-3.5 text-cyan-600" />
                                      Associates ({parsedData.associates.length})
                                    </span>
                                    {expandedSections.has('associates') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('associates') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.associates.map((associate, idx) => (
                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0">
                                          <div className="font-medium">{associate.name}</div>
                                          <div className="text-gray-600 space-y-0.5">
                                            {associate.age && <div>Age: {associate.age}</div>}
                                            {associate.personId && <div>ID: {associate.personId}</div>}
                                            {associate.personLink && (
                                              <div>
                                                <a href={associate.personLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                  View Details
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Current Addresses */}
                              {parsedData.currentAddresses.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('current-addresses')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <HomeIcon className="w-3.5 h-3.5 text-indigo-600" />
                                      Current Addresses ({parsedData.currentAddresses.length})
                                    </span>
                                    {expandedSections.has('current-addresses') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('current-addresses') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.currentAddresses.map((address, idx) => (
                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0">
                                          <div className="font-medium">{address.streetAddress}</div>
                                          <div className="text-gray-600">
                                            {address.addressLocality}, {address.addressRegion} {address.postalCode}
                                            {address.county && <div>County: {address.county}</div>}
                                            {address.dateRange && <div>Date Range: {address.dateRange}</div>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Previous Addresses */}
                              {parsedData.previousAddresses.length > 0 && (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection('previous-addresses')}
                                    className="w-full px-2 py-1.5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                      <MapPinIcon className="w-3.5 h-3.5 text-gray-600" />
                                      Previous Addresses ({parsedData.previousAddresses.length})
                                    </span>
                                    {expandedSections.has('previous-addresses') ? (
                                      <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  {expandedSections.has('previous-addresses') && (
                                    <div className="px-2 py-1.5 bg-gray-50 space-y-2">
                                      {parsedData.previousAddresses.map((address, idx) => (
                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0">
                                          <div className="font-medium">{address.streetAddress}</div>
                                          <div className="text-gray-600">
                                            {address.addressLocality}, {address.addressRegion} {address.postalCode}
                                            {address.county && <div>County: {address.county}</div>}
                                            {address.timespan && <div>Timespan: {address.timespan}</div>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Metadata</h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-900 mt-0.5">
                      {new Date(currentRecord.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p className="text-gray-900 mt-0.5">
                      {new Date(currentRecord.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Action Buttons - Sticky at bottom */}
        {hasChanges && onSave && (
          <div className="flex items-center justify-end space-x-3 px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => {
                if (currentRecord) {
                  setFormData({
                    full_name: currentRecord.full_name || '',
                    email: currentRecord.email || '',
                    phone: currentRecord.phone || '',
                    relationship_to_property: currentRecord.relationship_to_property || '',
                    data_source: currentRecord.data_source || '',
                    person_id: currentRecord.person_id || '',
                    person_link: currentRecord.person_link || '',
                    age: currentRecord.age || null,
                    lives_in: currentRecord.lives_in || '',
                    used_to_live_in: currentRecord.used_to_live_in || '',
                    related_to: currentRecord.related_to || ''
                  });
                  setHasChanges(false);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

