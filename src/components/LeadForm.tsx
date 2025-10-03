'use client';

import { useState } from 'react';

interface LeadFormProps {
  type: 'buy' | 'sell' | 'loan';
  title: string;
  subtitle: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  [key: string]: string;
}

export default function LeadForm({ type, title, subtitle }: LeadFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    ...(type === 'buy' && { budget: '', propertyType: '', timeline: '' }),
    ...(type === 'sell' && { address: '', propertyType: '', timeline: '' }),
    ...(type === 'loan' && { loanType: '', propertyValue: '', timeline: '' })
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/leads/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Thank you! We&apos;ll contact you soon about your Minnesota real estate needs.');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          ...(type === 'buy' && { budget: '', propertyType: '', timeline: '' }),
          ...(type === 'sell' && { address: '', propertyType: '', timeline: '' }),
          ...(type === 'loan' && { loanType: '', propertyValue: '', timeline: '' })
        });
      } else {
        setMessage('Something went wrong. Please try again or contact us directly.');
        setIsSuccess(false);
      }
    } catch {
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormFields = () => {
    switch (type) {
      case 'buy':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What&apos;s your budget range?</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select your budget range</option>
                  <option value="under-150k">Under $150K</option>
                  <option value="150k-250k">$150K - $250K</option>
                  <option value="250k-350k">$250K - $350K</option>
                  <option value="350k-500k">$350K - $500K</option>
                  <option value="500k-750k">$500K - $750K</option>
                  <option value="750k-1m">$750K - $1M</option>
                  <option value="1m-1.5m">$1M - $1.5M</option>
                  <option value="over-1.5m">Over $1.5M</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What type of property are you looking for?</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select property type</option>
                  <option value="single-family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="duplex">Duplex</option>
                  <option value="multi-family">Multi-Family (3+ units)</option>
                  <option value="land">Land/Lot</option>
                  <option value="commercial">Commercial</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When are you looking to buy?</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select your timeline</option>
                  <option value="asap">ASAP - Ready to buy now</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="1-3-months">1-3 months</option>
                  <option value="3-6-months">3-6 months</option>
                  <option value="6-12-months">6-12 months</option>
                  <option value="just-looking">Just looking/exploring</option>
                </select>
              </div>
            </div>
          </>
        );
      case 'sell':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What&apos;s your property address?</label>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Main St, Minneapolis, MN 55401"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">We&apos;ll use this to provide an accurate market analysis</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What type of property are you selling?</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select property type</option>
                  <option value="single-family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="duplex">Duplex</option>
                  <option value="multi-family">Multi-Family (3+ units)</option>
                  <option value="land">Land/Lot</option>
                  <option value="commercial">Commercial</option>
                  <option value="mobile-home">Mobile Home</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When do you want to sell?</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select your timeline</option>
                  <option value="asap">ASAP - Ready to list now</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="1-3-months">1-3 months</option>
                  <option value="3-6-months">3-6 months</option>
                  <option value="6-12-months">6-12 months</option>
                  <option value="just-exploring">Just exploring/getting info</option>
                </select>
              </div>
            </div>
          </>
        );
      case 'loan':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What type of loan do you need?</label>
                <select
                  name="loanType"
                  value={formData.loanType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select loan type</option>
                  <option value="purchase">Purchase Loan (Buying a home)</option>
                  <option value="refinance">Rate & Term Refinance</option>
                  <option value="cash-out-refinance">Cash-Out Refinance</option>
                  <option value="heloc">Home Equity Line of Credit (HELOC)</option>
                  <option value="construction">Construction Loan</option>
                  <option value="investment">Investment Property Loan</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What&apos;s the property value or loan amount?</label>
                <select
                  name="propertyValue"
                  value={formData.propertyValue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select loan amount range</option>
                  <option value="under-150k">Under $150K</option>
                  <option value="150k-250k">$150K - $250K</option>
                  <option value="250k-350k">$250K - $350K</option>
                  <option value="350k-500k">$350K - $500K</option>
                  <option value="500k-750k">$500K - $750K</option>
                  <option value="750k-1m">$750K - $1M</option>
                  <option value="1m-1.5m">$1M - $1.5M</option>
                  <option value="over-1.5m">Over $1.5M</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When do you need the loan?</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent text-gray-900"
                >
                  <option value="">Select your timeline</option>
                  <option value="asap">ASAP - Need pre-approval now</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="1-3-months">1-3 months</option>
                  <option value="3-6-months">3-6 months</option>
                  <option value="6-12-months">6-12 months</option>
                  <option value="just-exploring">Just exploring/getting info</option>
                </select>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#014463] to-[#1dd1f5] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl md:text-2xl opacity-90">{subtitle}</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
              </div>

              {/* Type-specific fields */}
              <div className="space-y-4">
                {getFormFields()}
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  isSuccess 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1dd1f5] hover:bg-[#014463] text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Interest'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
