'use client';

import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { IdentityDetailsStep } from './IdentityDetailsStep';
import { CreditRestorationService } from '../services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import type { IdentityDetails } from '../types';

export function CreditProfileStepper() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<IdentityDetails | null>(null);
  const { success, error: showError } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  // Check for stored form data after login and auto-submit
  useEffect(() => {
    if (user) {
      const storedData = sessionStorage.getItem('credit_profile_data');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData) as IdentityDetails;
          setInitialData(parsedData);
          sessionStorage.removeItem('credit_profile_data');
          // Auto-submit if user just logged in with stored data
          handleAutoSubmit(parsedData);
        } catch (error) {
          console.error('Error parsing stored form data:', error);
          sessionStorage.removeItem('credit_profile_data');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAutoSubmit = async (identityDetails: IdentityDetails) => {
    setIsSubmitting(true);
    try {
      await CreditRestorationService.createCreditProfile(identityDetails);
      success('Credit profile created successfully');
      router.push('/account/credit/app');
    } catch (error) {
      console.error('Error creating credit profile:', error);
      showError(error instanceof Error ? error.message : 'Failed to create credit profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (identityDetails: IdentityDetails) => {
    // If user is not logged in, redirect to signup/login with form data
    if (!user) {
      // Store form data in sessionStorage to restore after login
      sessionStorage.setItem('credit_profile_data', JSON.stringify(identityDetails));
      router.push(`/login?redirect=/account/credit&message=Please sign in to create your credit profile`);
      return;
    }

    // User is logged in, create profile
    setIsSubmitting(true);
    try {
      await CreditRestorationService.createCreditProfile(identityDetails);
      success('Credit profile created successfully');
      router.push('/account/credit/app');
    } catch (error) {
      console.error('Error creating credit profile:', error);
      showError(error instanceof Error ? error.message : 'Failed to create credit profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gold-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">
            Credit Restoration
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            {user 
              ? "Get started by creating your credit profile. We'll help you restore your credit step by step."
              : "Start your credit restoration journey. Enter your information below and we'll guide you through the process."
            }
          </p>
          {!user && (
            <p className="text-sm text-gray-600 mt-2">
              You'll be asked to sign in after submitting your information
            </p>
          )}
        </div>

        {/* Stepper Form */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-lg">
                  1
                </div>
                <div className="w-32 h-1 bg-gold-500 mx-2"></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                  <CheckIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-black mb-2">Identity Details</h2>
              <p className="text-gray-600">Enter your personal information to get started</p>
            </div>
          </div>

          <IdentityDetailsStep
            initialData={initialData}
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

