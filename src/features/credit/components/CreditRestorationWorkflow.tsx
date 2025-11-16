'use client';

import { useState } from 'react';
import { CheckIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { IdentityDetailsStep } from './IdentityDetailsStep';
import { CreditReportUploadStep } from './CreditReportUploadStep';
import { ReviewStep } from './ReviewStep';
import { CreditRestorationService } from '../services/creditRestorationService';
import { useToast } from '@/features/ui/hooks/useToast';
import type { IdentityDetails, CreditReportFile } from '../types';

export function CreditRestorationWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [identityDetails, setIdentityDetails] = useState<IdentityDetails | null>(null);
  const [experianReport, setExperianReport] = useState<CreditReportFile | null>(null);
  const [equifaxReport, setEquifaxReport] = useState<CreditReportFile | null>(null);
  const [transUnionReport, setTransUnionReport] = useState<CreditReportFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { success, error: showError } = useToast();

  const steps = [
    {
      id: 'identity',
      title: 'Identity Details',
      description: 'Enter your personal information',
    },
    {
      id: 'experian',
      title: 'Experian Report',
      description: 'Upload your Experian credit report',
    },
    {
      id: 'equifax',
      title: 'Equifax Report',
      description: 'Upload your Equifax credit report',
    },
    {
      id: 'transunion',
      title: 'TransUnion Report',
      description: 'Upload your TransUnion credit report',
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit',
    },
  ];

  const handleIdentitySubmit = (details: IdentityDetails) => {
    setIdentityDetails(details);
    setCurrentStep(1);
  };

  const handleReportUpload = (bureau: 'experian' | 'equifax' | 'transunion', file: CreditReportFile) => {
    if (bureau === 'experian') {
      setExperianReport(file);
      setCurrentStep(2);
    } else if (bureau === 'equifax') {
      setEquifaxReport(file);
      setCurrentStep(3);
    } else if (bureau === 'transunion') {
      setTransUnionReport(file);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!identityDetails || !experianReport || !equifaxReport || !transUnionReport) {
      showError('Missing Information', 'Please complete all steps before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = await CreditRestorationService.submitRestorationRequest({
        identityDetails,
        reports: {
          experian: experianReport,
          equifax: equifaxReport,
          transunion: transUnionReport,
        },
      });

      success('Request Submitted', 'Your credit restoration request has been submitted successfully.');
      setIsSubmitted(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/credit';
      }, 2000);
    } catch (err) {
      showError('Submission Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return identityDetails !== null;
      case 1:
        return experianReport !== null;
      case 2:
        return equifaxReport !== null;
      case 3:
        return transUnionReport !== null;
      case 4:
        return false; // Review step is never "complete" until submitted
      default:
        return false;
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckIcon className="w-12 h-12 text-black" />
        </div>
        <h2 className="text-3xl font-bold text-black mb-4">Request Submitted Successfully</h2>
        <p className="text-lg text-gray-600 mb-6">
          Your credit restoration request has been received. Our team will review your information and begin processing your credit repair.
        </p>
        <p className="text-sm text-gray-500">
          You'll receive updates via email as we progress through your credit restoration.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-gold-500 border-gold-500'
                      : index === currentStep
                      ? 'bg-gold-100 border-gold-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckIcon className="w-6 h-6 text-black" />
                  ) : (
                    <span
                      className={`text-sm font-bold ${
                        index === currentStep ? 'text-gold-600' : 'text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold ${
                      index <= currentStep ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                    index < currentStep ? 'bg-gold-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <IdentityDetailsStep
            initialData={identityDetails}
            onSubmit={handleIdentitySubmit}
            onBack={null}
          />
        )}

        {currentStep === 1 && (
          <CreditReportUploadStep
            bureau="experian"
            initialFile={experianReport}
            onUpload={(file) => handleReportUpload('experian', file)}
            onBack={handleBack}
          />
        )}

        {currentStep === 2 && (
          <CreditReportUploadStep
            bureau="equifax"
            initialFile={equifaxReport}
            onUpload={(file) => handleReportUpload('equifax', file)}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <CreditReportUploadStep
            bureau="transunion"
            initialFile={transUnionReport}
            onUpload={(file) => handleReportUpload('transunion', file)}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            identityDetails={identityDetails!}
            reports={{
              experian: experianReport!,
              equifax: equifaxReport!,
              transunion: transUnionReport!,
            }}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

