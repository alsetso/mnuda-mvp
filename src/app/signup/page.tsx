'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PricingSelector from '@/components/PricingSelector';
import PremiumInviteStep from '@/components/PremiumInviteStep';

type SignupStep = 'pricing' | 'premium' | 'complete';

interface PricingOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('pricing');
  const [selectedPlan, setSelectedPlan] = useState<PricingOption | null>(null);
  // const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePlanSelect = (plan: PricingOption) => {
    setSelectedPlan(plan);
    setCurrentStep('premium'); // Both plans go to the second step now
  };

  const handleBackToPricing = () => {
    setCurrentStep('pricing');
    setSelectedPlan(null);
  };

  const handleComplete = () => {
    setCurrentStep('complete');
    // Redirect to home or success page after a delay
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-[#014463]">MN</span>
              <span className="text-[#1dd1f5]">UDA</span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-[#1dd1f5] hover:text-[#014463] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'pricing' ? 'text-[#1dd1f5]' : currentStep === 'premium' || currentStep === 'complete' ? 'text-[#014463]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'pricing' ? 'bg-[#1dd1f5] text-white' : 
                currentStep === 'premium' || currentStep === 'complete' ? 'bg-[#014463] text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Choose Plan</span>
            </div>
            
            <div className={`w-8 h-0.5 ${currentStep === 'premium' || currentStep === 'complete' ? 'bg-[#014463]' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep === 'premium' ? 'text-[#1dd1f5]' : currentStep === 'complete' ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'premium' ? 'bg-[#1dd1f5] text-white' : 
                currentStep === 'complete' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Request Access</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {currentStep === 'pricing' && (
            <PricingSelector
              onSelect={handlePlanSelect}
              selectedOption={selectedPlan?.id}
              isLoading={false}
            />
          )}

          {currentStep === 'premium' && selectedPlan && (
            <PremiumInviteStep
              selectedPlan={selectedPlan}
              onBack={handleBackToPricing}
              onComplete={handleComplete}
            />
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Request Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                Thank you for your interest in MNUDA. Our team will review your request and get back to you soon.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to the homepage...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}