'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { NegativeItem, NegativeItemType, NegativeItemStatus } from '../types';

interface NegativeItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<NegativeItem, 'id' | 'creditProfileId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: NegativeItem | null;
  creditProfileId: string;
}

const BUREAUS: Array<'experian' | 'equifax' | 'transunion'> = ['experian', 'equifax', 'transunion'];

const ITEM_TYPES: NegativeItemType[] = [
  'LATE_PAYMENT',
  'COLLECTION',
  'CHARGE_OFF',
  'REPOSSESSION',
  'FORECLOSURE',
  'BANKRUPTCY',
  'PUBLIC_RECORD',
  'TAX_LIEN',
  'CIVIL_JUDGMENT',
  'SETTLEMENT',
  'DELINQUENCY',
  'DEROGATORY_TRADELINE',
];

const ITEM_STATUSES: NegativeItemStatus[] = [
  'DEROGATORY',
  'ADVERSE',
  'NEGATIVE',
  'PAST_DUE',
  'PAST_DUE_WITH_AMOUNT',
  'PAST_DUE_NO_AMOUNT',
  'CHARGE_OFF',
  'COLLECTION',
  'SETTLED',
  'SETTLED_LESS_THAN_FULL',
  'PAID',
  'PAID_IN_FULL',
  'PAID_DEROGATORY',
  'PAID_COLLECTION',
  'PAID_CHARGE_OFF',
  'PAID_LATE',
  'ACCOUNT_CLOSED',
  'CLOSED_BY_GRANTOR',
  'DISPUTE',
  'DISPUTE_RESOLVED',
];

export function NegativeItemForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  creditProfileId,
}: NegativeItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bureau: 'experian' as 'experian' | 'equifax' | 'transunion',
    itemType: 'COLLECTION' as NegativeItemType,
    itemSubtype: '',
    itemStatus: 'COLLECTION' as NegativeItemStatus,
    accountName: '',
    accountNumber: '',
    creditorName: '',
    originalCreditor: '',
    collectionAgency: '',
    dateOpened: '',
    dateReported: '',
    dateOfFirstDelinquency: '',
    dateClosed: '',
    lastPaymentDate: '',
    balanceAmount: '',
    originalAmount: '',
    creditLimit: '',
    monthlyPayment: '',
    isPaid: false,
    isDisputed: false,
    isVerified: false,
    disputeStatus: '',
    rawText: '',
    reviewNotes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        bureau: initialData.bureau,
        itemType: initialData.itemType,
        itemSubtype: initialData.itemSubtype || '',
        itemStatus: initialData.itemStatus,
        accountName: initialData.accountName || '',
        accountNumber: initialData.accountNumber || '',
        creditorName: initialData.creditorName || '',
        originalCreditor: initialData.originalCreditor || '',
        collectionAgency: initialData.collectionAgency || '',
        dateOpened: initialData.dateOpened ? initialData.dateOpened.split('T')[0] : '',
        dateReported: initialData.dateReported ? initialData.dateReported.split('T')[0] : '',
        dateOfFirstDelinquency: initialData.dateOfFirstDelinquency ? initialData.dateOfFirstDelinquency.split('T')[0] : '',
        dateClosed: initialData.dateClosed ? initialData.dateClosed.split('T')[0] : '',
        lastPaymentDate: initialData.lastPaymentDate ? initialData.lastPaymentDate.split('T')[0] : '',
        balanceAmount: initialData.balanceAmount?.toString() || '',
        originalAmount: initialData.originalAmount?.toString() || '',
        creditLimit: initialData.creditLimit?.toString() || '',
        monthlyPayment: initialData.monthlyPayment?.toString() || '',
        isPaid: initialData.isPaid || false,
        isDisputed: initialData.isDisputed || false,
        isVerified: initialData.isVerified || false,
        disputeStatus: initialData.disputeStatus || '',
        rawText: initialData.rawText || '',
        reviewNotes: initialData.reviewNotes || '',
      });
    } else {
      // Reset form for new item
      setFormData({
        bureau: 'experian',
        itemType: 'COLLECTION',
        itemSubtype: '',
        itemStatus: 'COLLECTION',
        accountName: '',
        accountNumber: '',
        creditorName: '',
        originalCreditor: '',
        collectionAgency: '',
        dateOpened: '',
        dateReported: '',
        dateOfFirstDelinquency: '',
        dateClosed: '',
        lastPaymentDate: '',
        balanceAmount: '',
        originalAmount: '',
        creditLimit: '',
        monthlyPayment: '',
        isPaid: false,
        isDisputed: false,
        isVerified: false,
        disputeStatus: '',
        rawText: '',
        reviewNotes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        bureau: formData.bureau,
        itemType: formData.itemType,
        itemSubtype: formData.itemSubtype || null,
        itemStatus: formData.itemStatus,
        accountName: formData.accountName || null,
        accountNumber: formData.accountNumber || null,
        creditorName: formData.creditorName || null,
        originalCreditor: formData.originalCreditor || null,
        collectionAgency: formData.collectionAgency || null,
        dateOpened: formData.dateOpened || null,
        dateReported: formData.dateReported || null,
        dateOfFirstDelinquency: formData.dateOfFirstDelinquency || null,
        dateClosed: formData.dateClosed || null,
        lastPaymentDate: formData.lastPaymentDate || null,
        balanceAmount: formData.balanceAmount ? parseFloat(formData.balanceAmount) : null,
        originalAmount: formData.originalAmount ? parseFloat(formData.originalAmount) : null,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
        monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : null,
        isPaid: formData.isPaid,
        isDisputed: formData.isDisputed,
        isVerified: formData.isVerified,
        disputeStatus: formData.disputeStatus || null,
        rawText: formData.rawText || null,
        reviewNotes: formData.reviewNotes || null,
        parsingMethod: 'manual',
        reviewStatus: 'pending',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide m-4">
        <div className="sticky top-0 bg-white border-b-2 border-gold-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">
            {initialData ? 'Edit Negative Item' : 'Create Negative Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black border-b-2 border-gold-200 pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bureau *
                </label>
                <select
                  value={formData.bureau}
                  onChange={(e) => setFormData({ ...formData, bureau: e.target.value as any })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                >
                  {BUREAUS.map(bureau => (
                    <option key={bureau} value={bureau}>
                      {bureau.charAt(0).toUpperCase() + bureau.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Type *
                </label>
                <select
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value as NegativeItemType })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                >
                  {ITEM_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Status *
                </label>
                <select
                  value={formData.itemStatus}
                  onChange={(e) => setFormData({ ...formData, itemStatus: e.target.value as NegativeItemStatus })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                >
                  {ITEM_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Subtype
                </label>
                <input
                  type="text"
                  value={formData.itemSubtype}
                  onChange={(e) => setFormData({ ...formData, itemSubtype: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="e.g., UNPAID_COLLECTION"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black border-b-2 border-gold-200 pb-2">
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creditor Name
                </label>
                <input
                  type="text"
                  value={formData.creditorName}
                  onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Creditor
                </label>
                <input
                  type="text"
                  value={formData.originalCreditor}
                  onChange={(e) => setFormData({ ...formData, originalCreditor: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Agency
                </label>
                <input
                  type="text"
                  value={formData.collectionAgency}
                  onChange={(e) => setFormData({ ...formData, collectionAgency: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black border-b-2 border-gold-200 pb-2">
              Financial Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balanceAmount}
                  onChange={(e) => setFormData({ ...formData, balanceAmount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Paid</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDisputed}
                    onChange={(e) => setFormData({ ...formData, isDisputed: e.target.checked })}
                    className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Disputed</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Verified</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black border-b-2 border-gold-200 pb-2">
              Important Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Opened
                </label>
                <input
                  type="date"
                  value={formData.dateOpened}
                  onChange={(e) => setFormData({ ...formData, dateOpened: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Reported
                </label>
                <input
                  type="date"
                  value={formData.dateReported}
                  onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of First Delinquency
                </label>
                <input
                  type="date"
                  value={formData.dateOfFirstDelinquency}
                  onChange={(e) => setFormData({ ...formData, dateOfFirstDelinquency: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Closed
                </label>
                <input
                  type="date"
                  value={formData.dateClosed}
                  onChange={(e) => setFormData({ ...formData, dateClosed: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Payment Date
                </label>
                <input
                  type="date"
                  value={formData.lastPaymentDate}
                  onChange={(e) => setFormData({ ...formData, lastPaymentDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispute Status
                </label>
                <input
                  type="text"
                  value={formData.disputeStatus}
                  onChange={(e) => setFormData({ ...formData, disputeStatus: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black border-b-2 border-gold-200 pb-2">
              Additional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raw Text
              </label>
              <textarea
                value={formData.rawText}
                onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Original text from credit report..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Notes
              </label>
              <textarea
                value={formData.reviewNotes}
                onChange={(e) => setFormData({ ...formData, reviewNotes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Notes about this item..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t-2 border-gold-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



