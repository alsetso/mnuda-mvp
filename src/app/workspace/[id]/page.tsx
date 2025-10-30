"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspaces/contexts/WorkspaceContext';
import { useProperties } from '@/features/workspaces/contexts/PropertiesContext';
import { DataTable, DataRecord, Column } from '@/features/workspaces/components/DataTable';
import { DataTableFooter } from '@/features/workspaces/components/DataTableFooter';
import { AddPropertyModal } from '@/features/workspaces/components/AddPropertyModal';
import { PropertyDetailOverlay } from '@/features/workspaces/components/PropertyDetailOverlay';
import { PeopleDetailOverlay } from '@/features/workspaces/components/PeopleDetailOverlay';
import PageLayout from '@/components/PageLayout';
import { PlusIcon, TrashIcon, ClipboardDocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import WorkspaceMap from '@/features/workspaces/components/WorkspaceMap';
import { Property, UpdatePropertyData } from '@/features/workspaces/services/propertiesService';
import { supabase } from '@/lib/supabase';
import { peopleRecordsService, PeopleRecord } from '@/features/workspaces/services/peopleRecordsService';

// Property columns for the simplified schema
const propertyColumns: Column[] = [
  { key: 'full_address', label: 'Address', type: 'text', width: '300' },
  { key: 'city', label: 'City', type: 'text', width: '120' },
  { key: 'state', label: 'State', type: 'text', width: '60' },
  { key: 'zipcode', label: 'ZIP', type: 'text', width: '80' },
  { key: 'status', label: 'Status', type: 'select', width: '140', options: [
    'Preforeclosure', 'Foreclosure', 'Foreclosed', 'Auction', 'Redemption',
    'Bank Owned', 'Short Sale', 'Subject To', 'Deed In Lieu', 'Leaseback',
    'For Sale By Owner', 'Listed On MLS', 'Under Contract', 'Sold', 'Off Market'
  ] },
  { key: 'notes_people_count', label: 'Count', type: 'text', width: '120' },
  { key: 'created_at', label: 'Added', type: 'date', width: '100' }
];

// People columns
const peopleColumns: Column[] = [
  { key: 'full_name', label: 'Name', type: 'text', width: '200' },
  { key: 'traced_status', label: 'Traced', type: 'text', width: '100' },
  { key: 'email', label: 'Email', type: 'text', width: '200' },
  { key: 'phone', label: 'Phone', type: 'text', width: '140' },
  { key: 'relationship_to_property', label: 'Relationship', type: 'text', width: '120' },
  { key: 'property_address', label: 'Property', type: 'text', width: '250' },
  { key: 'created_at', label: 'Added', type: 'date', width: '100' }
];

// Tabs will be created dynamically with counts

export default function WorkspaceDatabasePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  
  const { 
    currentWorkspace, 
    setCurrentWorkspace, 
    workspaces, 
    loading: workspaceLoading 
  } = useWorkspace();
  
  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    clearError
  } = useProperties();
  
  const [activeTab, setActiveTab] = useState('properties');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSelectedRows, setHasSelectedRows] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;
  const [newlyAddedPropertyIds, setNewlyAddedPropertyIds] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false);
  const [selectedPeopleRecord, setSelectedPeopleRecord] = useState<PeopleRecord | null>(null);
  const [isPeopleDetailOverlayOpen, setIsPeopleDetailOverlayOpen] = useState(false);
  const [propertyCounts, setPropertyCounts] = useState<Record<string, { notes: number; people: number }>>({});
  const [allPeopleRecords, setAllPeopleRecords] = useState<PeopleRecord[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  
  // Track last fetched workspace ID to prevent unnecessary refetches
  const lastFetchedWorkspaceIdRef = useRef<string | null>(null);
  const lastPropertiesLengthRef = useRef<number>(0);

  // Set current workspace based on URL
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace && workspace.id !== currentWorkspace?.id) {
        setCurrentWorkspace(workspace);
      }
    }
  }, [workspaceId, workspaces, currentWorkspace?.id, setCurrentWorkspace]);

  // Fetch properties when workspace changes (only if workspace ID actually changed)
  useEffect(() => {
    if (currentWorkspace?.id && currentWorkspace.id !== lastFetchedWorkspaceIdRef.current) {
      lastFetchedWorkspaceIdRef.current = currentWorkspace.id;
      fetchProperties(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchProperties]);

  // Fetch notes and people counts for all properties (only when properties actually change)
  useEffect(() => {
    const fetchPropertyCounts = async () => {
      if (!currentWorkspace?.id || properties.length === 0) {
        setPropertyCounts({});
        lastPropertiesLengthRef.current = properties.length;
        return;
      }

      // Skip if properties length hasn't changed and we already have counts
      const currentCountsKeys = Object.keys(propertyCounts).length;
      if (properties.length === lastPropertiesLengthRef.current && currentCountsKeys > 0) {
        return;
      }
      try {
        const propertyIds = properties.map(p => p.id);
        
        // Fetch notes counts for all properties at once
        const { data: notesData, error: notesError } = await supabase
          .from('property_notes')
          .select('property_id')
          .in('property_id', propertyIds);

        if (notesError) {
          console.error('Error fetching notes counts:', notesError);
        }

        // Fetch people records counts for all properties at once
        const { data: peopleData, error: peopleError } = await supabase
          .from('people_records')
          .select('property_id')
          .in('property_id', propertyIds);

        if (peopleError) {
          console.error('Error fetching people counts:', peopleError);
        }

        // Count notes per property
        const notesCounts: Record<string, number> = {};
        notesData?.forEach((note) => {
          notesCounts[note.property_id] = (notesCounts[note.property_id] || 0) + 1;
        });

        // Count people per property
        const peopleCounts: Record<string, number> = {};
        peopleData?.forEach((person) => {
          peopleCounts[person.property_id] = (peopleCounts[person.property_id] || 0) + 1;
        });

        // Combine counts
        const counts: Record<string, { notes: number; people: number }> = {};
        propertyIds.forEach((id) => {
          counts[id] = {
            notes: notesCounts[id] || 0,
            people: peopleCounts[id] || 0
          };
        });

        setPropertyCounts(counts);
        lastPropertiesLengthRef.current = properties.length;
      } catch (error) {
        console.error('Error fetching property counts:', error);
      }
    };

    fetchPropertyCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length, currentWorkspace?.id]); // Only depend on length, not the array itself. propertyCounts intentionally excluded to prevent loops

  // Track last fetched people records workspace ID
  const lastFetchedPeopleWorkspaceIdRef = useRef<string | null>(null);

  // Fetch all people records for the workspace (only when workspace changes, not when properties change)
  useEffect(() => {
    const fetchAllPeopleRecords = async () => {
      if (!currentWorkspace?.id) {
        setAllPeopleRecords([]);
        lastFetchedPeopleWorkspaceIdRef.current = null;
        return;
      }

      // Skip if we already fetched for this workspace
      if (currentWorkspace.id === lastFetchedPeopleWorkspaceIdRef.current) {
        return;
      }

      setLoadingPeople(true);
      try {
        const { data, error } = await supabase
          .from('people_records')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching people records:', error);
          setAllPeopleRecords([]);
        } else {
          setAllPeopleRecords(data || []);
          lastFetchedPeopleWorkspaceIdRef.current = currentWorkspace.id;
        }
      } catch (error) {
        console.error('Error fetching people records:', error);
        setAllPeopleRecords([]);
      } finally {
        setLoadingPeople(false);
      }
    };

    fetchAllPeopleRecords();
  }, [currentWorkspace?.id]); // Removed properties dependency - people records should only refetch when workspace changes

  // Create tabs with dynamic counts (memoized to prevent unnecessary recalculations)
  const tabs = useMemo(() => [
    { id: 'map', label: 'Map', count: 0 },
    { id: 'properties', label: 'Properties', count: properties.length },
    { id: 'people', label: 'People', count: allPeopleRecords.length }
  ], [properties.length, allPeopleRecords.length]);

  // Memoize current data to prevent unnecessary recalculations
  const currentData = useMemo((): DataRecord[] => {
    if (activeTab === 'properties') {
      return properties.map(prop => {
        const counts = propertyCounts[prop.id] || { notes: 0, people: 0 };
        const totalCount = counts.notes + counts.people;
        return {
          id: prop.id,
          full_address: prop.full_address,
          city: prop.city,
          state: prop.state,
          zipcode: prop.zipcode,
          status: prop.status,
          notes_people_count: totalCount > 0 ? `${counts.notes}N ${counts.people}P` : '0',
          created_at: prop.created_at,
          property_code: prop.code || null, // Include code for conditional link rendering
          property_id: prop.id // Include property ID for link
        };
      });
    } else if (activeTab === 'people') {
      return allPeopleRecords.map(person => {
        // Find the property for this person to get the address
        const property = properties.find(p => p.id === person.property_id);
        const hasTraced = !!person.raw_skip_trace_response;
        return {
          id: person.id,
          full_name: person.full_name || 'Unknown',
          traced_status: hasTraced ? 'Yes' : 'No',
          email: person.email || '',
          phone: person.phone || '',
          relationship_to_property: person.relationship_to_property || '',
          property_address: property?.full_address || 'Unknown Property',
          property_id: person.property_id, // Store for navigation
          created_at: person.created_at
        };
      });
    }
    return [];
  }, [activeTab, properties, propertyCounts, allPeopleRecords]);

  // Memoize columns to prevent recreation
  const currentColumns = useMemo((): Column[] => {
    if (activeTab === 'properties') {
      return propertyColumns;
    } else if (activeTab === 'people') {
      return peopleColumns;
    }
    return [];
  }, [activeTab]);

  // Reset to page 1 when tab changes or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, properties.length, allPeopleRecords.length]);

  const handleAddRecord = () => {
    if (activeTab === 'properties') {
      setIsAddModalOpen(true);
    }
  };

  // Helper to refresh people records when needed (e.g., after property is added)
  const refreshPeopleRecords = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    setLoadingPeople(true);
    try {
      const { data, error } = await supabase
        .from('people_records')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllPeopleRecords(data);
        // Also refresh property counts since people records affect counts
        lastPropertiesLengthRef.current = 0; // Force refresh of counts
      }
    } catch (error) {
      console.error('Error refreshing people records:', error);
    } finally {
      setLoadingPeople(false);
    }
  }, [currentWorkspace?.id]);

  // Helper to refresh property counts when needed
  const refreshPropertyCounts = useCallback(async () => {
    if (!currentWorkspace?.id || properties.length === 0) {
      setPropertyCounts({});
      return;
    }

    try {
      const propertyIds = properties.map(p => p.id);
      
      const [notesResult, peopleResult] = await Promise.all([
        supabase.from('property_notes').select('property_id').in('property_id', propertyIds),
        supabase.from('people_records').select('property_id').in('property_id', propertyIds)
      ]);

      const notesCounts: Record<string, number> = {};
      notesResult.data?.forEach((note) => {
        notesCounts[note.property_id] = (notesCounts[note.property_id] || 0) + 1;
      });

      const peopleCounts: Record<string, number> = {};
      peopleResult.data?.forEach((person) => {
        peopleCounts[person.property_id] = (peopleCounts[person.property_id] || 0) + 1;
      });

      const counts: Record<string, { notes: number; people: number }> = {};
      propertyIds.forEach((id) => {
        counts[id] = {
          notes: notesCounts[id] || 0,
          people: peopleCounts[id] || 0
        };
      });

      setPropertyCounts(counts);
      lastPropertiesLengthRef.current = properties.length;
    } catch (error) {
      console.error('Error refreshing property counts:', error);
    }
  }, [currentWorkspace?.id, properties]);

  const handleAddProperty = async (data: {
    full_address: string;
    street_address: string;
    city: string;
    state: string;
    zipcode: string;
    status: string;
  }) => {
    if (!currentWorkspace?.id) {
      throw new Error('No workspace selected');
    }
    
    setIsSubmitting(true);
    try {
      const newProperty = await createProperty(currentWorkspace.id, {
        ...data,
        status: data.status as Property['status']
      });
      
      // Track newly added property for highlighting
      setNewlyAddedPropertyIds(prev => new Set([...prev, newProperty.id]));
      
      // Remove highlight after 5 seconds
      setTimeout(() => {
        setNewlyAddedPropertyIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newProperty.id);
          return newSet;
        });
      }, 5000);
      
      // Refresh people records in case new people were added (though unlikely from add property modal)
      // This is just to keep data in sync, but won't trigger if no people exist
      
      // Don't close modal here - let the modal handle it
    } catch (error) {
      console.error('Error creating property:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRecord = (record: DataRecord | { id: string }) => {
    if (activeTab === 'properties') {
      // Find the property and show detail overlay
      const propertyId = record.id;
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setSelectedProperty(property);
        setIsDetailOverlayOpen(true);
      }
    } else if (activeTab === 'people') {
      // For people records, open the people detail overlay
      const peopleRecordId = record.id;
      const peopleRecord = allPeopleRecords.find(p => p.id === peopleRecordId);
      if (peopleRecord) {
        setSelectedPeopleRecord(peopleRecord);
        setIsPeopleDetailOverlayOpen(true);
      }
    }
  };

  const handleUpdateProperty = async (id: string, data: UpdatePropertyData) => {
    // Only update if there's actual data to update
    const hasData = Object.keys(data).length > 0;
    if (hasData) {
      const updatedProperty = await updateProperty(id, data);
      // Optimistically update selected property
      if (selectedProperty?.id === id) {
        setSelectedProperty(updatedProperty);
      }
      // Refresh property counts if property data affects counts
      // (Properties context already updates the properties array optimistically)
    }
  };

  const handleUpdatePeopleRecord = async (id: string, data: Partial<PeopleRecord>) => {
    await peopleRecordsService.updatePeopleRecord(id, data);
    // Optimistically update local state instead of refetching
    setAllPeopleRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...data } as PeopleRecord : record
    ));
    // Update selected people record if it's the one being edited
    if (selectedPeopleRecord?.id === id) {
      setSelectedPeopleRecord(prev => prev ? { ...prev, ...data } as PeopleRecord : null);
    }
  };

  const handleEditRecord = (_record: DataRecord) => {
    // Edit functionality can be implemented via the detail overlay
  };

  const handleBulkDelete = async (recordIds: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${recordIds.length} properties?`)) {
      try {
        for (const id of recordIds) {
          await deleteProperty(id);
        }
      } catch (error) {
        console.error('Error deleting properties:', error);
      }
    }
  };

  const handleBulkCopy = (_recordIds: string[]) => {
    // Bulk copy functionality - to be implemented
  };

  const handleBulkExport = (_recordIds: string[]) => {
    // Bulk export functionality - to be implemented
  };

  const handleSelectionChange = (hasSelection: boolean, selectedIds: string[]) => {
    setHasSelectedRows(hasSelection);
    setSelectedRowIds(selectedIds);
  };

  if (workspaceLoading) {
    return (
      <PageLayout backgroundColor="bg-white" containerMaxWidth="full" contentPadding="" showFooter={false}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#014463] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 text-sm">Loading workspace...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <PageLayout backgroundColor="bg-white" containerMaxWidth="full" contentPadding="" showFooter={false}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Workspace Not Found</div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#014463] text-white rounded-lg font-medium hover:bg-[#013347] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalRecords = currentData.length;
  const isLoadingData = (activeTab === 'properties' && propertiesLoading) || (activeTab === 'people' && loadingPeople);

  return (
    <PageLayout backgroundColor="bg-white" containerMaxWidth="full" contentPadding="" showFooter={false}>
      <div className="flex flex-col relative overflow-hidden h-full w-full" style={{ maxWidth: '100vw', margin: 0, padding: 0 }}>
        {/* Tabs with Search and New Record - Always rendered to maintain height */}
        <div className="border-b border-gray-200 bg-white h-11 flex-shrink-0">
          {!hasSelectedRows ? (
            <div className="flex items-center justify-between h-full">
              {/* Left side - Tabs */}
              <nav className="flex items-center h-full">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 h-full px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Right side - New Record */}
              <div className="flex items-center h-full space-x-2 pr-2">
                {/* New Record Button */}
                {activeTab === 'properties' && (
                  <button
                    onClick={handleAddRecord}
                    className="flex items-center space-x-1 h-7 px-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-xs"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>New Record</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between h-full px-2">
              {/* Left side - Selection count */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-900">
                  {selectedRowIds.length} row{selectedRowIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              {/* Right side - Bulk actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkDelete(selectedRowIds)}
                  className="flex items-center space-x-1.5 px-2.5 h-7 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => handleBulkCopy(selectedRowIds)}
                  className="flex items-center space-x-1.5 px-2.5 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                >
                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => handleBulkExport(selectedRowIds)}
                  className="flex items-center space-x-1.5 px-2.5 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {propertiesError && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-3 py-2">
            <div className="flex justify-between items-center">
              <span className="text-xs">{propertiesError}</span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 font-medium text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Content Area - Takes remaining space, accounting for tabs and footer */}
        <div className={`flex-1 min-h-0 w-full ${isDetailOverlayOpen || isPeopleDetailOverlayOpen ? 'md:pr-[50%]' : ''} transition-all duration-300 overflow-hidden ${(activeTab === 'properties' || activeTab === 'people' || activeTab === 'map') ? 'pb-10' : ''}`} style={{ margin: 0, padding: 0 }}>
          {activeTab === 'map' ? (
            <WorkspaceMap 
              onMarkerClick={(property: { id: string }) => handleViewRecord(property)}
            />
          ) : (
            <DataTable
              data={currentData}
              columns={currentColumns}
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              onView={(activeTab === 'properties' || activeTab === 'people') ? handleViewRecord : undefined}
              onEdit={activeTab === 'properties' ? handleEditRecord : undefined}
              onBulkDelete={activeTab === 'properties' ? handleBulkDelete : undefined}
              onBulkCopy={activeTab === 'properties' ? handleBulkCopy : undefined}
              onBulkExport={activeTab === 'properties' ? handleBulkExport : undefined}
              onSelectionChange={handleSelectionChange}
              loading={isLoadingData}
              showHeader={false}
              highlightedRows={activeTab === 'properties' ? newlyAddedPropertyIds : new Set()}
            />
          )}
        </div>

        {/* Fixed Footer - Show for properties, people, and map tabs */}
        {activeTab === 'map' && (
          <div className="fixed bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4 z-10">
            <div className="text-xs text-gray-600">
              {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} total
              {properties.filter(p => p.latitude && p.longitude).length > 0 && (
                <span className="ml-2">
                  • {properties.filter(p => p.latitude && p.longitude).length} on map
                </span>
              )}
            </div>
          </div>
        )}
        {(activeTab === 'properties' || activeTab === 'people') && (
          <DataTableFooter
            totalRecords={totalRecords}
            currentPage={currentPage}
            recordsPerPage={recordsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Property Detail Overlay - Contained in workspace container */}
        <PropertyDetailOverlay
          property={selectedProperty}
          isOpen={isDetailOverlayOpen}
          onClose={async () => {
            setIsDetailOverlayOpen(false);
            setSelectedProperty(null);
            // Refresh property counts and people records when overlay closes
            // This ensures counts are accurate if people/notes were added
            await Promise.all([
              refreshPropertyCounts(),
              refreshPeopleRecords()
            ]);
          }}
          onSave={handleUpdateProperty}
        />

        {/* People Detail Overlay - Contained in workspace container */}
        <PeopleDetailOverlay
          peopleRecord={selectedPeopleRecord}
          isOpen={isPeopleDetailOverlayOpen}
          onClose={() => {
            setIsPeopleDetailOverlayOpen(false);
            setSelectedPeopleRecord(null);
            // People records are updated optimistically in handleUpdatePeopleRecord
            // No need to refetch on close
          }}
          onSave={handleUpdatePeopleRecord}
        />
      </div>
      
      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProperty}
        loading={isSubmitting}
      />
    </PageLayout>
  );
}
