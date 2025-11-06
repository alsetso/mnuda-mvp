'use client';

import { useState, useRef, ChangeEvent } from 'react';
import PageLayout from '@/components/PageLayout';
import { 
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type Platform = 'facebook' | 'instagram';
type ContentType = 'image' | 'video';

interface AdFormData {
  platform: Platform;
  headline: string;
  subHeadline: string;
  description: string;
  contentType: ContentType;
  contentFile: File | null;
  contentPreview: string | null;
  budget: string;
}

export default function AdvertisingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AdFormData>({
    platform: 'facebook',
    headline: '',
    subHeadline: '',
    description: '',
    contentType: 'image',
    contentFile: null,
    contentPreview: null,
    budget: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreviewMessage, setShowPreviewMessage] = useState(false);

  const handlePlatformChange = (platform: Platform) => {
    setFormData(prev => ({ ...prev, platform }));
  };

  const handleInputChange = (field: keyof AdFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }

    setFormData(prev => ({
      ...prev,
      contentType: isImage ? 'image' : 'video',
      contentFile: file,
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        contentPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeContent = () => {
    setFormData(prev => ({
      ...prev,
      contentFile: null,
      contentPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const steps = [
    { number: 1, label: 'Platform' },
    { number: 2, label: 'Headline' },
    { number: 3, label: 'Description' },
    { number: 4, label: 'Content' },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.headline.trim().length > 0;
      case 3:
        return formData.description.trim().length > 0;
      case 4:
        return formData.contentFile !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowPreviewMessage(true);
  };

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-[-0.05em] text-black mb-2 leading-tight font-libre-baskerville italic">
          Create Ad Campaign
          <span className="block text-gold-600">Facebook & Instagram</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Build and preview your social media ad campaign in just a few simple steps.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-4 lg:space-y-6">
        {/* Form Section */}
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
                  {step.number < 4 && (
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
          <div className="space-y-4">
            {/* Step 1: Platform */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Choose Platform</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePlatformChange('facebook')}
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all bg-white ${
                      formData.platform === 'facebook'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg sm:text-xl">f</span>
                      </div>
                      <span className="font-bold text-base sm:text-lg">Facebook</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePlatformChange('instagram')}
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all bg-white ${
                      formData.platform === 'instagram'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg sm:text-xl">IG</span>
                      </div>
                      <span className="font-bold text-base sm:text-lg">Instagram</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Headline */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Write Headline</h2>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => handleInputChange('headline', e.target.value)}
                      placeholder="Enter your ad headline..."
                      className="w-full px-3 py-2.5 text-base bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.headline.length}/100 characters
                    </p>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.subHeadline}
                      onChange={(e) => handleInputChange('subHeadline', e.target.value)}
                      placeholder="Enter your sub-headline (optional)..."
                      className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                      maxLength={150}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.subHeadline.length}/150 characters
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Description */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Write Description</h2>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter your ad description..."
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>
            )}

            {/* Step 4: Content */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Upload Content</h2>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, contentType: 'image' }))}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all bg-white ${
                        formData.contentType === 'image'
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <PhotoIcon className="w-5 h-5 mx-auto mb-1.5" />
                      <span className="text-xs sm:text-sm font-semibold">Image</span>
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, contentType: 'video' }))}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all bg-white ${
                        formData.contentType === 'video'
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <VideoCameraIcon className="w-5 h-5 mx-auto mb-1.5" />
                      <span className="text-xs sm:text-sm font-semibold">Video</span>
                    </button>
                  </div>
                  {!formData.contentPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-gold-500 transition-colors"
                    >
                      <PhotoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium text-sm mb-1">
                        Click to upload {formData.contentType}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB or MP4, MOV up to 100MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={formData.contentType === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {formData.contentType === 'image' ? (
                          <img
                            src={formData.contentPreview}
                            alt="Preview"
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        ) : (
                          <video
                            src={formData.contentPreview}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        )}
                        <button
                          onClick={removeContent}
                          className="absolute -top-2 -right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <div className="flex-1 w-full">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gold-500 transition-colors"
                        >
                          <PhotoIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium text-xs sm:text-sm mb-1">
                            Click to change {formData.contentType}
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB or MP4, MOV up to 100MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={formData.contentType === 'image' ? 'image/*' : 'video/*'}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gold-600 text-white rounded-lg font-semibold hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                Create Campaign
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Preview</h2>
          
          {/* Preview Message */}
          {showPreviewMessage && (
            <div className="mb-4 p-4 bg-gold-50 rounded-lg border-2 border-gold-200">
              <h3 className="text-base font-bold text-gold-900 mb-2">Service Coming Soon</h3>
              <p className="text-sm text-gold-800 mb-3">
                We&apos;re working on finalizing this service. In the meantime, please reach out to us at{' '}
                <a 
                  href="mailto:support@mnuda.com" 
                  className="font-semibold underline hover:text-gold-600"
                >
                  support@mnuda.com
                </a>
                {' '}to discuss your advertising needs.
              </p>
              <button
                onClick={() => setShowPreviewMessage(false)}
                className="text-xs sm:text-sm font-semibold text-gold-700 hover:text-gold-900 underline"
              >
                Close
              </button>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            {/* Facebook/Instagram Post Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-black text-sm sm:text-base">MNUDA</div>
                  <div className="text-xs text-gray-500">Sponsored</div>
                </div>
                {formData.platform === 'facebook' && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    f
                  </div>
                )}
                {formData.platform === 'instagram' && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    IG
                  </div>
                )}
              </div>

              {/* Description */}
              {formData.description && (
                <div className="p-3 sm:p-4 pb-2">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{formData.description}</p>
                </div>
              )}

              {/* Content */}
              {formData.contentPreview && (
                <div className="w-full">
                  {formData.contentType === 'image' ? (
                    <img
                      src={formData.contentPreview}
                      alt="Ad content"
                      className="w-full object-cover"
                    />
                  ) : (
                    <video
                      src={formData.contentPreview}
                      className="w-full"
                      controls={false}
                    />
                  )}
                </div>
              )}

              {/* Headline */}
              {(formData.headline || formData.subHeadline) && (
                <div className="w-full bg-gray-100 py-3 sm:py-4 px-4 sm:px-6">
                  <div className="max-w-none mx-auto">
                    {formData.headline && (
                      <h3 className="font-bold text-base sm:text-lg text-black text-left">{formData.headline}</h3>
                    )}
                    {formData.subHeadline && (
                      <p className="text-xs sm:text-sm text-gray-600 text-left mt-1">{formData.subHeadline}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Bar */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 flex items-center gap-2 sm:gap-4 text-gray-500 text-xs sm:text-sm">
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>📤 Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

