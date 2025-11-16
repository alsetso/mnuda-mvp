'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useCreditDashboard } from '../layout';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';
import { CreditItemDeleteModal } from '@/features/credit/components/CreditItemDeleteModal';
import { CreditRestorationService } from '@/features/credit/services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { CreditLetter } from '@/features/credit/types';
import DOMPurify from 'dompurify';
import { exportLetterToPDF } from '@/features/credit/utils/letterExport';

export default function CreditLettersPage() {
  const router = useRouter();
  const { profile, letters, refreshLetters } = useCreditDashboard();
  const { success, error: showError } = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<CreditLetter | null>(null);

  if (!profile) {
    return null;
  }

  const getBureauDisplayName = (bureau: string) => {
    return bureau.charAt(0).toUpperCase() + bureau.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleEdit = (letter: CreditLetter) => {
    router.push(`/credit/app/letters/${letter.id}/edit`);
  };

  const handleDeleteClick = (letter: CreditLetter) => {
    setLetterToDelete(letter);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!letterToDelete) return;

    try {
      await CreditRestorationService.deleteCreditLetter(letterToDelete.id);
      success('Letter deleted successfully');
      refreshLetters();
      setDeleteModalOpen(false);
      setLetterToDelete(null);
    } catch (err) {
      console.error('Error deleting letter:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete letter');
      throw err; // Re-throw so modal can handle it
    }
  };

  const handleExportPDF = async (letter: CreditLetter) => {
    try {
      await exportLetterToPDF({
        subject: letter.subject || undefined,
        content: letter.content || '',
        bureau: letter.bureau,
        letterType: letter.letterType,
        sentAt: letter.sentAt || undefined,
        receivedAt: letter.receivedAt || undefined,
      });
      success('PDF exported successfully');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      showError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  return (
    <>
      <PageLayout 
        showHeader={true} 
        showFooter={false} 
        containerMaxWidth="full" 
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <CreditBreadcrumbs
              items={[
                { label: 'Credit App', href: '/credit/app' },
                { label: 'Credit Letters' },
              ]}
            />
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-black">Credit Letters</h1>
              <button
                onClick={() => router.push('/credit/app/letters/new')}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create Letter
              </button>
            </div>

            {letters.length === 0 ? (
              <div className="bg-white border-2 border-gold-200 rounded-xl p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No letters tracked yet.</p>
                <button
                  onClick={() => router.push('/credit/app/letters/new')}
                  className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors"
                >
                  Create Your First Letter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="bg-white border-2 border-gold-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-black">
                          {getBureauDisplayName(letter.bureau)} - {letter.letterType === 'sent' ? 'Sent' : 'Received'}
                        </h3>
                        {letter.subject && (
                          <p className="text-gray-600 mt-1">{letter.subject}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(letter.status)}`}>
                          {letter.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExportPDF(letter)}
                            className="p-2 hover:bg-gold-50 rounded-lg transition-colors"
                            title="Export to PDF"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(letter)}
                            className="p-2 hover:bg-gold-50 rounded-lg transition-colors"
                            title="Edit letter"
                          >
                            <PencilIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(letter)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete letter"
                          >
                            <TrashIcon className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {letter.content && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Content</p>
                        <div
                          className="prose prose-sm max-w-none text-black"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(letter.content),
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {letter.sentAt && (
                        <div>
                          <p className="text-gray-600 mb-1">Sent</p>
                          <p className="font-semibold text-black">
                            {new Date(letter.sentAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                      {letter.receivedAt && (
                        <div>
                          <p className="text-gray-600 mb-1">Received</p>
                          <p className="font-semibold text-black">
                            {new Date(letter.receivedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageLayout>

      {/* Delete Modal */}
      <CreditItemDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLetterToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemType="letter"
        itemName={letterToDelete?.subject || `${letterToDelete?.bureau.charAt(0).toUpperCase()}${letterToDelete?.bureau.slice(1)} Letter`}
        itemDetails={letterToDelete ? `${letterToDelete.letterType === 'sent' ? 'Sent' : 'Received'} letter` : undefined}
      />
    </>
  );
}

