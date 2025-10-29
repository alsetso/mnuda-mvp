'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon, TrashIcon, PencilIcon, DocumentIcon, ArrowDownTrayIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Property, UpdatePropertyData } from '../services/propertiesService';
import { propertyNotesService, PropertyNote } from '../services/propertyNotesService';
import { propertyDocsService, PropertyDoc } from '../services/propertyDocsService';
import { peopleRecordsService, PeopleRecord } from '../services/peopleRecordsService';
import { apiService } from '@/features/api/services/apiService';
import { skipTracePersonParser, PersonResponse } from '@/features/api/services/skipTracePersonParser';
import { useAuth } from '@/features/auth/contexts/AuthContext';

const STATUS_OPTIONS = [
  'Preforeclosure', 'Foreclosure', 'Foreclosed', 'Auction', 'Redemption',
  'Bank Owned', 'Short Sale', 'Subject To', 'Deed In Lieu', 'Leaseback',
  'For Sale By Owner', 'Listed On MLS', 'Under Contract', 'Sold', 'Off Market'
];

interface PropertyDetailOverlayProps {
  property: Property | null;
  onClose: () => void;
  onSave: (id: string, data: UpdatePropertyData) => Promise<void>;
  isOpen: boolean;
}

type TabType = 'details' | 'notes' | 'docs' | 'api' | 'people';

export function PropertyDetailOverlay({ property, onClose, onSave, isOpen }: PropertyDetailOverlayProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [formData, setFormData] = useState<UpdatePropertyData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Docs state
  const [docs, setDocs] = useState<PropertyDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API state
  const [isFetchingPeople, setIsFetchingPeople] = useState(false);
  const [peopleData, setPeopleData] = useState<unknown>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [expandedPersonIds, setExpandedPersonIds] = useState<Set<string>>(new Set());
  const [savedPersonIds, setSavedPersonIds] = useState<Set<string>>(new Set());
  const [savingPersonIds, setSavingPersonIds] = useState<Set<string>>(new Set());

  // People records state
  const [savedPeopleRecords, setSavedPeopleRecords] = useState<import('../services/peopleRecordsService').PeopleRecord[]>([]);
  const [isLoadingPeopleRecords, setIsLoadingPeopleRecords] = useState(false);
  const [expandedSavedPersonIds, setExpandedSavedPersonIds] = useState<Set<string>>(new Set());
  const [tracingRecordIds, setTracingRecordIds] = useState<Set<string>>(new Set());

  const togglePerson = (personId: string) => {
    setExpandedPersonIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  // Load notes function - accessible to all handlers
  const loadNotes = useCallback(async () => {
    if (!property) return;
    
    setIsLoadingNotes(true);
    try {
      const loadedNotes = await propertyNotesService.getPropertyNotes(property.id);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [property]);

  // Load people records function
  const loadPeopleRecords = useCallback(async () => {
    if (!property) return;
    
    setIsLoadingPeopleRecords(true);
    try {
      const loadedPeople = await peopleRecordsService.getPeopleRecords(property.id);
      setSavedPeopleRecords(loadedPeople);
    } catch (error) {
      console.error('Error loading people records:', error);
    } finally {
      setIsLoadingPeopleRecords(false);
    }
  }, [property]);

  // Load docs function - accessible to all handlers
  const loadDocs = useCallback(async () => {
    if (!property) return;
    
    setIsLoadingDocs(true);
    try {
      const loadedDocs = await propertyDocsService.getPropertyDocs(property.id);
      setDocs(loadedDocs);
    } catch (error) {
      console.error('Error loading docs:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [property]);

  // Initialize form data when property changes
  useEffect(() => {
    if (!property) return;

    setFormData({
      full_address: property.full_address || '',
      street_address: property.street_address || '',
      city: property.city || '',
      state: property.state || '',
      zipcode: property.zipcode || '',
      latitude: property.latitude || undefined,
      longitude: property.longitude || undefined,
      status: property.status || 'Off Market'
    });
    setHasChanges(false);

    // Load notes, docs, and people records when property changes
    loadNotes();
    loadDocs();
    loadPeopleRecords();
  }, [property, loadNotes, loadDocs, loadPeopleRecords]);

  const handleInputChange = (field: keyof UpdatePropertyData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!property || !hasChanges) return;
    
    setIsSaving(true);
    try {
      await onSave(property.id, formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!property || !newNote.trim() || !user) return;
    
    setIsAddingNote(true);
    try {
      await propertyNotesService.createPropertyNote({
        property_id: property.id,
        workspace_id: property.workspace_id,
        comment: newNote.trim()
      });
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleStartEdit = (note: PropertyNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.comment);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    
    try {
      await propertyNotesService.updatePropertyNote(editingNoteId, {
        comment: editingNoteText.trim()
      });
      setEditingNoteId(null);
      setEditingNoteText('');
      await loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await propertyNotesService.deletePropertyNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Docs handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !property || !user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      event.target.value = '';
      return;
    }

    setIsUploadingDoc(true);
    try {
      await propertyDocsService.uploadPropertyDoc(
        property.id,
        property.workspace_id,
        file,
        uploadDescription.trim() || undefined
      );
      setUploadDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadDocs();
    } catch (error) {
      console.error('Error uploading doc:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (doc: PropertyDoc) => {
    try {
      const url = await propertyDocsService.getDocDownloadUrl(doc.file_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading doc:', error);
      alert('Failed to download document');
    }
  };

  const handleDeleteDoc = async (doc: PropertyDoc) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) return;
    
    try {
      await propertyDocsService.deletePropertyDoc(doc.id, doc.file_path);
      await loadDocs();
    } catch (error) {
      console.error('Error deleting doc:', error);
      alert('Failed to delete document');
    }
  };

  // API handlers
  const handleGetPeople = async () => {
    if (!property) return;

    setIsFetchingPeople(true);
    setPeopleError(null);
    setPeopleData(null);
    setExpandedPersonIds(new Set());
    setSavedPersonIds(new Set());

    try {
      const response = await apiService.callSkipTraceAPI({
        street: property.street_address,
        city: property.city,
        state: property.state,
        zip: property.zipcode
      });

      setPeopleData(response);

      // Check which people are already saved
      const data = response as { PeopleDetails?: Array<{ "Person ID"?: string }> };
      const people = data.PeopleDetails || [];
      const existingPersonIds = new Set<string>();
      
      for (const person of people) {
        if (person["Person ID"]) {
          const exists = await peopleRecordsService.checkPersonExists(property.id, person["Person ID"]);
          if (exists) {
            existingPersonIds.add(person["Person ID"]);
          }
        }
      }
      
      setSavedPersonIds(existingPersonIds);
    } catch (error) {
      console.error('Error fetching people:', error);
      setPeopleError(error instanceof Error ? error.message : 'Failed to fetch people data');
    } finally {
      setIsFetchingPeople(false);
    }
  };

  const handleSavePerson = async (person: {
    Name?: string;
    Link?: string;
    "Person ID"?: string;
    Age?: number;
    "Lives in"?: string;
    "Used to live in"?: string;
    "Related to"?: string;
  }, rawResponse: Record<string, unknown>) => {
    if (!property || !person["Person ID"]) return;

    const personId = person["Person ID"];
    setSavingPersonIds(prev => new Set(prev).add(personId));

    try {
      await peopleRecordsService.createPeopleRecord({
        property_id: property.id,
        workspace_id: property.workspace_id,
        full_name: person.Name || null,
        person_id: personId,
        person_link: person.Link || null,
        age: person.Age || null,
        lives_in: person["Lives in"] || null,
        used_to_live_in: person["Used to live in"] || null,
        related_to: person["Related to"] || null,
        raw_response: rawResponse,
        data_source: 'skip_trace_api'
      });

      setSavedPersonIds(prev => new Set(prev).add(personId));
      // Reload people records to show the newly saved record
      await loadPeopleRecords();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save person record');
    } finally {
      setSavingPersonIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(personId);
        return newSet;
      });
    }
  };

  const toggleSavedPerson = (recordId: string) => {
    setExpandedSavedPersonIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleSkipTracePersonRecord = async (record: PeopleRecord) => {
    if (!record.person_id) return;
    setTracingRecordIds(prev => new Set(prev).add(record.id));
    try {
      const raw = await apiService.callPersonAPI(record.person_id);
      // Persist raw person details
      const updated = await peopleRecordsService.saveSkipTracePersonDetails(record.id, raw as Record<string, unknown>);
      // Update in local state
      setSavedPeopleRecords(prev => prev.map(r => (r.id === record.id ? { ...r, raw_skip_trace_response: updated.raw_skip_trace_response } : r)));
    } catch (error) {
      console.error('Error running person skip trace:', error);
      alert('Failed to run skip trace for this person');
    } finally {
      setTracingRecordIds(prev => {
        const n = new Set(prev);
        n.delete(record.id);
        return n;
      });
    }
  };

  if (!isOpen || !property) return null;

  return (
    <>
      {/* Backdrop - Only on mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Overlay Panel - Positioned absolutely within workspace container */}
      <div className={`
        absolute top-0 right-0 bottom-10 z-50 bg-white border-l border-gray-200
        w-full md:w-1/2
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header - Sticky at top */}
        <div className="flex items-center justify-between h-11 px-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Property Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'notes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes {notes.length > 0 && `(${notes.length})`}
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'docs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Docs {docs.length > 0 && `(${docs.length})`}
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'api'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            API
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'people'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            People {savedPeopleRecords.length > 0 && `(${savedPeopleRecords.length})`}
          </button>
        </div>

        {/* Scrollable Content - Between header and action buttons */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollable-hidden">
          {activeTab === 'details' && (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }} id="property-detail-form">
              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    value={formData.full_address || ''}
                    onChange={(e) => handleInputChange('full_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.street_address || ''}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipcode || ''}
                    onChange={(e) => handleInputChange('zipcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Coordinates Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Coordinates</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 44.9778"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                      <input
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., -93.2650"
                    />
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Status</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Status *
                  </label>
                  <select
                    value={formData.status || 'Off Market'}
                    onChange={(e) => handleInputChange('status', e.target.value as Property['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Metadata</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(property.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(property.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

            </form>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this property..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAddingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              {isLoadingNotes ? (
                <div className="text-center py-8 text-sm text-gray-500">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No notes yet. Add one above.</div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editingNoteText.trim()}
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.comment}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString()}
                              </span>
                              {note.profile && (
                                <span className="text-xs text-gray-400 mt-0.5">
                                  {note.profile.full_name || note.profile.email}
                                </span>
                              )}
                            </div>
                            {user && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleStartEdit(note)}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit note"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete note"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* Upload Doc Form */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploadingDoc}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDoc}
                  className="w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <DocumentIcon className="w-4 h-4" />
                  <span>{isUploadingDoc ? 'Uploading...' : 'Choose PDF File'}</span>
                </button>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUploadingDoc}
                />
              </div>

              {/* Docs List */}
              {isLoadingDocs ? (
                <div className="text-center py-8 text-sm text-gray-500">Loading documents...</div>
              ) : docs.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No documents yet. Upload one above.</div>
              ) : (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <DocumentIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {doc.file_name}
                            </h4>
                            {doc.description && (
                              <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                            )}
                            <div className="flex flex-col mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(doc.created_at).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 mt-0.5">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                              {doc.profile && (
                                <span className="text-xs text-gray-400 mt-0.5">
                                  {doc.profile.full_name || doc.profile.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {user && (
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <button
                              onClick={() => handleDownloadDoc(doc)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Skip Trace API</h3>
                <button
                  onClick={handleGetPeople}
                  disabled={isFetchingPeople || !property?.street_address || !property?.city || !property?.state || !property?.zipcode}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isFetchingPeople ? 'Fetching...' : 'Get People'}
                </button>
                {(!property?.street_address || !property?.city || !property?.state || !property?.zipcode) && (
                  <p className="mt-2 text-xs text-gray-500">Complete property address details required</p>
                )}
              </div>

              {peopleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {peopleError}
                </div>
              )}

              {peopleData !== null && (() => {
                const data = peopleData as {
                  Status?: number;
                  Message?: string;
                  Source?: string;
                  Records?: number;
                  Page?: number;
                  PeopleDetails?: Array<{
                    Name?: string;
                    Link?: string;
                    "Person ID"?: string;
                    Age?: number;
                    "Lives in"?: string;
                    "Used to live in"?: string;
                    "Related to"?: string;
                  }>;
                };

                const people = data.PeopleDetails || [];
                const records = data.Records || 0;
                const status = data.Status || 200;
                const message = data.Message || '';
                const source = data.Source || '';

                return (
                  <div className="space-y-3">
                    {/* Summary Info */}
                    {(records > 0 || status || message || source) && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                        {records > 0 && <div className="text-gray-900 font-medium mb-1">{records} record{records !== 1 ? 's' : ''} found</div>}
                        {source && <div className="text-gray-600">Source: {source}</div>}
                        {message && <div className="text-gray-600 mt-1">{message}</div>}
                      </div>
                    )}

                    {/* People Accordion */}
                    {people.length > 0 ? (
                      <div className="space-y-2">
                        {people.map((person, index) => {
                          const personId = person["Person ID"] || `person-${index}`;
                          const isExpanded = expandedPersonIds.has(personId);

                          return (
                            <div key={personId} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => togglePerson(personId)}
                                className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-gray-900">{person.Name || 'Unknown'}</span>
                                    {person.Age && (
                                      <span className="text-xs text-gray-500">• {person.Age}</span>
                                    )}
                                    {person["Lives in"] && (
                                      <span className="text-xs text-gray-500">• {person["Lives in"]}</span>
                                    )}
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUpIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                ) : (
                                  <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                )}
                              </button>
                              
                              {isExpanded && (
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                                  {person["Person ID"] && (
                                    <div className="flex items-start">
                                      <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Person ID:</span>
                                      <span className="text-xs text-gray-900 break-all">{person["Person ID"]}</span>
                                    </div>
                                  )}
                                  {person.Link && (
                                    <div className="flex items-start">
                                      <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Link:</span>
                                      <a
                                        href={person.Link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline break-all"
                                      >
                                        {person.Link}
                                      </a>
                                    </div>
                                  )}
                                  {person["Used to live in"] && (
                                    <div className="flex items-start">
                                      <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Used to live:</span>
                                      <span className="text-xs text-gray-900">{person["Used to live in"]}</span>
                                    </div>
                                  )}
                                  {person["Related to"] && (
                                    <div className="flex items-start">
                                      <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Related to:</span>
                                      <span className="text-xs text-gray-900">{person["Related to"]}</span>
                                    </div>
                                  )}
                                  
                                  {/* Save Button */}
                                  {person["Person ID"] && (
                                    <div className="flex items-center justify-end pt-2 border-t border-gray-200 mt-2">
                                      {savedPersonIds.has(person["Person ID"]) ? (
                                        <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                                      ) : (
                                        <button
                                          onClick={() => handleSavePerson(person, person as Record<string, unknown>)}
                                          disabled={savingPersonIds.has(person["Person ID"])}
                                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                          {savingPersonIds.has(person["Person ID"]) ? 'Saving...' : 'Save Person'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-gray-500">
                        No people found for this address.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved People Records</h3>
              </div>

              {isLoadingPeopleRecords ? (
                <div className="text-center py-8 text-sm text-gray-500">Loading people records...</div>
              ) : savedPeopleRecords.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No people records saved yet. Use the API tab to search and save people.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedPeopleRecords.map((record) => {
                    const isExpanded = expandedSavedPersonIds.has(record.id);

                    return (
                      <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSavedPerson(record.id)}
                          className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">{record.full_name || 'Unknown'}</span>
                              {record.age && (
                                <span className="text-xs text-gray-500">• {record.age}</span>
                              )}
                              {record.lives_in && (
                                <span className="text-xs text-gray-500">• {record.lives_in}</span>
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                            {record.person_id && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Person ID:</span>
                                <span className="text-xs text-gray-900 break-all">{record.person_id}</span>
                              </div>
                            )}
                            {record.email && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Email:</span>
                                <span className="text-xs text-gray-900">{record.email}</span>
                              </div>
                            )}
                            {record.phone && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Phone:</span>
                                <span className="text-xs text-gray-900">{record.phone}</span>
                              </div>
                            )}
                            {record.person_link && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Link:</span>
                                <a
                                  href={record.person_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline break-all"
                                >
                                  {record.person_link}
                                </a>
                              </div>
                            )}
                            {record.used_to_live_in && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Used to live:</span>
                                <span className="text-xs text-gray-900">{record.used_to_live_in}</span>
                              </div>
                            )}
                            {record.related_to && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Related to:</span>
                                <span className="text-xs text-gray-900">{record.related_to}</span>
                              </div>
                            )}
                            {record.relationship_to_property && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Relationship:</span>
                                <span className="text-xs text-gray-900 capitalize">{record.relationship_to_property.replace('_', ' ')}</span>
                              </div>
                            )}
                            {record.data_source && (
                              <div className="flex items-start">
                                <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Source:</span>
                                <span className="text-xs text-gray-900">{record.data_source}</span>
                              </div>
                            )}
                          {/* Skip Trace action */}
                          {record.person_id && (
                            <div className="flex items-center justify-end pt-2 border-t border-gray-200 mt-2">
                              {record.raw_skip_trace_response ? (
                                <span className="text-xs text-green-600 font-medium">✓ Person details saved</span>
                              ) : (
                                <button
                                  onClick={() => handleSkipTracePersonRecord(record)}
                                  disabled={tracingRecordIds.has(record.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {tracingRecordIds.has(record.id) ? 'Tracing...' : 'Skip Trace'}
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Parsed Skip Trace Response */}
                          {record.raw_skip_trace_response && (() => {
                            const parsedData = skipTracePersonParser.parsePersonResponse(record.raw_skip_trace_response);
                            
                            return (
                              <div className="pt-2 border-t border-gray-200 mt-2">
                                <h5 className="text-xs font-semibold text-gray-900 mb-3">Skip Trace Details</h5>
                                <div className="space-y-3">
                                  {/* Person Details */}
                                  {parsedData.personDetails.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`person-details-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Person Details ({parsedData.personDetails.length})</span>
                                        {expandedSavedPersonIds.has(`person-details-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`person-details-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-1">
                                          {parsedData.personDetails.map((detail, idx) => (
                                            <div key={idx} className="text-xs space-y-1">
                                              {detail.personName && <div><span className="font-medium">Name:</span> {detail.personName}</div>}
                                              {detail.age && <div><span className="font-medium">Age:</span> {detail.age}</div>}
                                              {detail.born && <div><span className="font-medium">Born:</span> {detail.born}</div>}
                                              {detail.livesIn && <div><span className="font-medium">Lives in:</span> {detail.livesIn}</div>}
                                              {detail.telephone && <div><span className="font-medium">Phone:</span> {detail.telephone}</div>}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Relatives */}
                                  {parsedData.relatives.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`relatives-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Relatives ({parsedData.relatives.length})</span>
                                        {expandedSavedPersonIds.has(`relatives-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`relatives-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-2">
                                          {parsedData.relatives.map((relative, idx) => (
                                            <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
                                              <div className="font-medium">{relative.name}</div>
                                              <div className="text-gray-600 space-y-1">
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
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`associates-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Associates ({parsedData.associates.length})</span>
                                        {expandedSavedPersonIds.has(`associates-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`associates-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-2">
                                          {parsedData.associates.map((associate, idx) => (
                                            <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
                                              <div className="font-medium">{associate.name}</div>
                                              <div className="text-gray-600 space-y-1">
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

                                  {/* Email Addresses */}
                                  {parsedData.emails.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`emails-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Email Addresses ({parsedData.emails.length})</span>
                                        {expandedSavedPersonIds.has(`emails-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`emails-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-1">
                                          {parsedData.emails.map((email, idx) => (
                                            <div key={idx} className="text-xs">
                                              <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Phone Details */}
                                  {parsedData.phones.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`phones-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Phone Numbers ({parsedData.phones.length})</span>
                                        {expandedSavedPersonIds.has(`phones-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`phones-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-2">
                                          {parsedData.phones.map((phone, idx) => (
                                            <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
                                              <div className="font-medium">{phone.phoneNumber}</div>
                                              <div className="text-gray-600 space-y-1">
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

                                  {/* Current Addresses */}
                                  {parsedData.currentAddresses.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`current-addresses-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Current Addresses ({parsedData.currentAddresses.length})</span>
                                        {expandedSavedPersonIds.has(`current-addresses-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`current-addresses-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-2">
                                          {parsedData.currentAddresses.map((address, idx) => (
                                            <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
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
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSavedPerson(`previous-addresses-${record.id}`)}
                                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                                      >
                                        <span className="text-xs font-medium text-gray-700">Previous Addresses ({parsedData.previousAddresses.length})</span>
                                        {expandedSavedPersonIds.has(`previous-addresses-${record.id}`) ? (
                                          <ChevronUpIcon className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                      {expandedSavedPersonIds.has(`previous-addresses-${record.id}`) && (
                                        <div className="px-3 py-2 bg-white space-y-2">
                                          {parsedData.previousAddresses.map((address, idx) => (
                                            <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-b-0">
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
                                </div>
                              </div>
                            );
                          })()}
                          
                          <div className="flex items-start pt-2 border-t border-gray-200 mt-2">
                            <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">Saved:</span>
                            <span className="text-xs text-gray-600">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                          </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Sticky at bottom, only show on details tab */}
        {activeTab === 'details' && (
          <div className="flex items-center justify-end space-x-2 px-3 py-2 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="property-detail-form"
              disabled={!hasChanges || isSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
