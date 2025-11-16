'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreditRestorationService } from '../services/creditRestorationService';
import type { CreditLetter } from '../types';
import { useToast } from '@/features/ui/hooks/useToast';

interface CreditLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creditProfileId: string;
  initialData?: CreditLetter | null;
}

const bureaus = [
  { value: 'experian' as const, label: 'Experian' },
  { value: 'equifax' as const, label: 'Equifax' },
  { value: 'transunion' as const, label: 'TransUnion' },
];

const letterTypes = [
  { value: 'sent' as const, label: 'Sent' },
  { value: 'received' as const, label: 'Received' },
];

const statuses = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'sent' as const, label: 'Sent' },
  { value: 'received' as const, label: 'Received' },
  { value: 'archived' as const, label: 'Archived' },
];

export function CreditLetterModal({
  isOpen,
  onClose,
  onSuccess,
  creditProfileId,
  initialData,
}: CreditLetterModalProps) {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    bureau: 'experian' as 'experian' | 'equifax' | 'transunion',
    letterType: 'sent' as 'sent' | 'received',
    subject: '',
    content: '',
    storagePath: '',
    sentAt: '',
    receivedAt: '',
    status: 'draft' as 'draft' | 'sent' | 'received' | 'archived',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        bureau: initialData.bureau,
        letterType: initialData.letterType,
        subject: initialData.subject || '',
        content: initialData.content || '',
        storagePath: initialData.storagePath || '',
        sentAt: initialData.sentAt ? new Date(initialData.sentAt).toISOString().split('T')[0] : '',
        receivedAt: initialData.receivedAt ? new Date(initialData.receivedAt).toISOString().split('T')[0] : '',
        status: initialData.status,
      });
    } else {
      setFormData({
        bureau: 'experian',
        letterType: 'sent',
        subject: '',
        content: '',
        storagePath: '',
        sentAt: '',
        receivedAt: '',
        status: 'draft',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const letterData = {
        bureau: formData.bureau,
        letterType: formData.letterType,
        subject: formData.subject.trim() || undefined,
        content: formData.content.trim() || undefined,
        storagePath: formData.storagePath.trim() || undefined,
        sentAt: formData.sentAt ? new Date(formData.sentAt).toISOString() : undefined,
        receivedAt: formData.receivedAt ? new Date(formData.receivedAt).toISOString() : undefined,
        status: formData.status,
      };

      if (initialData) {
        await CreditRestorationService.updateCreditLetter(initialData.id, letterData);
        success('Letter updated successfully');
      } else {
        await CreditRestorationService.createCreditLetter(
          creditProfileId,
          letterData.bureau,
          letterData.letterType,
          {
            subject: letterData.subject,
            content: letterData.content,
            storagePath: letterData.storagePath,
            sentAt: letterData.sentAt,
            receivedAt: letterData.receivedAt,
            status: letterData.status,
          }
        );
        success('Letter created successfully');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving letter:', err);
      showError(err instanceof Error ? err.message : 'Failed to save letter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      bureau: 'experian',
      letterType: 'sent',
      subject: '',
      content: '',
      storagePath: '',
      sentAt: '',
      receivedAt: '',
      status: 'draft',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide m-4">
        <div className="sticky top-0 bg-white border-b-2 border-gold-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">
            {initialData ? 'Edit Credit Letter' : 'Create Credit Letter'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Bureau Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit Bureau <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {bureaus.map((bureau) => (
                <button
                  key={bureau.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, bureau: bureau.value }))}
                  className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all ${
                    formData.bureau === bureau.value
                      ? 'border-gold-500 bg-gold-50 text-black'
                      : 'border-gold-200 bg-white text-gray-700 hover:border-gold-300'
                  }`}
                >
                  {bureau.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Letter Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {letterTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, letterType: type.value }))}
                  className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all ${
                    formData.letterType === type.value
                      ? 'border-gold-500 bg-gold-50 text-black'
                      : 'border-gold-200 bg-white text-gray-700 hover:border-gold-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as 'draft' | 'sent' | 'received' | 'archived',
                }))
              }
              className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none"
              required
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none"
              placeholder="Enter letter subject"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none resize-y"
              placeholder="Enter letter content"
            />
          </div>

          {/* Storage Path */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Storage Path</label>
            <input
              type="text"
              value={formData.storagePath}
              onChange={(e) => setFormData((prev) => ({ ...prev, storagePath: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none"
              placeholder="Path to stored file (if applicable)"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.letterType === 'sent' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sent Date</label>
                <input
                  type="date"
                  value={formData.sentAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sentAt: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none"
                />
              </div>
            )}
            {formData.letterType === 'received' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Received Date</label>
                <input
                  type="date"
                  value={formData.receivedAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, receivedAt: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:border-gold-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 border-2 border-gold-200 text-gray-700 font-semibold rounded-lg hover:bg-gold-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update Letter' : 'Create Letter'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

