'use client';

import { useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { navItems, getNavItemsByCategory } from '@/config/navigation';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();

  // Filter nav items to exclude Home and Settings from the directory
  // Must be called unconditionally (hooks rules)
  const directoryItems = useMemo(() => {
    return navItems.filter(item => item.href !== '/' && item.href !== '/account/settings');
  }, []);

  const categorizedItems = useMemo(() => {
    return getNavItemsByCategory();
  }, []);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <PageLayout showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is logged in, show directory page
  if (user) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
        <div className="min-h-screen py-12 bg-gold-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Value Proposition Section */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
                Minnesota Platform for Under Development & Acquisition
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-6">
                Connect with real estate professionals across Minnesota. Discover development opportunities, 
                property acquisitions, and build your network of developers, investors, and service providers.
              </p>
            </div>

            {/* Directory Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black mb-4 text-center">
                Explore Features
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                Connect, discover, and collaborate with tools designed for real estate development and acquisition.
              </p>

              {/* Grouped by Category */}
              <div className="space-y-12">
                {Array.from(categorizedItems.entries())
                  .filter(([category]) => category !== 'Main' && category !== 'Account')
                  .map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold text-black mb-4 pb-2 border-b border-gray-300">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                                  <Icon className="w-6 h-6 text-gold-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-bold text-black mb-2 group-hover:text-gold-600 transition-colors">
                                    {item.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Unlisted items (if any) */}
              {directoryItems.filter(item => !item.category || item.category === 'Other').length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-black mb-4 pb-2 border-b border-gray-300">
                    Other
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {directoryItems
                      .filter(item => !item.category || item.category === 'Other')
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gold-500 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                                <Icon className="w-6 h-6 text-gold-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-black mb-2 group-hover:text-gold-600 transition-colors">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is not logged in, show landing page with stepper form
  return <HomepageStepperForm />;
}

// Stepper Form Component
function HomepageStepperForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    serviceType: '',
    projectType: '',
    timeline: '',
    propertyType: '',
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    {
      question: 'What are you looking for?',
      options: [
        { value: 'development', label: 'Real Estate Development Opportunities' },
        { value: 'acquisition', label: 'Property Acquisition & Investment' },
        { value: 'network', label: 'Connect with Real Estate Professionals' },
      ],
    },
    {
      question: 'What type of development opportunity?',
      options: [
        { value: 'residential', label: 'Residential Development' },
        { value: 'commercial', label: 'Commercial Development' },
        { value: 'mixed', label: 'Mixed-Use Development' },
        { value: 'land', label: 'Land Acquisition' },
        { value: 'other', label: 'Other' },
    ],
      condition: (data: typeof formData) => data.serviceType === 'development',
    },
    {
      question: 'What is your timeline?',
      options: [
        { value: 'asap', label: 'Immediate Opportunity' },
        { value: 'month', label: 'Within 30 Days' },
        { value: 'quarter', label: 'Within 90 Days' },
        { value: 'flexible', label: 'Exploring Options' },
      ],
      condition: (data: typeof formData) => data.serviceType === 'development' || data.serviceType === 'acquisition',
    },
    {
      question: 'What type of property?',
      options: [
        { value: 'single', label: 'Single Family Home' },
        { value: 'multi', label: 'Multi-Family' },
        { value: 'condo', label: 'Condo' },
        { value: 'commercial', label: 'Commercial' },
      ],
    },
  ];

  const getVisibleSteps = () => {
    return steps.filter((step, index) => {
      if (step.condition) {
        return step.condition(formData);
      }
      // Show property type step for acquisition or development
      if (index === 3) {
        return formData.serviceType === 'acquisition' || formData.serviceType === 'development';
      }
      return true;
    });
  };

  const handleOptionSelect = (value: string) => {
    const visibleSteps = getVisibleSteps();
    const currentVisibleStep = visibleSteps[currentStep];
    
    // Map step to form data key
    let stepKey = '';
    if (currentVisibleStep?.question === 'What are you looking for?') {
      stepKey = 'serviceType';
    } else if (currentVisibleStep?.question === 'What type of development opportunity?') {
      stepKey = 'projectType';
    } else if (currentVisibleStep?.question === 'What is your timeline?') {
      stepKey = 'timeline';
    } else if (currentVisibleStep?.question === 'What type of property?') {
      stepKey = 'propertyType';
    }
    
    setFormData(prev => ({ ...prev, [stepKey]: value }));
    
    // Auto-advance to next step
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 300);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
      } else {
        const errorMessage = data.error || 'Submission failed';
        console.error('Form submission error:', errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleSteps = getVisibleSteps();
  const totalSteps = visibleSteps.length + 1; // +1 for contact info step
  const isContactStep = currentStep >= visibleSteps.length;

  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <section className="min-h-screen flex items-center bg-black text-white py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full relative z-10">
          {/* Progress Indicator */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-gold-500 w-8'
                      : 'bg-white/20 w-2'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckIcon className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Thank You!
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-4">
                Your information has been sent to our team.
              </p>
              <p className="text-base sm:text-lg text-gray-400">
                We'll be in touch shortly. If you have any questions, reach out to{' '}
                <a 
                  href="mailto:support@mnuda.com" 
                  className="text-gold-400 hover:text-gold-300 underline"
                >
                  support@mnuda.com
                </a>
              </p>
            </div>
          ) : isContactStep ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-8 text-center">
                Let's Get Started
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-all"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 px-6 py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white font-bold hover:bg-white/20 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  {!isSubmitting && <ArrowRightIcon className="w-5 h-5" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 sm:mb-12 leading-tight">
                {visibleSteps[currentStep]?.question}
              </h2>
              
              <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
                {visibleSteps[currentStep]?.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white text-lg sm:text-xl font-semibold hover:bg-white/20 hover:border-gold-500 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      <ArrowRightIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
                
                {/* Community button - show below options */}
                {currentStep === 0 && (
                  <Link
                    href="/map"
                    className="block w-full px-6 py-4 bg-gold-500/20 backdrop-blur-sm border-2 border-gold-500/50 rounded-lg text-white text-lg sm:text-xl font-semibold hover:bg-gold-500/30 hover:border-gold-500 transition-all text-center group mt-4"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Explore Minnesota Development & Acquisition Map</span>
                      <ArrowRightIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )}
              </div>

              {/* Back button for steps after the first */}
              {currentStep > 0 && (
                <div className="mt-8">
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white font-bold hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
