'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LearnMorePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [useTestMode, setUseTestMode] = useState(false);


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
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
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
          setFormData({ name: '', phone: '', email: '', notes: '' });
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
              <div className="flex items-center justify-between mb-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                        placeholder="Your full name"
                      />
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
                  
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{submitError}</p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#1dd1f5] text-white py-2 px-4 rounded-md hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Project'}
                    </button>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Skip Tracing Tools</h3>
              <p className="text-gray-600">For high-volume teams</p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Integrations</h3>
              <p className="text-gray-600">Connect to your CRM or platform</p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">White-Label Solutions</h3>
              <p className="text-gray-600">Your brand, our backend</p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Analysis & Reporting</h3>
              <p className="text-gray-600">Turn records into insights</p>
            </div>
          </div>
          
        </section>

        {/* 3. Trust & Privacy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Data, Your Control.</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            We don&apos;t save your skip traces. Everything you run through MNUDA is processed in your browser or stored locally on your own device. That&apos;s why we can keep it free and private.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Only</h3>
              <p className="text-gray-600">Your data stays on your device</p>
            </div>
            
            <div className="text-center p-6 border-2 border-red-200 rounded-lg bg-red-50">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cloud Saved</h3>
              <p className="text-gray-600">What other tools do</p>
            </div>
          </div>
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
