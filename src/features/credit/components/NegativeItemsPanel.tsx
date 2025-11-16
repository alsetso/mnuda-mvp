'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon, XCircleIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { NegativeItem } from '../types';
import { NegativeItemForm } from './NegativeItemForm';
import { CreditItemDeleteModal } from './CreditItemDeleteModal';
import { CreditRestorationService } from '../services/creditRestorationService';

interface NegativeItemsPanelProps {
  items: NegativeItem[];
  isLoading: boolean;
  onRefresh: () => void;
  creditProfileId: string;
}

export function NegativeItemsPanel({ items, isLoading, onRefresh, creditProfileId }: NegativeItemsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<NegativeItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NegativeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NegativeItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.accountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creditorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || item.itemType === filterType;
      const matchesStatus = filterStatus === 'all' || item.itemStatus === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, searchQuery, filterType, filterStatus]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map(item => item.itemType));
    return Array.from(types).sort();
  }, [items]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(items.map(item => item.itemStatus));
    return Array.from(statuses).sort();
  }, [items]);

  const getStatusBadgeColor = (status: string) => {
    // All status labels should be red on item cards
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: NegativeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item: NegativeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem?.id) return;
    
    try {
      await CreditRestorationService.deleteNegativeItem(deletingItem.id);
      onRefresh();
      if (selectedItem?.id === deletingItem.id) {
        setSelectedItem(null);
      }
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error; // Let the modal handle the error display
    }
  };

  const handleFormSubmit = async (itemData: Omit<NegativeItem, 'id' | 'creditProfileId' | 'createdAt' | 'updatedAt'>) => {
    if (editingItem?.id) {
      await CreditRestorationService.updateNegativeItem(editingItem.id, itemData);
    } else {
      await CreditRestorationService.createNegativeItem(creditProfileId, itemData);
    }
    onRefresh();
    setIsFormOpen(false);
    setEditingItem(null);
    if (editingItem) {
      // Update selected item if it was being edited
      const updatedItem = { ...editingItem, ...itemData };
      setSelectedItem(updatedItem);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading negative items...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No Negative Items Found</h3>
            <p className="text-gray-600 mb-6">
              Great news! We didn't find any negative items in your credit reports, or they're still being analyzed.
            </p>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors mx-auto"
            >
              <PlusIcon className="w-5 h-5" />
              Create Item
            </button>
          </div>
        </div>
        <NegativeItemForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          creditProfileId={creditProfileId}
        />
        {deletingItem && (
          <CreditItemDeleteModal
            isOpen={!!deletingItem}
            onClose={() => setDeletingItem(null)}
            onConfirm={handleDeleteConfirm}
            itemType="negative"
            itemName={deletingItem.accountName || deletingItem.creditorName || 'Unknown Account'}
            itemDetails={`${deletingItem.bureau.charAt(0).toUpperCase() + deletingItem.bureau.slice(1)} - ${deletingItem.itemType.replace(/_/g, ' ')}`}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-full flex overflow-hidden min-h-0">
      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide min-h-0 min-w-0">
        {/* Header with Create Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">Negative Items</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Item
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id || index}
              className={`relative text-left p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
                selectedItem === item
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-gold-200 bg-white hover:border-gold-300'
              }`}
            >
              <button
                onClick={() => setSelectedItem(item)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-black text-sm line-clamp-1">
                    {item.accountName || item.creditorName || 'Unknown Account'}
                  </h4>
                  {item.isPaid && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Type:</span> {item.itemType.replace(/_/g, ' ')}
                  </p>
                  {item.itemSubtype && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Subtype:</span> {item.itemSubtype.replace(/_/g, ' ')}
                    </p>
                  )}
                  {item.balanceAmount && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Balance:</span> {formatCurrency(item.balanceAmount)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor(item.itemStatus)}`}
                  >
                    {item.itemStatus.replace(/_/g, ' ')}
                  </span>
                  {item.confidenceScore && (
                    <span className="text-xs text-gray-500">
                      {Math.round(item.confidenceScore * 100)}% confidence
                    </span>
                  )}
                </div>
              </button>

              {/* Action Buttons */}
              {item.id && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => handleEdit(item, e)}
                    className="p-1.5 bg-white border-2 border-gold-200 rounded hover:bg-gold-50 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-1.5 bg-white border-2 border-red-200 rounded hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <XCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No items match your filters</p>
          </div>
        )}
      </div>

      {/* Item Detail Sidebar */}
      {selectedItem && (
        <div className="w-96 border-l-2 border-gold-200 bg-white overflow-y-auto scrollbar-hide flex-shrink-0 min-h-0">
          <div className="flex items-center justify-between p-4 border-b-2 border-gold-200">
            <h3 className="text-lg font-bold text-black">Item Details</h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircleIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            {/* Bureau & Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Bureau & Status</h4>
              <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Bureau:</span>
                  <p className="text-black capitalize">{selectedItem.bureau}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-black">{selectedItem.itemStatus.replace(/_/g, ' ')}</p>
                </div>
                {selectedItem.reviewStatus && (
                  <div>
                    <span className="font-medium text-gray-700">Review Status:</span>
                    <p className="text-black capitalize">{selectedItem.reviewStatus}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Account Information</h4>
              <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                {selectedItem.accountName && (
                  <div>
                    <span className="font-medium text-gray-700">Account Name:</span>
                    <p className="text-black">{selectedItem.accountName}</p>
                  </div>
                )}
                {selectedItem.accountNumber && (
                  <div>
                    <span className="font-medium text-gray-700">Account Number:</span>
                    <p className="text-black font-mono">{selectedItem.accountNumber}</p>
                  </div>
                )}
                {selectedItem.creditorName && (
                  <div>
                    <span className="font-medium text-gray-700">Creditor:</span>
                    <p className="text-black">{selectedItem.creditorName}</p>
                  </div>
                )}
                {selectedItem.originalCreditor && (
                  <div>
                    <span className="font-medium text-gray-700">Original Creditor:</span>
                    <p className="text-black">{selectedItem.originalCreditor}</p>
                  </div>
                )}
                {selectedItem.collectionAgency && (
                  <div>
                    <span className="font-medium text-gray-700">Collection Agency:</span>
                    <p className="text-black">{selectedItem.collectionAgency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Classification */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Classification</h4>
              <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-black">{selectedItem.itemType.replace(/_/g, ' ')}</p>
                </div>
                {selectedItem.itemSubtype && (
                  <div>
                    <span className="font-medium text-gray-700">Subtype:</span>
                    <p className="text-black">{selectedItem.itemSubtype.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {selectedItem.daysLate && (
                  <div>
                    <span className="font-medium text-gray-700">Days Late:</span>
                    <p className="text-black">{selectedItem.daysLate}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            {(selectedItem.balanceAmount || selectedItem.originalAmount || selectedItem.creditLimit || selectedItem.monthlyPayment) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Financial Details</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  {selectedItem.balanceAmount !== null && selectedItem.balanceAmount !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Balance:</span>
                      <p className="text-black">{formatCurrency(selectedItem.balanceAmount)}</p>
                    </div>
                  )}
                  {selectedItem.originalAmount && (
                    <div>
                      <span className="font-medium text-gray-700">Original Amount:</span>
                      <p className="text-black">{formatCurrency(selectedItem.originalAmount)}</p>
                    </div>
                  )}
                  {selectedItem.creditLimit && (
                    <div>
                      <span className="font-medium text-gray-700">Credit Limit:</span>
                      <p className="text-black">{formatCurrency(selectedItem.creditLimit)}</p>
                    </div>
                  )}
                  {selectedItem.monthlyPayment && (
                    <div>
                      <span className="font-medium text-gray-700">Monthly Payment:</span>
                      <p className="text-black">{formatCurrency(selectedItem.monthlyPayment)}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Paid:</span>
                    <p className="text-black">{selectedItem.isPaid ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            {(selectedItem.dateOpened || selectedItem.dateReported || selectedItem.dateOfFirstDelinquency || selectedItem.dateClosed || selectedItem.lastPaymentDate) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Important Dates</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  {selectedItem.dateOpened && (
                    <div>
                      <span className="font-medium text-gray-700">Date Opened:</span>
                      <p className="text-black">{new Date(selectedItem.dateOpened).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedItem.dateReported && (
                    <div>
                      <span className="font-medium text-gray-700">Date Reported:</span>
                      <p className="text-black">{new Date(selectedItem.dateReported).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedItem.dateOfFirstDelinquency && (
                    <div>
                      <span className="font-medium text-gray-700">Date of First Delinquency:</span>
                      <p className="text-black">{new Date(selectedItem.dateOfFirstDelinquency).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedItem.dateClosed && (
                    <div>
                      <span className="font-medium text-gray-700">Date Closed:</span>
                      <p className="text-black">{new Date(selectedItem.dateClosed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedItem.lastPaymentDate && (
                    <div>
                      <span className="font-medium text-gray-700">Last Payment Date:</span>
                      <p className="text-black">{new Date(selectedItem.lastPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dispute Information */}
            {(selectedItem.isDisputed || selectedItem.disputeStatus || selectedItem.isVerified) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Dispute Information</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Disputed:</span>
                    <p className="text-black">{selectedItem.isDisputed ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedItem.disputeStatus && (
                    <div>
                      <span className="font-medium text-gray-700">Dispute Status:</span>
                      <p className="text-black">{selectedItem.disputeStatus}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Verified:</span>
                    <p className="text-black">{selectedItem.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Violations */}
            {selectedItem.complianceViolations && selectedItem.complianceViolations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Compliance Violations</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Violations:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {selectedItem.complianceViolations.map((violation, idx) => (
                        <li key={idx} className="text-black">{violation.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                  {selectedItem.violationDetails && (
                    <div>
                      <span className="font-medium text-gray-700">Details:</span>
                      <pre className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{JSON.stringify(selectedItem.violationDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parsing Metadata */}
            {(selectedItem.parsingMethod || selectedItem.confidenceScore || selectedItem.pageNumber || selectedItem.parsedAt) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Parsing Metadata</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  {selectedItem.parsingMethod && (
                    <div>
                      <span className="font-medium text-gray-700">Parsing Method:</span>
                      <p className="text-black capitalize">{selectedItem.parsingMethod}</p>
                    </div>
                  )}
                  {selectedItem.confidenceScore !== null && selectedItem.confidenceScore !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Confidence Score:</span>
                      <p className="text-black">{Math.round(selectedItem.confidenceScore * 100)}%</p>
                    </div>
                  )}
                  {selectedItem.pageNumber && (
                    <div>
                      <span className="font-medium text-gray-700">Page Number:</span>
                      <p className="text-black">{selectedItem.pageNumber}</p>
                    </div>
                  )}
                  {selectedItem.parsedAt && (
                    <div>
                      <span className="font-medium text-gray-700">Parsed At:</span>
                      <p className="text-black">{new Date(selectedItem.parsedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Information */}
            {(selectedItem.reviewedAt || selectedItem.reviewNotes) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Review Information</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3 space-y-2 text-sm">
                  {selectedItem.reviewedAt && (
                    <div>
                      <span className="font-medium text-gray-700">Reviewed At:</span>
                      <p className="text-black">{new Date(selectedItem.reviewedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedItem.reviewNotes && (
                    <div>
                      <span className="font-medium text-gray-700">Review Notes:</span>
                      <p className="text-black whitespace-pre-wrap">{selectedItem.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw Text */}
            {selectedItem.rawText && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Raw Text</h4>
                <div className="bg-gold-50 border-2 border-gold-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-hide">{selectedItem.rawText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <NegativeItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        creditProfileId={creditProfileId}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <CreditItemDeleteModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
          itemType="negative"
          itemName={deletingItem.accountName || deletingItem.creditorName || 'Unknown Account'}
          itemDetails={`${deletingItem.bureau.charAt(0).toUpperCase() + deletingItem.bureau.slice(1)} - ${deletingItem.itemType.replace(/_/g, ' ')}`}
        />
      )}
    </div>
  );
}

