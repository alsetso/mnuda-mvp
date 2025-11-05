'use client';

import { useState, useRef, ChangeEvent } from 'react';
import PageLayout from '@/components/PageLayout';
import {
  ArrowPathIcon,
  EnvelopeIcon,
  UserGroupIcon,
  MapPinIcon,
  BoltIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

type WorkflowType = 'addresses' | 'people';
type ActionType = 'transform' | 'email' | 'api';

interface WorkflowConfig {
  type: WorkflowType;
  file: File | null;
  fileName: string;
  actions: ActionType[];
  emailTemplate: string;
  emailSubject: string;
  apiServices: string[];
}

const steps = [
  { number: 1, label: 'Type' },
  { number: 2, label: 'Upload' },
  { number: 3, label: 'Actions' },
  { number: 4, label: 'Configure' },
  { number: 5, label: 'Review' },
];

export default function WorkflowPageClient() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<WorkflowConfig>({
    type: 'addresses',
    file: null,
    fileName: '',
    actions: ['transform'],
    emailTemplate: '',
    emailSubject: '',
    apiServices: [],
  });

  const handleTypeChange = (type: WorkflowType) => {
    setConfig(prev => ({ ...prev, type }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfig(prev => ({
        ...prev,
        file,
        fileName: file.name,
      }));
    }
  };

  const handleActionToggle = (action: ActionType) => {
    setConfig(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action],
    }));
  };

  const handleInputChange = (field: keyof WorkflowConfig, value: string | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleApiServiceToggle = (service: string) => {
    setConfig(prev => ({
      ...prev,
      apiServices: prev.apiServices.includes(service)
        ? prev.apiServices.filter(s => s !== service)
        : [...prev.apiServices, service],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return config.file !== null;
      case 3:
        return config.actions.length > 0;
      case 4:
        if (config.actions.includes('email')) {
          return config.emailSubject.trim().length > 0 && config.emailTemplate.trim().length > 0;
        }
        if (config.actions.includes('api')) {
          return config.apiServices.length > 0;
        }
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowComingSoon(true);
  };

  const getFileSize = () => {
    if (!config.file) return '';
    const sizeInMB = config.file.size / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  };

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.105em] text-black mb-6 leading-tight font-libre-baskerville italic">
            Workflow
            <span className="block text-gold-600 mt-2">Bulk Data Transformation</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            Transform and process bulk lists of addresses or people through automated workflows, email campaigns, and data transformations.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 lg:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step) => (
                  <div key={step.number} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          currentStep === step.number
                            ? 'bg-gold-600 text-white'
                            : currentStep > step.number
                            ? 'bg-gold-200 text-gold-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.number ? '✓' : step.number}
                      </div>
                      <span className="text-xs font-medium text-gray-600 mt-2 text-center hidden sm:block">
                        {step.label}
                      </span>
                    </div>
                    {step.number < 5 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          currentStep > step.number ? 'bg-gold-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-6 min-h-[400px]">
              {/* Step 1: Workflow Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Select Workflow Type</h2>
                    <p className="text-gray-600">Choose the type of data you want to process</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={() => handleTypeChange('addresses')}
                      className={`p-8 rounded-xl border-2 transition-all text-left ${
                        config.type === 'addresses'
                          ? 'border-gold-500 bg-gold-50 shadow-md'
                          : 'border-gray-200 hover:border-gold-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                          <MapPinIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-bold text-xl">Addresses</span>
                        <p className="text-sm text-gray-600 text-center">
                          Bulk address processing, geocoding, and transformation
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleTypeChange('people')}
                      className={`p-8 rounded-xl border-2 transition-all text-left ${
                        config.type === 'people'
                          ? 'border-gold-500 bg-gold-50 shadow-md'
                          : 'border-gray-200 hover:border-gold-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                          <UserGroupIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-bold text-xl">People</span>
                        <p className="text-sm text-gray-600 text-center">
                          Contact lists, email campaigns, and people data
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: File Upload */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Upload Data File</h2>
                    <p className="text-gray-600">
                      Upload a CSV file with your {config.type === 'addresses' ? 'addresses' : 'people'} data
                    </p>
                  </div>
                  {!config.file ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-gold-500 transition-colors"
                    >
                      <DocumentArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-semibold text-lg mb-2">
                        Click to upload CSV file
                      </p>
                      <p className="text-sm text-gray-500">
                        CSV files up to 50MB. Supported formats: .csv
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-gold-200 bg-gold-50 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gold-600 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-black">{config.fileName}</div>
                            <div className="text-sm text-gray-600">{getFileSize()}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setConfig(prev => ({ ...prev, file: null, fileName: '' }));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-sm font-semibold text-gray-600 hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Actions */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Select Actions</h2>
                    <p className="text-gray-600">Choose what actions to perform on your data</p>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-6 rounded-xl border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={config.actions.includes('transform')}
                        onChange={() => handleActionToggle('transform')}
                        className="w-5 h-5 text-gold-600 rounded mt-1"
                      />
                      <ArrowPathIcon className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg mb-1">Data Transformation</div>
                        <div className="text-sm text-gray-600">
                          Normalize, format, and clean your data automatically
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-6 rounded-xl border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={config.actions.includes('email')}
                        onChange={() => handleActionToggle('email')}
                        className="w-5 h-5 text-gold-600 rounded mt-1"
                      />
                      <EnvelopeIcon className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg mb-1">Email Campaign</div>
                        <div className="text-sm text-gray-600">
                          Send personalized bulk emails to your contacts
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-6 rounded-xl border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={config.actions.includes('api')}
                        onChange={() => handleActionToggle('api')}
                        className="w-5 h-5 text-gold-600 rounded mt-1"
                      />
                      <BoltIcon className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg mb-1">API Enrichment</div>
                        <div className="text-sm text-gray-600">
                          Enrich your data using external APIs and services
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Configuration */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Configure Actions</h2>
                    <p className="text-gray-600">Set up the details for your selected actions</p>
                  </div>

                  {config.actions.includes('email') && (
                    <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-xl font-bold text-black mb-4">Email Campaign Settings</h3>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={config.emailSubject}
                          onChange={(e) => handleInputChange('emailSubject', e.target.value)}
                          placeholder="Enter email subject line..."
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Template
                        </label>
                        <textarea
                          value={config.emailTemplate}
                          onChange={(e) => handleInputChange('emailTemplate', e.target.value)}
                          placeholder="Enter your email template. Use {{name}} for personalization..."
                          rows={6}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use variables like {`{{name}}`}, {`{{email}}`} for personalization
                        </p>
                      </div>
                    </div>
                  )}

                  {config.actions.includes('api') && (
                    <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-xl font-bold text-black mb-4">API Services</h3>
                      <div className="space-y-3">
                        {config.type === 'addresses' ? (
                          <>
                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                              <input
                                type="checkbox"
                                checked={config.apiServices.includes('geocoding')}
                                onChange={() => handleApiServiceToggle('geocoding')}
                                className="w-5 h-5 text-gold-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-black">Geocoding</div>
                                <div className="text-sm text-gray-600">Convert addresses to coordinates</div>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                              <input
                                type="checkbox"
                                checked={config.apiServices.includes('property-data')}
                                onChange={() => handleApiServiceToggle('property-data')}
                                className="w-5 h-5 text-gold-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-black">Property Data</div>
                                <div className="text-sm text-gray-600">Enrich with property information</div>
                              </div>
                            </label>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                              <input
                                type="checkbox"
                                checked={config.apiServices.includes('contact-enrichment')}
                                onChange={() => handleApiServiceToggle('contact-enrichment')}
                                className="w-5 h-5 text-gold-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-black">Contact Enrichment</div>
                                <div className="text-sm text-gray-600">Enrich contact information</div>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                              <input
                                type="checkbox"
                                checked={config.apiServices.includes('verification')}
                                onChange={() => handleApiServiceToggle('verification')}
                                className="w-5 h-5 text-gold-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-black">Email Verification</div>
                                <div className="text-sm text-gray-600">Verify email addresses</div>
                              </div>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {!config.actions.includes('email') && !config.actions.includes('api') && (
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                      <p className="text-gray-600">
                        No additional configuration needed for selected actions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Review Your Workflow</h2>
                    <p className="text-gray-600">Review your configuration before submitting</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Workflow Type
                      </div>
                      <div className="flex items-center gap-3">
                        {config.type === 'addresses' ? (
                          <MapPinIcon className="w-6 h-6 text-gray-600" />
                        ) : (
                          <UserGroupIcon className="w-6 h-6 text-gray-600" />
                        )}
                        <span className="font-bold text-black text-lg capitalize">{config.type}</span>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Data File
                      </div>
                      <div className="flex items-center gap-3">
                        <DocumentArrowUpIcon className="w-6 h-6 text-gray-600" />
                        <span className="font-semibold text-black">{config.fileName}</span>
                        <span className="text-sm text-gray-500">({getFileSize()})</span>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Selected Actions
                      </div>
                      <div className="space-y-2">
                        {config.actions.map((action) => (
                          <div key={action} className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-gold-600" />
                            <span className="font-semibold text-black capitalize">
                              {action === 'transform'
                                ? 'Data Transformation'
                                : action === 'email'
                                ? 'Email Campaign'
                                : 'API Enrichment'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {config.actions.includes('email') && (
                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Email Settings
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">Subject: </span>
                            <span className="font-semibold text-black">{config.emailSubject || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Template: </span>
                            <span className="font-semibold text-black">
                              {config.emailTemplate ? `${config.emailTemplate.length} characters` : 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {config.actions.includes('api') && config.apiServices.length > 0 && (
                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          API Services
                        </div>
                        <div className="space-y-2">
                          {config.apiServices.map((service) => (
                            <div key={service} className="flex items-center gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-gold-600" />
                              <span className="font-semibold text-black capitalize">
                                {service.replace('-', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coming Soon Message */}
                  {showComingSoon && (
                    <div className="p-6 bg-gold-50 rounded-xl border-2 border-gold-200">
                      <h3 className="text-lg font-bold text-gold-900 mb-2">Service Coming Soon</h3>
                      <p className="text-gold-800 mb-3">
                        We&apos;re working on finalizing this service. In the meantime, please reach out to us at{' '}
                        <a
                          href="mailto:support@mnuda.com"
                          className="font-semibold underline hover:text-gold-600"
                        >
                          support@mnuda.com
                        </a>
                        {' '}to discuss your workflow automation needs.
                      </p>
                      <button
                        onClick={() => setShowComingSoon(false)}
                        className="text-sm font-semibold text-gold-700 hover:text-gold-900 underline"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                Previous
              </button>
              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Next
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-gold-600 text-white rounded-xl font-semibold hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Submit Workflow
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
