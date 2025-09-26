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
      <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#1dd1f5]/10 border border-[#1dd1f5]/20 text-[#1dd1f5] text-sm font-medium mb-8">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Business Solutions Available
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Ready to scale your
            <br />
            <span className="bg-gradient-to-r from-[#1dd1f5] to-[#014463] bg-clip-text text-transparent">
              real estate business?
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            MNUDA is free for individuals, but we build custom solutions for businesses. 
            From data pipelines to AI automation, we can host and scale MNUDA for your specific needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center justify-center px-8 py-4 bg-[#1dd1f5] text-white text-lg font-semibold rounded-xl hover:bg-[#014463] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discuss Your Project
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm text-[#1dd1f5] border-2 border-[#1dd1f5] text-lg font-semibold rounded-xl hover:bg-[#1dd1f5] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Try Free Version
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Custom solutions available
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              Enterprise-grade infrastructure
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              No setup fees
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Business Services Section */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What we can build for you
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We specialize in custom real estate technology solutions. Here&apos;s what we can create for your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Data Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Data Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Custom data pipelines, APIs, and integrations. We can connect MNUDA to your existing CRM, 
                automate data collection, and build custom analytics dashboards.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Custom API integrations
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated data pipelines
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time analytics
                </li>
              </ul>
            </div>

            {/* Web Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Web Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Custom web applications, white-label solutions, and branded interfaces. 
                We can build a completely custom version of MNUDA with your branding and features.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  White-label platforms
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Custom web applications
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Branded interfaces
                </li>
              </ul>
            </div>

            {/* AI Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                AI-powered automation, predictive analytics, and intelligent data processing. 
                We can integrate machine learning to enhance your real estate operations.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated lead scoring
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Predictive analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Smart data processing
                </li>
              </ul>
            </div>

            {/* Inbound Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Inbound Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Lead capture systems, automated follow-up sequences, and CRM integrations. 
                Turn website visitors into qualified real estate leads automatically.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lead capture forms
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated follow-up
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  CRM integrations
                </li>
              </ul>
            </div>

            {/* Outbound Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Outbound Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Automated outreach campaigns, email sequences, and multi-channel marketing. 
                Scale your prospecting with intelligent automation and personalization.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email automation
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multi-channel campaigns
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Personalized outreach
                </li>
              </ul>
            </div>

            {/* Hosting Solutions */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hosting Solutions</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enterprise-grade hosting, scaling, and maintenance. We handle all the technical infrastructure 
                so you can focus on growing your business.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enterprise hosting
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-scaling infrastructure
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 monitoring & support
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="bg-white rounded-2xl p-8 shadow-lg mb-16 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Let&apos;s Build Something Amazing Together
                </h3>
                <p className="text-lg text-gray-600">
                  Tell us about your project and we&apos;ll get back to you within 24 hours with a custom proposal.
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-8">
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
                          rows={6}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                          placeholder="Tell us about your project: What type of solution do you need? (Data, Web, AI, Inbound, Outbound, Hosting) What's your current volume? What specific features do you need? What's your timeline? Any integration requirements?"
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
        <section className="mb-16 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Scale Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            MNUDA is free for individuals, but we build enterprise solutions for businesses. 
            Let&apos;s discuss how we can customize MNUDA for your specific needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center justify-center px-8 py-4 bg-[#1dd1f5] text-white text-lg font-semibold rounded-xl hover:bg-[#014463] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discuss Your Project
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm text-[#1dd1f5] border-2 border-[#1dd1f5] text-lg font-semibold rounded-xl hover:bg-[#1dd1f5] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Try Free Version
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
