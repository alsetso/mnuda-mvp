'use client';

import { useState } from 'react';
import { CloudArrowUpIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CreditProfile, CreditReport, NegativeItem, CreditLetter } from '../types';
import { NegativeItemsPanel } from './NegativeItemsPanel';
import { CreditReportUpload } from './CreditReportUpload';
import { CreditReportCard } from './CreditReportCard';
import { CreditLetterModal } from './CreditLetterModal';
import { CreditRestorationService } from '../services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import type { DashboardView } from './CreditDashboardSidebar';

interface CreditDashboardContentProps {
  profile: CreditProfile;
  reports: CreditReport[];
  negatives: NegativeItem[];
  letters: CreditLetter[];
  activeView: DashboardView;
  isLoadingNegatives: boolean;
  onRefreshNegatives: () => void;
  onRefreshReports: () => void;
  onRefreshLetters: () => void;
}

export function CreditDashboardContent({
  profile,
  reports,
  negatives,
  letters,
  activeView,
  isLoadingNegatives,
  onRefreshNegatives,
  onRefreshReports,
  onRefreshLetters,
}: CreditDashboardContentProps) {
  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfileView profile={profile} />;
      case 'reports':
        return <ReportsView reports={reports} creditProfileId={profile.id} onRefresh={onRefreshReports} />;
      case 'negatives':
        return (
          <NegativeItemsPanel
            items={negatives}
            isLoading={isLoadingNegatives}
            onRefresh={onRefreshNegatives}
            creditProfileId={profile.id}
          />
        );
      case 'letters':
        return (
          <LettersView
            letters={letters}
            creditProfileId={profile.id}
            onRefresh={onRefreshLetters}
          />
        );
      default:
        return <ProfileView profile={profile} />;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden bg-gold-100 min-w-0"
      style={{ height: '100%' }}
    >
      {activeView === 'negatives' ? (
        <div className="flex-1 overflow-hidden min-h-0">
          {renderContent()}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide min-h-0">
          {renderContent()}
        </div>
      )}
    </div>
  );
}

function ProfileView({ profile }: { profile: CreditProfile }) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-black mb-6">Profile Status</h1>
      
      <div className="bg-white border-2 border-gold-200 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Full Name</p>
            <p className="font-semibold text-black">
              {profile.firstName} {profile.middleName} {profile.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
            <p className="font-semibold text-black">{profile.dateOfBirth}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-black">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Phone</p>
            <p className="font-semibold text-black">{profile.phone}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gold-200 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-4">Current Address</h2>
        <p className="text-black">
          {profile.address.street}<br />
          {profile.address.city}, {profile.address.state} {profile.address.zipCode}
        </p>
      </div>

      {profile.previousAddresses && profile.previousAddresses.length > 0 && (
        <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-black mb-4">Previous Addresses</h2>
          <div className="space-y-4">
            {profile.previousAddresses.map((addr, idx) => (
              <div key={idx} className="pb-4 border-b border-gold-200 last:border-0">
                <p className="text-black">
                  {addr.street}<br />
                  {addr.city}, {addr.state} {addr.zipCode}
                </p>
                {addr.yearsAtAddress && (
                  <p className="text-sm text-gray-600 mt-1">
                    {addr.yearsAtAddress} years
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsView({ 
  reports, 
  creditProfileId, 
  onRefresh 
}: { 
  reports: CreditReport[]; 
  creditProfileId: string; 
  onRefresh: () => void;
}) {
  const [showUpload, setShowUpload] = useState(false);


  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">Credit Reports</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          {showUpload ? 'Cancel' : 'Upload Report'}
        </button>
      </div>
      
      {/* Upload Component - Toggleable */}
      {showUpload && (
        <div className="mb-6">
          <CreditReportUpload 
            creditProfileId={creditProfileId} 
            onUploadComplete={() => {
              onRefresh();
              setShowUpload(false);
            }}
          />
        </div>
      )}
      
      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="bg-white border-2 border-gold-200 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-lg">No credit reports uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <CreditReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function LettersView({
  letters,
  creditProfileId,
  onRefresh,
}: {
  letters: CreditLetter[];
  creditProfileId: string;
  onRefresh: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<CreditLetter | null>(null);
  const [deletingLetterId, setDeletingLetterId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

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

  const handleCreate = () => {
    setEditingLetter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (letter: CreditLetter) => {
    setEditingLetter(letter);
    setIsModalOpen(true);
  };

  const handleDelete = async (letterId: string) => {
    if (!confirm('Are you sure you want to delete this letter? This action cannot be undone.')) {
      return;
    }

    setDeletingLetterId(letterId);
    try {
      await CreditRestorationService.deleteCreditLetter(letterId);
      success('Letter deleted successfully');
      onRefresh();
    } catch (err) {
      console.error('Error deleting letter:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete letter');
    } finally {
      setDeletingLetterId(null);
    }
  };

  const handleModalSuccess = () => {
    onRefresh();
  };

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black">Credit Letters</h1>
          <button
            onClick={handleCreate}
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
              onClick={handleCreate}
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
                        onClick={() => handleEdit(letter)}
                        className="p-2 hover:bg-gold-50 rounded-lg transition-colors"
                        title="Edit letter"
                      >
                        <PencilIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        disabled={deletingLetterId === letter.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete letter"
                      >
                        {deletingLetterId === letter.id ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {letter.content && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Content</p>
                    <p className="text-black whitespace-pre-wrap">{letter.content}</p>
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

      <CreditLetterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLetter(null);
        }}
        onSuccess={handleModalSuccess}
        creditProfileId={creditProfileId}
        initialData={editingLetter}
      />
    </>
  );
}

