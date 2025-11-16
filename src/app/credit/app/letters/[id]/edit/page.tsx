'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from '../../../layout';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';
import { CreditLetterEditor } from '@/features/credit/components/CreditLetterEditor';
import { CreditRestorationService } from '@/features/credit/services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import { exportLetterToPDF } from '@/features/credit/utils/letterExport';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { CreditLetter } from '@/features/credit/types';

const bureaus = [
  { value: 'experian' as const, label: 'Experian' },
  { value: 'equifax' as const, label: 'Equifax' },
  { value: 'transunion' as const, label: 'TransUnion' },
];

const letterTypes = [
  { value: 'sent' as const, label: 'Sent' },
  { value: 'received' as const, label: 'Received' },
];

export default function EditCreditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;
  const { profile, letters, refreshLetters } = useCreditDashboard();
  const { success, error: showError } = useToast();
  const [letter, setLetter] = useState<CreditLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    bureau: 'experian' as 'experian' | 'equifax' | 'transunion',
    letterType: 'sent' as 'sent' | 'received',
    subject: '',
    content: '',
    sentAt: '',
    receivedAt: '',
    status: 'draft' as 'draft' | 'sent' | 'received' | 'archived',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (letters.length > 0 && letterId) {
      const foundLetter = letters.find((l) => l.id === letterId);
      if (foundLetter) {
        setLetter(foundLetter);
        setFormData({
          bureau: foundLetter.bureau,
          letterType: foundLetter.letterType,
          subject: foundLetter.subject || '',
          content: foundLetter.content || '',
          sentAt: foundLetter.sentAt ? new Date(foundLetter.sentAt).toISOString().split('T')[0] : '',
          receivedAt: foundLetter.receivedAt ? new Date(foundLetter.receivedAt).toISOString().split('T')[0] : '',
          status: foundLetter.status,
        });
        setIsLoading(false);
      } else {
        showError('Letter not found');
        router.push('/credit/app/letters');
      }
    }
  }, [letters, letterId, router, showError]);

  if (!profile) {
    return null;
  }

  if (isLoading) {
    return (
      <PageLayout
        showHeader={true}
        showFooter={false}
        containerMaxWidth="full"
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading letter...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!letter) {
    return null;
  }

  const handleSave = async (status?: 'draft' | 'sent' | 'received' | 'archived') => {
    if (!formData.subject.trim() && !formData.content.trim()) {
      showError('Please add a subject or content before saving');
      return;
    }

    setIsSaving(true);
    try {
      await CreditRestorationService.updateCreditLetter(letter.id, {
        bureau: formData.bureau,
        letterType: formData.letterType,
        subject: formData.subject.trim() || undefined,
        content: formData.content.trim() || undefined,
        sentAt: formData.sentAt ? new Date(formData.sentAt).toISOString() : undefined,
        receivedAt: formData.receivedAt ? new Date(formData.receivedAt).toISOString() : undefined,
        status: status || formData.status,
      });
      success('Letter updated successfully');
      refreshLetters();
      router.push('/credit/app/letters');
    } catch (err) {
      console.error('Error updating letter:', err);
      showError(err instanceof Error ? err.message : 'Failed to update letter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formData.content.trim()) {
      showError('Please add content before exporting');
      return;
    }

    try {
      await exportLetterToPDF({
        subject: formData.subject,
        content: formData.content,
        bureau: formData.bureau,
        letterType: formData.letterType,
        sentAt: formData.sentAt,
        receivedAt: formData.receivedAt,
      });
      success('PDF exported successfully');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      showError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <CreditBreadcrumbs
            items={[
              { label: 'Credit App', href: '/credit/app' },
              { label: 'Credit Letters', href: '/credit/app/letters' },
              { label: 'Edit Letter' },
            ]}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gold-50 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-black">Edit Letter</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                disabled={!formData.content.trim()}
                className="px-4 py-2 border-2 border-gold-200 text-gray-700 font-semibold rounded-lg hover:bg-gold-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="px-4 py-2 border-2 border-gold-200 text-gray-700 font-semibold rounded-lg hover:bg-gold-50 transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave(formData.letterType === 'sent' ? 'sent' : 'received')}
                disabled={isSaving}
                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Letter</span>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border-2 border-gold-200 rounded-xl p-6 space-y-6">
            {/* Bureau and Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
              <CreditLetterEditor
                content={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                placeholder="Start writing your letter..."
              />
            </div>

            {/* Date Fields */}
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
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

