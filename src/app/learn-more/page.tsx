'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LearnMorePage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
    businessName: '',
    businessUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [useTestMode, setUseTestMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const validateStep1 = () => {
    return formData.firstName.trim() !== '' && 
           formData.lastName.trim() !== '' && 
           formData.phone.trim() !== '';
  };

  const handleNext = () => {
    if (currentStep < totalSteps && validateStep1()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Choose webhook URL based on test mode
      const webhookUrl = useTestMode 
        ? 'https://alsetcole.app.n8n.cloud/webhook-test/47b85f5e-17ab-459b-9e1d-b03f916916b7'
        : 'https://alsetcole.app.n8n.cloud/webhook/47b85f5e-17ab-459b-9e1d-b03f916916b7';

      // Prepare payload with all form inputs
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
        businessName: formData.businessName,
        businessUrl: formData.businessUrl,
        timestamp: new Date().toISOString(),
        source: 'MNUDA Learn More Page',
        mode: useTestMode ? 'test' : 'production'
      };

      console.log('Submitting to webhook:', webhookUrl);
      console.log('Mode:', useTestMode ? 'TEST' : 'PRODUCTION');
      console.log('Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.text();
        console.log('Response data:', responseData);
        setIsSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ firstName: '', lastName: '', phone: '', email: '', notes: '', businessName: '', businessUrl: '' });
          setCurrentStep(1);
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error && error.message.includes('404')) {
        setSubmitError('The webhook endpoint is not available (404). Please check the webhook URL or try again later.');
      } else {
        setSubmitError('There was an error submitting your form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-lg font-semibold">
                <span className="text-[#014463]">MN</span>
                <span className="text-[#1dd1f5]">UDA</span>
              </Link>
            </div>
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-[#1dd1f5] transition-colors"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          MNUDA is 100% free — because every investor deserves powerful real estate tools.
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          We don&apos;t charge for skip tracing or property insights. Instead, we fund MNUDA by offering premium tools and services to businesses who need more.
        </p>
        <p className="text-base text-gray-500">
          That&apos;s why your data stays local, we don&apos;t store your lookups, and you&apos;ll never hit a paywall.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 pb-12">
        {/* Contact Form */}
        <section id="contact-form" className="bg-gray-50 rounded-lg p-6 mb-16">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Your Project
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={useTestMode}
                    onChange={(e) => setUseTestMode(e.target.checked)}
                    className="rounded border-gray-300 text-[#1dd1f5] focus:ring-[#1dd1f5]"
                  />
                  <label htmlFor="testMode" className="text-sm text-gray-600">
                    Use Test Webhook
                  </label>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
                  <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#1dd1f5] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600">
                    Your project details have been submitted. We&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                            placeholder="Your first name"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                            placeholder="Your last name"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Project Details */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Project Details</h4>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name
                          </label>
                          <input
                            type="text"
                            id="businessName"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                            placeholder="Your business name"
                          />
                        </div>
                        <div>
                          <label htmlFor="businessUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            Business Website
                          </label>
                          <input
                            type="url"
                            id="businessUrl"
                            value={formData.businessUrl}
                            onChange={(e) => setFormData({ ...formData, businessUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                          Project Details & Requirements
                        </label>
                        <textarea
                          id="notes"
                          rows={4}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                          placeholder="Tell us about your project, volume needs, specific requirements, timeline, etc."
                        />
                      </div>
                    </div>
                  )}
                  
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{submitError}</p>
                    </div>
                  )}
                  
                  {/* Navigation Buttons */}
                  <div className="pt-4 flex justify-between">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    
                    <div className="ml-auto">
                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!validateStep1()}
                          className="px-6 py-2 bg-[#1dd1f5] text-white rounded-md hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-[#1dd1f5] text-white rounded-md hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Project'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
        </section>

        {/* 1. Why It's Free */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why It&apos;s Free</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            We believe real estate data should be accessible. MNUDA is free for investors, agents, and homeowners because we only make money through advanced, enterprise-grade services.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Free for individuals</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">No hidden fees</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">No sign-in required</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Your data isn&apos;t saved by us</span>
            </div>
          </div>
        </section>

        {/* 2. How We Sustain It */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Free for You. Paid for by Businesses.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="w-8 h-8 bg-[#1dd1f5] bg-opacity-10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Custom Skip Tracing</h3>
              <p className="text-xs text-gray-600">High-volume team tools</p>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="w-8 h-8 bg-[#1dd1f5] bg-opacity-10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">API Integrations</h3>
              <p className="text-xs text-gray-600">CRM & platform connections</p>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="w-8 h-8 bg-[#1dd1f5] bg-opacity-10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">White-Label Solutions</h3>
              <p className="text-xs text-gray-600">Your brand, our backend</p>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="w-8 h-8 bg-[#1dd1f5] bg-opacity-10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1dd1f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Data Analysis</h3>
              <p className="text-xs text-gray-600">Records to insights</p>
            </div>
          </div>
          
        </section>

        {/* 3. Trust & Privacy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Data, Your Control.</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            We don&apos;t save your skip traces. Everything you run through MNUDA is processed in your browser or stored locally on your own device. That&apos;s why we can keep it free and private.
          </p>
          
        </section>

        {/* 4. Call to Action */}
        <section className="mb-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">MNUDA is Always Free.</h2>
          <p className="text-lg text-gray-600 mb-8">
            If you need more, we&apos;ll build it with you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-[#1dd1f5] text-white font-medium rounded-lg hover:bg-[#014463] transition-colors"
            >
              Start Free Now
            </Link>
            <button 
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center px-6 py-3 border-2 border-[#1dd1f5] text-[#1dd1f5] font-medium rounded-lg hover:bg-[#1dd1f5] hover:text-white transition-colors"
            >
              Talk to Us About Premium
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
