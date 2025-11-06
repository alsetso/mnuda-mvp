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
  ArrowRightIcon,
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
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-[-0.05em] text-black mb-2 leading-tight font-libre-baskerville italic">
          Workflow
          <span className="block text-gold-600">Bulk Data Transformation</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Transform and process bulk lists of addresses or people through automated workflows.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-4 lg:space-y-6">
        <div>
          {/* Step Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step) => (
                <div key={step.number} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        currentStep === step.number
                          ? 'bg-gold-600 text-white'
                          : currentStep > step.number
                          ? 'bg-gold-200 text-gold-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <span className="text-xs font-medium text-gray-600 mt-1 text-center hidden sm:block">
                      {step.label}
                    </span>
                  </div>
                  {step.number < 5 && (
                    <div
                      className={`h-1 flex-1 mx-1 sm:mx-2 ${
                        currentStep > step.number ? 'bg-gold-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-4 min-h-[300px] sm:min-h-[400px]">
            {/* Step 1: Workflow Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Select Workflow Type</h2>
                  <p className="text-sm text-gray-600">Choose the type of data you want to process</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => handleTypeChange('addresses')}
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all text-left ${
                      config.type === 'addresses'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-lg flex items-center justify-center">
                        <MapPinIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <span className="font-bold text-lg sm:text-xl">Addresses</span>
                      <p className="text-xs sm:text-sm text-gray-600 text-center">
                        Bulk address processing, geocoding, and transformation
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleTypeChange('people')}
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all text-left ${
                      config.type === 'people'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <span className="font-bold text-lg sm:text-xl">People</span>
                      <p className="text-xs sm:text-sm text-gray-600 text-center">
                        Contact lists, email campaigns, and people data
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: File Upload */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Upload Data File</h2>
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with your {config.type === 'addresses' ? 'addresses' : 'people'} data
                  </p>
                </div>
                {!config.file ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-gold-500 transition-colors"
                  >
                    <DocumentArrowUpIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-semibold text-base sm:text-lg mb-1">
                      Click to upload CSV file
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
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
                  <div className="border-2 border-gold-200 bg-gold-50 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-black text-sm truncate">{config.fileName}</div>
                          <div className="text-xs text-gray-600">{getFileSize()}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConfig(prev => ({ ...prev, file: null, fileName: '' }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-black flex-shrink-0"
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
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Select Actions</h2>
                  <p className="text-sm text-gray-600">Choose what actions to perform on your data</p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                    <input
                      type="checkbox"
                      checked={config.actions.includes('transform')}
                      onChange={() => handleActionToggle('transform')}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded mt-0.5 flex-shrink-0"
                    />
                    <ArrowPathIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black text-base sm:text-lg mb-1">Data Transformation</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Normalize, format, and clean your data automatically
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                    <input
                      type="checkbox"
                      checked={config.actions.includes('email')}
                      onChange={() => handleActionToggle('email')}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded mt-0.5 flex-shrink-0"
                    />
                    <EnvelopeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black text-base sm:text-lg mb-1">Email Campaign</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Send personalized bulk emails to your contacts
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                    <input
                      type="checkbox"
                      checked={config.actions.includes('api')}
                      onChange={() => handleActionToggle('api')}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded mt-0.5 flex-shrink-0"
                    />
                    <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black text-base sm:text-lg mb-1">API Enrichment</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Enrich your data using external APIs and services
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Configuration */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Configure Actions</h2>
                  <p className="text-sm text-gray-600">Set up the details for your selected actions</p>
                </div>

                {config.actions.includes('email') && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-black mb-3">Email Campaign Settings</h3>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={config.emailSubject}
                        onChange={(e) => handleInputChange('emailSubject', e.target.value)}
                        placeholder="Enter email subject line..."
                        className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                        Email Template
                      </label>
                      <textarea
                        value={config.emailTemplate}
                        onChange={(e) => handleInputChange('emailTemplate', e.target.value)}
                        placeholder="Enter your email template. Use {{name}} for personalization..."
                        rows={5}
                        className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 resize-none text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use variables like {`{{name}}`}, {`{{email}}`} for personalization
                      </p>
                    </div>
                  </div>
                )}

                {config.actions.includes('api') && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-black mb-3">API Services</h3>
                    <div className="space-y-2">
                      {config.type === 'addresses' ? (
                        <>
                          <label className="flex items-center gap-2.5 p-3 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                            <input
                              type="checkbox"
                              checked={config.apiServices.includes('geocoding')}
                              onChange={() => handleApiServiceToggle('geocoding')}
                              className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-sm sm:text-base">Geocoding</div>
                              <div className="text-xs sm:text-sm text-gray-600">Convert addresses to coordinates</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-2.5 p-3 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                            <input
                              type="checkbox"
                              checked={config.apiServices.includes('property-data')}
                              onChange={() => handleApiServiceToggle('property-data')}
                              className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-sm sm:text-base">Property Data</div>
                              <div className="text-xs sm:text-sm text-gray-600">Enrich with property information</div>
                            </div>
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="flex items-center gap-2.5 p-3 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                            <input
                              type="checkbox"
                              checked={config.apiServices.includes('contact-enrichment')}
                              onChange={() => handleApiServiceToggle('contact-enrichment')}
                              className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-sm sm:text-base">Contact Enrichment</div>
                              <div className="text-xs sm:text-sm text-gray-600">Enrich contact information</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-2.5 p-3 rounded-lg border-2 border-gray-200 hover:border-gold-300 cursor-pointer transition-all bg-white">
                            <input
                              type="checkbox"
                              checked={config.apiServices.includes('verification')}
                              onChange={() => handleApiServiceToggle('verification')}
                              className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-sm sm:text-base">Email Verification</div>
                              <div className="text-xs sm:text-sm text-gray-600">Verify email addresses</div>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!config.actions.includes('email') && !config.actions.includes('api') && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      No additional configuration needed for selected actions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Review Your Workflow</h2>
                  <p className="text-sm text-gray-600">Review your configuration before submitting</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Workflow Type
                    </div>
                    <div className="flex items-center gap-2.5">
                      {config.type === 'addresses' ? (
                        <MapPinIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      ) : (
                        <UserGroupIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                      <span className="font-bold text-black text-base sm:text-lg capitalize">{config.type}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Data File
                    </div>
                    <div className="flex items-center gap-2.5">
                      <DocumentArrowUpIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <span className="font-semibold text-black text-sm truncate">{config.fileName}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">({getFileSize()})</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Selected Actions
                    </div>
                    <div className="space-y-1.5">
                      {config.actions.map((action) => (
                        <div key={action} className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-gold-600 flex-shrink-0" />
                          <span className="font-semibold text-black text-sm capitalize">
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
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Email Settings
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-xs text-gray-600">Subject: </span>
                          <span className="font-semibold text-black text-sm">{config.emailSubject || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Template: </span>
                          <span className="font-semibold text-black text-sm">
                            {config.emailTemplate ? `${config.emailTemplate.length} characters` : 'Not set'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {config.actions.includes('api') && config.apiServices.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        API Services
                      </div>
                      <div className="space-y-1.5">
                        {config.apiServices.map((service) => (
                          <div key={service} className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gold-600 flex-shrink-0" />
                            <span className="font-semibold text-black text-sm capitalize">
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
                  <div className="p-4 bg-gold-50 rounded-lg border-2 border-gold-200">
                    <h3 className="text-base font-bold text-gold-900 mb-2">Service Coming Soon</h3>
                    <p className="text-sm text-gold-800 mb-3">
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

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 sm:gap-2 text-sm"
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 sm:gap-2 text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gold-600 text-white rounded-lg font-semibold hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 sm:gap-2 text-sm"
              >
                <span>Submit</span>
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
