"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspaces/contexts/WorkspaceContext';
import { useProperties } from '@/features/workspaces/contexts/PropertiesContext';
import { DataTable, DataRecord, Column } from '@/features/workspaces/components/DataTable';
import { DataTableFooter } from '@/features/workspaces/components/DataTableFooter';
import { AddPropertyModal } from '@/features/workspaces/components/AddPropertyModal';
import { PropertyDetailOverlay } from '@/features/workspaces/components/PropertyDetailOverlay';
import PageLayout from '@/components/PageLayout';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, ClipboardDocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import WorkspaceMap from '@/features/workspaces/components/WorkspaceMap';
import { Property, UpdatePropertyData } from '@/features/workspaces/services/propertiesService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSelectedRows, setHasSelectedRows] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;
  const [flyToProperty, setFlyToProperty] = useState<((property: { latitude?: number; longitude?: number } | null) => void) | null>(null);
  const [newlyAddedPropertyIds, setNewlyAddedPropertyIds] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false);

  // Set current workspace based on URL
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace && workspace.id !== currentWorkspace?.id) {
        setCurrentWorkspace(workspace);
      }
    }
  }, [workspaceId, workspaces, currentWorkspace?.id, setCurrentWorkspace]);

  // Fetch properties when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchProperties(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchProperties]);

  // Create tabs with dynamic counts - only map and properties
  const tabs = [
    { id: 'map', label: 'Map', icon: '🗺️', count: 0 },
    { id: 'properties', label: 'Properties', icon: '🏠', count: properties.length }
  ];

  const getCurrentData = (): DataRecord[] => {
    if (activeTab === 'properties') {
      return properties.map(prop => ({
        id: prop.id,
        full_address: prop.full_address,
        city: prop.city,
        state: prop.state,
        zipcode: prop.zipcode,
        status: prop.status,
        created_at: prop.created_at
      }));
    }
    return [];
  };

  const getCurrentColumns = (): Column[] => {
    if (activeTab === 'properties') {
      return propertyColumns;
    }
    return [];
  };

  // Reset to page 1 when tab changes or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, properties.length]);

  const handleAddRecord = () => {
    if (activeTab === 'properties') {
      setIsAddModalOpen(true);
    }
  };

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
      
      // Don't close modal here - let the modal handle it
    } catch (error) {
      console.error('Error creating property:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRecord = (record: DataRecord | { id: string }) => {
    // Find the property and show detail overlay
    // Can accept either DataRecord or just an object with id
    const propertyId = record.id;
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setIsDetailOverlayOpen(true);
    }
  };

  const handleUpdateProperty = async (id: string, data: UpdatePropertyData) => {
    await updateProperty(id, data);
    // Refresh properties to get updated data
    if (currentWorkspace?.id) {
      await fetchProperties(currentWorkspace.id);
    }
    // Update selected property to reflect changes
    const updatedProperty = properties.find(p => p.id === id);
    if (updatedProperty) {
      setSelectedProperty(updatedProperty);
    }
  };

  const handleEditRecord = (record: DataRecord) => {
    // TODO: Implement edit property modal
    console.log('Edit property:', record);
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

  const handleBulkCopy = (recordIds: string[]) => {
    // TODO: Implement bulk copy functionality
    console.log('Bulk copy:', recordIds);
  };

  const handleBulkExport = (recordIds: string[]) => {
    // TODO: Implement bulk export functionality
    console.log('Bulk export:', recordIds);
  };

  const handleSelectionChange = (hasSelection: boolean, selectedIds: string[]) => {
    setHasSelectedRows(hasSelection);
    setSelectedRowIds(selectedIds);
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Workspace Not Found</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();
  const totalRecords = currentData.length;

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
                    className={`flex items-center space-x-1.5 h-full px-3 border-b-2 font-medium text-xs transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Right side - Search and New Record */}
              <div className="flex items-center h-full space-x-2 pr-2">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 h-7 pl-7 pr-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>

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
        <div className={`flex-1 min-h-0 w-full ${isDetailOverlayOpen ? 'md:pr-[50%]' : ''} transition-all duration-300 overflow-hidden ${activeTab === 'properties' ? 'pb-10' : ''}`} style={{ margin: 0, padding: 0 }}>
          {activeTab === 'map' ? (
            <WorkspaceMap 
              onMapReady={setFlyToProperty} 
              onMarkerClick={(property: { id: string }) => handleViewRecord(property)}
            />
          ) : (
            <DataTable
              data={currentData}
              columns={getCurrentColumns()}
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              onView={activeTab === 'properties' ? handleViewRecord : undefined}
              onEdit={activeTab === 'properties' ? handleEditRecord : undefined}
              onBulkDelete={activeTab === 'properties' ? handleBulkDelete : undefined}
              onBulkCopy={activeTab === 'properties' ? handleBulkCopy : undefined}
              onBulkExport={activeTab === 'properties' ? handleBulkExport : undefined}
              onSelectionChange={handleSelectionChange}
              loading={propertiesLoading}
              showHeader={false}
              highlightedRows={activeTab === 'properties' ? newlyAddedPropertyIds : new Set()}
            />
          )}
        </div>

        {/* Fixed Footer - Only show for properties tab */}
        {activeTab === 'properties' && (
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
          onClose={() => {
            setIsDetailOverlayOpen(false);
            setSelectedProperty(null);
          }}
          onSave={handleUpdateProperty}
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
