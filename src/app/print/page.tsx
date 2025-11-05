'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { 
  CreditCardIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

type ProductType = 'business-cards' | 'postcards' | 'letters';
type ServiceOption = 'print-only' | 'print-and-mail';

interface ProductSelection {
  type: ProductType;
  quantity: string;
  mailingService: ServiceOption | null;
  mailingQuantity?: string;
}

const products = {
  'business-cards': {
    name: 'Deluxe Business Cards',
    description: 'Premium quality business cards with high-end finishes',
    icon: CreditCardIcon,
    features: [
      'Premium cardstock (100lb cover)',
      'Full-color printing both sides',
      'Glossy or matte finish options',
      'Rounded corners available',
      'UV coating option'
    ],
    quantityOptions: ['250', '500', '1000', '2500', '5000'],
    hasMailingService: false,
  },
  'postcards': {
    name: 'Postcards',
    description: 'High-quality postcards perfect for direct mail campaigns',
    icon: EnvelopeIcon,
    features: [
      'Thick 16pt cardstock',
      'Full-color printing',
      'Glossy UV coating',
      'Standard postcard size (4" x 6")',
      'Custom sizes available'
    ],
    quantityOptions: ['500', '1000', '2500', '5000', '10000'],
    hasMailingService: true,
  },
  'letters': {
    name: 'Letters & Copy',
    description: 'Professional letterhead and marketing copy',
    icon: DocumentTextIcon,
    features: [
      'Premium 24lb paper',
      'Full-color printing',
      'Custom letterhead design',
      'Envelope printing available',
      'Bulk pricing available'
    ],
    quantityOptions: ['250', '500', '1000', '2500', '5000'],
    hasMailingService: true,
  },
};

export default function PrintPage() {
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'review'>('select');
  const [showPreviewMessage, setShowPreviewMessage] = useState(false);

  const handleProductToggle = (type: ProductType) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.type === type);
      if (existing) {
        return prev.filter(p => p.type !== type);
      } else {
        return [...prev, { type, quantity: '', mailingService: null }];
      }
    });
  };

  const handleQuantityChange = (type: ProductType, quantity: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.type === type ? { ...p, quantity } : p)
    );
  };

  const handleMailingServiceChange = (type: ProductType, service: ServiceOption) => {
    setSelectedProducts(prev =>
      prev.map(p => p.type === type ? { ...p, mailingService: service } : p)
    );
  };

  const handleMailingQuantityChange = (type: ProductType, quantity: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.type === type ? { ...p, mailingQuantity: quantity } : p)
    );
  };

  const isProductSelected = (type: ProductType) => {
    return selectedProducts.some(p => p.type === type);
  };

  const canProceedToConfigure = selectedProducts.length > 0;
  const canProceedToReview = selectedProducts.every(p => 
    p.quantity && 
    (!products[p.type].hasMailingService || (p.mailingService && p.mailingQuantity))
  );

  const handleNext = () => {
    if (currentStep === 'select' && canProceedToConfigure) {
      setCurrentStep('configure');
    } else if (currentStep === 'configure' && canProceedToReview) {
      setCurrentStep('review');
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select');
    } else if (currentStep === 'review') {
      setCurrentStep('configure');
    }
  };

  const handleSubmit = () => {
    setShowPreviewMessage(true);
  };

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
      {/* Hero Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.105em] text-black mb-6 leading-tight font-libre-baskerville italic">
            Print Marketing
            <span className="block text-gold-600 mt-2">Materials & Services</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Choose your marketing materials and we&apos;ll handle the printing and mailing for you.
          </p>
        </div>
      </section>

      {/* Step Indicator */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 'select', label: 'Select Products' },
              { step: 'configure', label: 'Configure' },
              { step: 'review', label: 'Review' },
            ].map((item, index, array) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep === item.step
                        ? 'bg-gold-600 text-white'
                        : currentStep === 'review' && item.step === 'configure'
                        ? 'bg-gold-200 text-gold-700'
                        : currentStep === 'review' && item.step === 'select'
                        ? 'bg-gold-200 text-gold-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {(currentStep === 'review' && item.step !== 'review') ? '✓' : index + 1}
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-2 hidden sm:block">
                    {item.label}
                  </span>
                </div>
                {index < array.length - 1 && (
                  <div
                    className={`h-1 w-16 mx-4 ${
                      currentStep === 'review' || (currentStep === 'configure' && item.step === 'select')
                        ? 'bg-gold-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
            {/* Step 1: Select Products */}
            {currentStep === 'select' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-black mb-2">What would you like to print?</h2>
                  <p className="text-gray-600">Select one or more marketing materials to get started</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(Object.entries(products) as [ProductType, typeof products[ProductType]][]).map(([type, product]) => {
                    const Icon = product.icon;
                    const isSelected = isProductSelected(type);

                    return (
                      <button
                        key={type}
                        onClick={() => handleProductToggle(type)}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50 shadow-md'
                            : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-gold-600' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="w-6 h-6 text-gold-600" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                        <ul className="space-y-1.5">
                          {product.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="text-gold-600">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {product.hasMailingService && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-gold-700 font-semibold">
                              <TruckIcon className="w-4 h-4" />
                              Mailing service available
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Configure */}
            {currentStep === 'configure' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-black mb-2">Configure Your Order</h2>
                  <p className="text-gray-600">Set quantities and mailing options for your selected products</p>
                </div>

                <div className="space-y-8">
                  {selectedProducts.map((selection) => {
                    const product = products[selection.type];
                    const Icon = product.icon;

                    return (
                      <div key={selection.type} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gold-600 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-black">{product.name}</h3>
                            <p className="text-sm text-gray-600">{product.description}</p>
                          </div>
                        </div>

                        {/* Quantity Selection */}
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Quantity
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {product.quantityOptions.map((qty) => (
                              <button
                                key={qty}
                                onClick={() => handleQuantityChange(selection.type, qty)}
                                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                                  selection.quantity === qty
                                    ? 'border-gold-500 bg-gold-50 text-gold-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gold-300'
                                }`}
                              >
                                {qty}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mailing Service */}
                        {product.hasMailingService && (
                          <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                              Mailing Service
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={() => handleMailingServiceChange(selection.type, 'print-only')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  selection.mailingService === 'print-only'
                                    ? 'border-gold-500 bg-gold-50'
                                    : 'border-gray-200 hover:border-gold-300'
                                }`}
                              >
                                <div className="font-semibold text-black mb-1">Print Only</div>
                                <div className="text-xs text-gray-600">We&apos;ll print and ship to you</div>
                              </button>
                              <button
                                onClick={() => handleMailingServiceChange(selection.type, 'print-and-mail')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  selection.mailingService === 'print-and-mail'
                                    ? 'border-gold-500 bg-gold-50'
                                    : 'border-gray-200 hover:border-gold-300'
                                }`}
                              >
                                <div className="font-semibold text-black mb-1 flex items-center gap-2">
                                  <TruckIcon className="w-4 h-4" />
                                  Print & Mail
                                </div>
                                <div className="text-xs text-gray-600">We&apos;ll print and mail directly</div>
                              </button>
                            </div>

                            {selection.mailingService === 'print-and-mail' && (
                              <div className="mt-4">
                                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                  How many to mail?
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                  {product.quantityOptions.map((qty) => (
                                    <button
                                      key={qty}
                                      onClick={() => handleMailingQuantityChange(selection.type, qty)}
                                      className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                                        selection.mailingQuantity === qty
                                          ? 'border-gold-500 bg-gold-50 text-gold-700'
                                          : 'border-gray-200 bg-white text-gray-700 hover:border-gold-300'
                                      }`}
                                    >
                                      {qty}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-black mb-2">Review Your Order</h2>
                  <p className="text-gray-600">Review your selections before submitting</p>
                </div>

                {/* Preview Message */}
                {showPreviewMessage && (
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
                      {' '}to discuss your print marketing needs.
                    </p>
                    <button
                      onClick={() => setShowPreviewMessage(false)}
                      className="text-sm font-semibold text-gold-700 hover:text-gold-900 underline"
                    >
                      Close
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {selectedProducts.map((selection) => {
                    const product = products[selection.type];
                    const Icon = product.icon;

                    return (
                      <div key={selection.type} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gold-600 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-black">{product.name}</h3>
                              <div className="text-sm text-gray-600 mt-1">
                                Quantity: {selection.quantity}
                              </div>
                              {selection.mailingService && (
                                <div className="text-sm text-gray-600">
                                  Service: {selection.mailingService === 'print-only' ? 'Print Only' : 'Print & Mail'}
                                  {selection.mailingQuantity && ` (${selection.mailingQuantity} to mail)`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 'select'}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {currentStep === 'review' ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gold-600 text-white rounded-xl font-semibold hover:bg-gold-700 transition-all flex items-center gap-2"
                >
                  Submit Order
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'select' && !canProceedToConfigure) ||
                    (currentStep === 'configure' && !canProceedToReview)
                  }
                  className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Next
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

