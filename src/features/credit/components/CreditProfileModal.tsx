'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { IdentityDetailsStep } from './IdentityDetailsStep';
import { CreditRestorationService } from '../services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import type { IdentityDetails } from '../types';

interface CreditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated?: () => void;
}

export function CreditProfileModal({ isOpen, onClose, onProfileCreated }: CreditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (identityDetails: IdentityDetails) => {
    // If user is not logged in, redirect to signup/login with form data
    if (!user) {
      sessionStorage.setItem('credit_profile_data', JSON.stringify(identityDetails));
      router.push(`/login?redirect=/credit&message=Please sign in to create your credit profile`);
      return;
    }

    // User is logged in, create profile
    setIsSubmitting(true);
    try {
      await CreditRestorationService.createCreditProfile(identityDetails);
      success('Credit profile created successfully');
      onClose();
      if (onProfileCreated) {
        onProfileCreated();
      } else {
        router.push('/credit/app');
      }
    } catch (error) {
      console.error('Error creating credit profile:', error);
      showError(error instanceof Error ? error.message : 'Failed to create credit profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide m-4">
        <div className="sticky top-0 bg-white border-b-2 border-gold-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Create Credit Profile</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-lg">
                  1
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Identity Details</h3>
              <p className="text-gray-600">Enter your personal information to get started</p>
            </div>
          </div>

          <IdentityDetailsStep
            initialData={null}
            onSubmit={handleSubmit}
            onBack={null}
          />

          {isSubmitting && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Creating your profile...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

